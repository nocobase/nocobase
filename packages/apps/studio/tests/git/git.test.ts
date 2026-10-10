// @vitest-environment node
/**
 * Studio's software-development flow over the generic plugins: the design-first proposal (an agent's operation plan
 * decided by the issue's owner) and pull requests (linking, polling GitHub with validators, `studio.merged` moving the
 * issue to Done, failing checks waking the agent, merging from Studio, the `prMerged` entry condition), against a
 * GitHub stand-in.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  GIT_INBOX_SOURCE,
  PR_MERGE_REQUESTED,
  PR_SIGNAL_STOPPED,
  SIGNAL_WAKE_LIMIT,
} from '../../shared/git.js';
import {
  ANALYSIS_INSTRUCTION,
  SOFTWARE_TEMPLATE,
} from '../../server/agents/catalog/workflow-templates.js';
import { createDesignService } from '../../server/agents/design.js';
import { ROLE_AGENT_IDS } from '../../server/agents/catalog/presets.js';
import { makeRoot, runRoleAgentsSeed } from '../agents/role-agents.js';
import {
  apiBaseUrlOf,
  mentionedIssueKeys,
  parsePullRequestUrl,
  repoOfRemote,
} from '../../server/git/links.js';
import { createSecretsService } from '@nocobase/app-server/secrets';
import {
  createGitSecrets,
  GIT_SECRET_PURPOSES,
} from '../../server/git/sealing.js';
import { findPullRequestById, findRepoById } from '../../server/git/store.js';
import { issueKeyOfBranch } from '../../shared/git.js';
import { bindingOf, connectedRepo, tokenConnection } from './helpers.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

const REPO = 'acme/studio';
const PR_URL = (number: number) => `https://github.com/${REPO}/pull/${number}`;

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('bob', 'admin');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  h.roles.set('alice', 'admin');
  const software = (await h.projects.workflows.list(h.viewer('alice'))).find(
    (workflow) => workflow.builtInKey === 'software',
  )!;
  await h.projects.workflows.setDefault(h.viewer('alice'), software.id);
  h.roles.delete('alice');
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

const AGENT_ACTIONS = [
  'pm.issues/view',
  'pm.issues/comment',
  'pm.issues/edit',
  'pm.issues/create',
];

async function detail(issue: Pick<Issue, 'id'>) {
  return h.projects.issueQueries.detail(alice(), issue.id);
}

async function move(issue: Pick<Issue, 'id'>, statusKey: string) {
  const current = await detail(issue);
  return h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function runsOf(issueId: string) {
  return h.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });
}

describe('link rules', () => {
  it('finds the issue a branch rule names, and only suggests the keys a title or body names', () => {
    expect(issueKeyOfBranch(['agent/{key}'], 'agent/pm-12')).toBe('PM-12');
    expect(
      issueKeyOfBranch(['feat/{key}-work', 'agent/{key}'], 'agent/PM-3'),
    ).toBe('PM-3');
    expect(issueKeyOfBranch(['feat/{key}-work'], 'feat/PM-7-work')).toBe(
      'PM-7',
    );
    expect(issueKeyOfBranch(['agent/{key}'], 'agent/echo/PM-3')).toBeNull();
    expect(issueKeyOfBranch(['agent/{key}'], 'fix-login')).toBeNull();
    expect(
      mentionedIssueKeys({
        title: 'PM-4: fix login (see PM-5, utf-8)',
        body: 'Closes PM-4',
      }),
    ).toEqual(['PM-4', 'PM-5']);
    expect(mentionedIssueKeys({ title: 'chore', body: null })).toEqual([]);
  });

  it('reads pull request URLs and GitHub remotes, and where their API is', () => {
    expect(
      parsePullRequestUrl('https://github.com/acme/studio/pull/7/files'),
    ).toEqual({
      repo: 'acme/studio',
      number: 7,
      origin: 'https://github.com',
      url: 'https://github.com/acme/studio/pull/7',
    });
    expect(
      parsePullRequestUrl('https://github.com/acme/studio/issues/7'),
    ).toBeNull();
    expect(repoOfRemote('git@github.com:acme/studio.git')).toEqual({
      repo: 'acme/studio',
      origin: 'https://github.com',
    });
    expect(repoOfRemote('https://github.com/acme/studio.git')).toEqual({
      repo: 'acme/studio',
      origin: 'https://github.com',
    });
    expect(repoOfRemote('/srv/git/studio')).toBeNull();
    expect(apiBaseUrlOf('https://github.com')).toBe('https://api.github.com');
    expect(apiBaseUrlOf('http://127.0.0.1:9000')).toBe(
      'http://127.0.0.1:9000/api/v3',
    );
    expect(
      apiBaseUrlOf('https://ghe.example.com', {
        'ghe.example.com': 'https://api.ghe.example.com/',
      }),
    ).toBe('https://api.ghe.example.com');
  });

  it('seals tokens bound to their record, under the configured keys only', () => {
    const keys = (key: string) =>
      createGitSecrets(
        createSecretsService({ keys: [{ version: 1, key: key.repeat(64) }] }),
      );
    const secrets = keys('a');
    const purpose = GIT_SECRET_PURPOSES.connectionToken;
    const sealed = secrets.seal('ghp_secret', purpose, ['c-1']);
    expect(sealed).not.toContain('ghp_secret');
    expect(secrets.open(sealed, purpose, ['c-1'])).toBe('ghp_secret');
    expect(secrets.open(sealed, purpose, ['c-2'])).toBeNull();
    expect(
      secrets.open(sealed, GIT_SECRET_PURPOSES.privateKey, ['c-1']),
    ).toBeNull();
    expect(keys('b').open(sealed, purpose, ['c-1'])).toBeNull();
    const none = createGitSecrets(createSecretsService({ keys: [] }));
    expect(none.ready).toBe(false);
    expect(() => none.seal('x', purpose, ['c-1'])).toThrow(
      expect.objectContaining({ code: 'SECRETS_KEY_MISSING' }),
    );
  });
});

describe('design first', () => {
  beforeEach(async () => {
    await makeRoot(h, 'root-1');
    await runRoleAgentsSeed(h);
  });

  /**
   * An issue bob creates in Analysis for alice, given to a developer agent: the run of the solution designer, whose
   * stage Analysis is, that bob's assignment started. `actions` are the designer's.
   */
  async function analysisRun(actions: readonly string[] = AGENT_ACTIONS) {
    const agentId = ROLE_AGENT_IDS.solutionDesigner;
    const designer = await h.agents.agents.get(agentId);
    await h.agents.agents.update(agentId, 'root-1', {
      actions: [...actions],
      expectedRevision: designer.revision,
    });
    const developerId = await h.createAgent({ name: 'Developer' });
    const issue = await h.projects.issues.create(bob(), {
      title: 'Rework the export',
      statusKey: 'analysis',
      ownerUserId: 'alice',
      executor: { type: 'agent', id: developerId },
    });
    // The designer's stage starts once the creation commits.
    await expect.poll(async () => (await runsOf(issue.id)).length).toBe(1);
    const payload = await h.claimOne();
    return {
      agentId,
      developerId,
      issue,
      token: payload.cli.credential.content.token as string,
      runId: payload.run.id as string,
    };
  }

  const PROPOSAL =
    '## Understanding\nExport is slow.\n\n## Approach\nStream it.';

  /** The agent submits its design proposal, as `nb-studio issue design-proposal`. */
  const propose = (token: string, issue: Issue, content = PROPOSAL) =>
    h.request('POST', '/designProposals', {
      runToken: token,
      body: { issueId: issue.identifier, content },
    });

  it('starts the solution designer on the Analysis stage when the issue is given to its developer there', async () => {
    const { runId, issue, agentId, developerId } = await analysisRun();
    const run = await h.agents.runs.detail(runId);
    expect(run.agentId).toBe(agentId);
    // The developer stays the executor and waits for In progress.
    expect((await detail(issue)).executor).toEqual({
      type: 'agent',
      id: developerId,
    });
    expect(
      (await runsOf(issue.id)).filter((item) => item.agentId === developerId),
    ).toEqual([]);
    expect(run.inputs[0]).toMatchObject({
      payload: {
        trigger: 'created',
        status: 'analysis',
        instruction: expect.stringContaining(
          `${issue.identifier} (Rework the export) uses the design-first process`,
        ),
      },
    });
    expect(ANALYSIS_INSTRUCTION).toContain('nb-studio issue design-proposal');
  });

  it('keeps an agent from moving on from Analysis by itself', async () => {
    const { token, issue } = await analysisRun();
    const moved = await h.request(
      'PATCH',
      `/projects/issues/${issue.identifier}`,
      { runToken: token, body: { statusKey: 'in_progress' } },
    );
    expect(moved.status).not.toBe(200);
    expect(JSON.stringify(moved.body)).toContain('TRANSITION_NOT_ALLOWED');
    expect((await detail(issue)).statusKey).toBe('analysis');
  });

  it("asks the issue's owner, not who woke the run, and approving moves it to development", async () => {
    const { token, issue, developerId } = await analysisRun();
    expect((await runsOf(issue.id))[0]).toMatchObject({ actorUserId: 'bob' });
    const proposed = await propose(token, issue);
    expect(proposed.status).toBe(200);
    expect(proposed.body.data).toMatchObject({
      statusKey: 'proposal_review',
      proposal: { content: PROPOSAL, authorType: 'agent' },
    });
    // The proposal is a comment of its own kind; the owner gets a card to decide.
    const commented = await detail(issue);
    expect(commented.statusKey).toBe('proposal_review');
    expect(commented.threads.at(-1)?.root).toMatchObject({
      kind: 'proposal',
      content: PROPOSAL,
    });
    await expect
      .poll(() => h.port.sent.filter((sent) => sent.type === 'design_review'))
      .toEqual([
        expect.objectContaining({
          kind: 'decision',
          userIds: ['alice'],
          decisionKey: `design:${issue.id}`,
          subject: expect.objectContaining({ id: issue.id }),
        }),
      ]);

    // Only the owner, the project lead or an administrator approves: bob, who woke the run, may not as a member.
    const design = createDesignService({
      projects: () => h.projects,
      inbox: () => undefined,
    });
    h.roles.set('bob', 'member');
    await expect(design.approve(bob(), issue.id, {})).rejects.toBeInstanceOf(
      Error,
    );
    h.roles.set('bob', 'admin');
    expect((await design.state(alice(), issue.id)).canApprove).toBe(true);
    const approved = await design.approve(alice(), issue.id, {
      comment: 'Go ahead.',
    });
    expect(approved).toMatchObject({
      statusKey: 'in_progress',
      inReview: false,
    });
    await expect
      .poll(() => h.port.settled)
      .toContainEqual({
        decisionKey: `design:${issue.id}`,
        outcome: 'approved',
      });
    // Proposal review runs the proposal reviewer beside the owner's card, without making it the executor.
    expect((await runsOf(issue.id)).map((item) => item.agentId)).toContain(
      ROLE_AGENT_IDS.proposalReviewer,
    );
    expect((await detail(issue)).executor).toEqual({
      type: 'agent',
      id: developerId,
    });
    // In progress runs the developer, the issue's executor, with its stage instruction, for alice.
    const runs = (await runsOf(issue.id)).filter(
      (item) => item.agentId === developerId,
    );
    const inputs = (
      await Promise.all(runs.map((run) => h.agents.runs.detail(run.id)))
    ).flatMap((run) => run.inputs);
    expect(inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            trigger: 'stageEntered',
            to: 'in_progress',
          }),
        }),
      ]),
    );
  });

  it('sends a proposal back with a comment: the issue returns to Analysis and the agent revises', async () => {
    const { token, issue } = await analysisRun();
    await propose(token, issue);
    const design = createDesignService({
      projects: () => h.projects,
      inbox: () => undefined,
    });
    await expect(
      design.requestChanges(alice(), issue.id, { comment: ' ' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    const back = await design.requestChanges(alice(), issue.id, {
      comment: 'Cover the CSV export too.',
    });
    expect(back).toMatchObject({ statusKey: 'analysis', inReview: false });
    const after = await detail(issue);
    expect(after.threads.at(-1)?.root.content).toBe(
      'Cover the CSV export too.',
    );
    await expect
      .poll(() => h.port.settled)
      .toContainEqual({
        decisionKey: `design:${issue.id}`,
        outcome: 'changesRequested',
      });
    // Analysis runs the agent again; a revised proposal replaces the first.
    const revised = await propose(token, issue, '## Approach\nStream both.');
    expect(revised.status).toBe(200);
    expect((await design.state(alice(), issue.id)).proposal?.content).toBe(
      '## Approach\nStream both.',
    );
  });

  it('refuses a proposal outside a run on its issue', async () => {
    const { issue } = await analysisRun();
    const refused = await h.request('POST', '/designProposals', {
      user: 'alice',
      body: { issueId: issue.identifier, content: 'x' },
    });
    expect(refused.status).toBe(403);
  });

  it('refuses a run whose agent may not comment', async () => {
    const { token, issue } = await analysisRun(['pm.issues/view']);
    const refused = await h.request('POST', '/designProposals', {
      runToken: token,
      body: { content: PROPOSAL },
    });
    expect(refused.status).toBe(403);
    expect(
      (
        await h.request('GET', `/designProposals/${issue.id}`, {
          user: 'alice',
        })
      ).body.data.proposal,
    ).toBeNull();
  });

  it("proposes for the run's own issue when it names none", async () => {
    const { token, issue } = await analysisRun();
    const submitted = await h.request('POST', '/designProposals', {
      runToken: token,
      body: { content: PROPOSAL },
    });
    expect(submitted.status).toBe(200);
    expect(submitted.body.data.statusKey).toBe('proposal_review');
    expect(submitted.body.meta.message).toContain('waits for its owner');
    const shown = await h.request('GET', `/designProposals/${issue.id}`, {
      user: 'alice',
    });
    expect(shown.body.data.proposal?.content).toBe(PROPOSAL);
  });
});

describe('pull requests', () => {
  /** An issue alice owns, executed by an agent, in review. */
  async function reviewIssue(title = 'Fix login') {
    const agentId = await h.createAgent({ actions: AGENT_ACTIONS });
    const issue = await h.projects.issues.create(alice(), {
      title,
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await move(issue, 'in_progress');
    await move(issue, 'in_review');
    return { issue, agentId };
  }

  const repoWithToken = () => connectedRepo(h, REPO);

  it('links a pull request by hand and asks the owner to merge it', async () => {
    const { issue } = await reviewIssue();
    h.github.addPull(REPO, {
      number: 1,
      title: 'Fix login',
      head: { ref: 'agent/x', sha: 'a1' },
    });
    const { pullRequest, created } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(1),
      { type: 'user', id: 'alice' },
    );
    expect(created).toBe(true);
    expect(pullRequest).toMatchObject({
      repo: REPO,
      number: 1,
      state: 'open',
      headRef: 'agent/x',
      linkedBy: { type: 'user', id: 'alice', name: 'alice' },
    });
    expect(h.port.sent).toEqual([
      expect.objectContaining({
        source: GIT_INBOX_SOURCE,
        type: PR_MERGE_REQUESTED,
        kind: 'decision',
        userIds: ['alice'],
        decisionKey: `pr:${pullRequest.id}:${issue.id}`,
      }),
    ]);
    const list = await h.git.list(alice(), issue.identifier);
    expect(list).toMatchObject({
      canMerge: true,
      canLink: true,
      applicable: true,
    });
    expect(list.data).toHaveLength(1);
  });

  it('has a section only with a linked repository in the project or a linked pull request', async () => {
    h.roles.set('alice', 'admin');
    const plain = await h.projects.projects.create(alice(), { name: 'Ops' });
    const web = await h.projects.projects.create(alice(), { name: 'Web' });
    await h.projects.projects.addResource(alice(), web.id, {
      type: 'gitRepo',
      url: `https://github.com/${REPO}.git`,
      binding: bindingOf(await tokenConnection(h), REPO),
    });
    const create = (projectId: string) =>
      h.projects.issues.create(alice(), {
        title: 'Task',
        projectId,
        start: false,
      });
    const loose = await create(plain.id);
    expect(await h.git.list(alice(), loose.identifier)).toMatchObject({
      data: [],
      applicable: false,
    });
    const coded = await create(web.id);
    expect(await h.git.list(alice(), coded.identifier)).toMatchObject({
      data: [],
      applicable: true,
    });
    h.github.addPull(REPO, { number: 1, head: { ref: 'fix', sha: 'a1' } });
    await h.git.link(alice(), loose.identifier, PR_URL(1), {
      type: 'user',
      id: 'alice',
    });
    expect(await h.git.list(alice(), loose.identifier)).toMatchObject({
      applicable: true,
    });
  });

  it('links agent branches while polling, and moves the issue to Done once merged, naming who merged', async () => {
    const planned: { type: string; userIds: readonly string[] }[] = [];
    h.projects.events.on('notice.planned', (event) => {
      planned.push(event.notice);
    });
    const { issue } = await reviewIssue();
    const repo = await repoWithToken();
    h.github.addPull(REPO, {
      number: 2,
      title: 'Faster login',
      head: { ref: `agent/${issue.identifier}`, sha: 'b1' },
    });
    await h.git.pollRepo(repo);
    const linked = await h.git.list(alice(), issue.identifier);
    expect(linked.data).toMatchObject([
      { number: 2, state: 'open', linkedBy: { type: 'system' } },
    ]);

    // Nothing changed: every read is answered 304.
    const before = h.github.requests.length;
    await h.git.pollRepo((await findRepoById(h.projects.tx.read(), repo.id))!);
    const again = h.github.requests.slice(before);
    expect(again.length).toBeGreaterThan(0);
    expect(again.every((request) => request.status === 304)).toBe(true);

    h.github.merge(REPO, 2, 'bob');
    await h.git.pollRepo((await findRepoById(h.projects.tx.read(), repo.id))!);
    expect((await detail(issue)).statusKey).toBe('done');
    // The squash commit GitHub reports is kept for deployment marks.
    expect(
      (await findPullRequestById(h.projects.tx.read(), linked.data[0]!.id))
        ?.mergeCommitSha,
    ).toBe(h.github.pull(REPO, 2).merge_commit_sha);
    const moved = (
      await h.projects.issueQueries.activities(alice(), issue.id, {})
    ).data.find(
      (entry) =>
        entry.action === 'status_changed' &&
        (entry.details as { to?: string }).to === 'done',
    );
    expect(moved).toMatchObject({ actorType: 'user', actorId: 'bob' });
    expect(h.port.settled).toContainEqual({
      decisionKey: `pr:${linked.data[0]!.id}:${issue.id}`,
      outcome: 'merged',
    });
    // The followers hear it, except whoever merged it.
    await expect
      .poll(() => planned.filter((notice) => notice.type === 'pr_merged'))
      .toEqual([
        expect.objectContaining({
          kind: 'info',
          userIds: ['alice'],
          actor: expect.objectContaining({ type: 'user', id: 'bob' }),
          params: expect.objectContaining({
            identifier: issue.identifier,
            repo: REPO,
            number: '2',
          }),
        }),
      ]);
  });

  it('waits for every counted pull request', async () => {
    const { issue } = await reviewIssue();
    const repo = await repoWithToken();
    for (const number of [3, 4]) {
      h.github.addPull(REPO, { number, head: { ref: 'x', sha: `s${number}` } });
      await h.git.link(alice(), issue.identifier, PR_URL(number), {
        type: 'user',
        id: 'alice',
      });
    }
    h.github.merge(REPO, 3, 'bob');
    await h.git.pollRepo(repo);
    expect((await detail(issue)).statusKey).toBe('in_review');
    // The other one no longer counts: merged is enough.
    const other = (await h.git.list(alice(), issue.identifier)).data.find(
      (pr) => pr.number === 4,
    )!;
    await h.git.setAutoComplete(alice(), issue.identifier, other.id, true);
    h.github.merge(REPO, 4, 'nobody-here');
    await h.git.pollRepo(repo);
    expect((await detail(issue)).statusKey).toBe('done');
  });

  it('wakes the agent when checks fail, once per head, then tells the owner', async () => {
    const { issue, agentId } = await reviewIssue();
    const repo = await repoWithToken();
    h.github.addPull(REPO, {
      number: 5,
      head: { ref: `agent/${issue.identifier}`, sha: 'c1' },
    });
    await h.git.pollRepo(repo);
    const wakes = async () =>
      (
        await Promise.all(
          (await runsOf(issue.id)).map((run) => h.agents.runs.detail(run.id)),
        )
      )
        .flatMap((run) => run.inputs)
        .filter(
          (input) =>
            (input.payload as { trigger?: string }).trigger ===
            'prChecksFailed',
        );
    h.github.setStatus(REPO, 'c1', 'failure');
    await h.git.pollRepo(repo);
    expect(await wakes()).toHaveLength(1);
    expect((await runsOf(issue.id))[0]).toMatchObject({ agentId });
    await h.git.pollRepo(repo);
    expect(await wakes()).toHaveLength(1);
    for (let head = 2; head <= SIGNAL_WAKE_LIMIT + 1; head += 1) {
      const pull = h.github.pull(REPO, 5);
      pull.head = { ...pull.head, sha: `c${head}` };
      h.github.setStatus(REPO, `c${head}`, 'failure');
      await h.git.pollRepo(repo);
    }
    expect(await wakes()).toHaveLength(SIGNAL_WAKE_LIMIT);
    expect(h.port.sent.map((notice) => notice.type)).toContain(
      PR_SIGNAL_STOPPED,
    );
  });

  it('wakes the agent when its pull request conflicts', async () => {
    const { issue } = await reviewIssue();
    const repo = await repoWithToken();
    h.github.addPull(REPO, {
      number: 6,
      head: { ref: `agent/${issue.identifier}`, sha: 'd1' },
    });
    await h.git.pollRepo(repo);
    h.github.pull(REPO, 6).mergeable_state = 'dirty';
    await h.git.pollRepo(repo);
    const inputs = (
      await Promise.all(
        (await runsOf(issue.id)).map((run) => h.agents.runs.detail(run.id)),
      )
    ).flatMap((run) => run.inputs);
    expect(
      inputs.some(
        (input) =>
          (input.payload as { trigger?: string }).trigger === 'prConflict',
      ),
    ).toBe(true);
  });

  it('tells GitHub’s rate limit apart from a refusal, when merging and when polling', async () => {
    const { issue } = await reviewIssue();
    const repo = await repoWithToken();
    h.github.addPull(REPO, { number: 9, head: { ref: 'x', sha: 'g1' } });
    h.github.setStatus(REPO, 'g1', 'success');
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(9),
      { type: 'user', id: 'alice' },
    );
    const reset = Math.floor(Date.now() / 1000) + 900;
    h.github.rateLimit = {
      status: 403,
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(reset),
      },
    };
    await expect(
      h.git.merge(alice(), issue.identifier, pullRequest.id, 'g1'),
    ).rejects.toMatchObject({
      details: {
        code: 'GITHUB_RATE_LIMITED',
        retryAt: new Date(reset * 1000).toISOString(),
      },
    });
    expect(h.github.pull(REPO, 9).merged).toBe(false);
    expect(await h.git.pollRepo(repo)).toEqual({
      retryAt: new Date(reset * 1000).toISOString(),
    });
    expect(
      (await findRepoById(h.projects.tx.read(), repo.id))?.pollError,
    ).toMatch(/rate limit/u);
  });

  it('merges from Studio as the owner, and marks merged without GitHub', async () => {
    const { issue } = await reviewIssue();
    await repoWithToken();
    h.github.addPull(REPO, { number: 7, head: { ref: 'x', sha: 'e1' } });
    h.github.setStatus(REPO, 'e1', 'success');
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(7),
      { type: 'user', id: 'alice' },
    );
    await expect(
      h.git.merge(h.viewer('carol'), issue.identifier, pullRequest.id, 'e1'),
    ).rejects.toThrow();
    const merged = await h.git.merge(
      alice(),
      issue.identifier,
      pullRequest.id,
      'e1',
    );
    expect(merged).toMatchObject({
      state: 'merged',
      mergedBy: { userId: 'alice', name: 'alice' },
    });
    expect(h.github.pull(REPO, 7).merged).toBe(true);
    expect(
      (await findPullRequestById(h.projects.tx.read(), pullRequest.id))
        ?.mergeCommitSha,
    ).toMatch(/^[0-9a-f]{40}$/u);
    expect((await detail(issue)).statusKey).toBe('done');

    const second = await reviewIssue('Another');
    h.github.addPull(REPO, { number: 8, head: { ref: 'y', sha: 'f1' } });
    const linked = await h.git.link(
      alice(),
      second.issue.identifier,
      PR_URL(8),
      {
        type: 'user',
        id: 'alice',
      },
    );
    const marked = await h.git.markMerged(
      alice(),
      second.issue.identifier,
      linked.pullRequest.id,
    );
    expect(marked).toMatchObject({ state: 'merged', mergedManually: true });
    expect((await detail(second.issue)).statusKey).toBe('done');
    // GitHub still says open: a later read does not reopen it.
    await h.git.refresh(
      alice(),
      second.issue.identifier,
      linked.pullRequest.id,
    );
    expect(
      (await h.git.list(alice(), second.issue.identifier)).data[0]?.state,
    ).toBe('merged');
  });

  it('links from a run with `nb-studio pr link`, to the run’s issue', async () => {
    const agentId = await h.createAgent({
      actions: [...AGENT_ACTIONS, 'studio.git/open-pr'],
    });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Fix login',
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    h.github.addPull(REPO, { number: 9, head: { ref: 'agent/x', sha: 'g1' } });
    const linked = await h.request('POST', '/git/pullRequests', {
      runToken: payload.cli.credential.content.token as string,
      body: { url: PR_URL(9) },
    });
    expect(linked.status).toBe(201);
    expect(linked.body.data).toMatchObject({ number: 9, state: 'open' });
    expect((await h.git.list(alice(), issue.id)).data[0]).toMatchObject({
      linkedBy: { type: 'agent', id: agentId },
    });
  });

  it('keeps an issue out of a status with the prMerged condition until a pull request is merged', async () => {
    h.roles.set('alice', 'admin');
    const software = (await h.projects.workflows.list(alice())).find(
      (workflow) => workflow.isDefault,
    )!;
    await h.projects.workflows.update(alice(), software.id, {
      revision: software.revision,
      definition: {
        ...software.definition,
        states: software.definition.states.map((state) =>
          state.key === 'done'
            ? { ...state, rules: [{ type: 'prMerged', config: {} }] }
            : state,
        ),
      },
    });
    h.roles.delete('alice');
    const { issue } = await reviewIssue();
    await expect(move(issue, 'done')).rejects.toMatchObject({
      code: 'PR_NOT_MERGED',
    });
    h.github.addPull(REPO, { number: 10, head: { ref: 'x', sha: 'h1' } });
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(10),
      { type: 'user', id: 'alice' },
    );
    await h.git.markMerged(alice(), issue.identifier, pullRequest.id);
    expect((await detail(issue)).statusKey).toBe('done');
  });

  async function prActivities(issueId: string) {
    return (
      await h.projects.issueQueries.activities(alice(), issueId, {})
    ).data.filter((entry) => entry.action.startsWith('pr_'));
  }

  it('edits, closes with a reason and reopens a pull request on GitHub, keeping each on the issue’s activity', async () => {
    const { issue } = await reviewIssue();
    await repoWithToken();
    h.github.addPull(REPO, {
      number: 11,
      title: `${issue.identifier}: Fix login`,
      head: { ref: 'agent/x', sha: 'i1' },
    });
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(11),
      { type: 'user', id: 'alice' },
    );
    const id = pullRequest.id;

    const edited = await h.git.edit(
      alice(),
      issue.identifier,
      id,
      { title: 'fix(login): keep the session', body: 'Why and how.' },
      'alice',
    );
    expect(edited.title).toBe('fix(login): keep the session');
    expect(h.github.pull(REPO, 11)).toMatchObject({
      title: 'fix(login): keep the session',
      body: 'Why and how.',
    });
    await h.git.edit(alice(), issue.identifier, id, { draft: true }, 'alice');
    expect(h.github.pull(REPO, 11).draft).toBe(true);
    await h.git.edit(alice(), issue.identifier, id, { draft: false }, 'alice');
    expect(h.github.pull(REPO, 11).draft).toBe(false);
    await expect(
      h.git.edit(alice(), issue.identifier, id, {}, 'alice'),
    ).rejects.toMatchObject({ details: { code: 'INVALID_PR_EDIT' } });

    await expect(
      h.git.close(alice(), issue.identifier, id, { reason: ' ' }, 'alice'),
    ).rejects.toMatchObject({ details: { code: 'INVALID_CLOSE_REASON' } });
    const closed = await h.git.close(
      alice(),
      issue.identifier,
      id,
      { reason: 'Superseded by #12' },
      'alice',
    );
    expect(closed.state).toBe('closed');
    expect(h.github.pull(REPO, 11).state).toBe('closed');
    expect(h.github.comments(REPO, 11)).toEqual([
      `Closed for ${issue.identifier}: Superseded by #12`,
    ]);
    await expect(
      h.git.close(alice(), issue.identifier, id, { reason: 'Again' }, 'alice'),
    ).rejects.toMatchObject({ details: { code: 'PR_NOT_OPEN' } });

    const reopened = await h.git.reopen(alice(), issue.identifier, id, 'alice');
    expect(reopened.state).toBe('open');
    expect(h.github.pull(REPO, 11).state).toBe('open');
    await expect(
      h.git.reopen(alice(), issue.identifier, id, 'alice'),
    ).rejects.toMatchObject({ details: { code: 'PR_NOT_CLOSED' } });

    // Written within the same millisecond, so compared without their order.
    const activities = await prActivities(issue.id);
    expect(activities.map((entry) => entry.action).sort()).toEqual([
      'pr_closed',
      'pr_edited',
      'pr_edited',
      'pr_edited',
      'pr_reopened',
    ]);
    expect(
      activities.find(
        (entry) =>
          entry.action === 'pr_edited' &&
          (entry.details as { fields?: unknown }).fields !== undefined &&
          (entry.details as { fields: string[] }).fields.includes('title'),
      ),
    ).toMatchObject({
      actorType: 'user',
      actorId: 'alice',
      details: {
        pullRequestId: id,
        repo: REPO,
        number: 11,
        fields: ['title', 'body'],
        previousTitle: `${issue.identifier}: Fix login`,
      },
    });
    expect(
      activities.find((entry) => entry.action === 'pr_closed')?.details,
    ).toMatchObject({ reason: 'Superseded by #12' });
  });

  it('leaves a closed pull request out of moving the issue on', async () => {
    const { issue } = await reviewIssue();
    const repo = await repoWithToken();
    const linkedIds: string[] = [];
    for (const number of [12, 13]) {
      h.github.addPull(REPO, {
        number,
        head: { ref: `b${number}`, sha: `j${number}` },
      });
      linkedIds.push(
        (
          await h.git.link(alice(), issue.identifier, PR_URL(number), {
            type: 'user',
            id: 'alice',
          })
        ).pullRequest.id,
      );
    }
    await h.git.close(
      alice(),
      issue.identifier,
      linkedIds[0]!,
      { reason: 'Replaced by #13' },
      'alice',
    );
    h.github.merge(REPO, 13, 'bob');
    await h.git.pollRepo(repo);
    expect((await detail(issue)).statusKey).toBe('done');
  });

  it('lets a run edit and close its issue’s pull request with `nb-studio pr edit|close`', async () => {
    const agentId = await h.createAgent({
      actions: [...AGENT_ACTIONS, 'studio.git/open-pr'],
    });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Fix login',
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    const runToken = payload.cli.credential.content.token as string;
    await repoWithToken();
    h.github.addPull(REPO, {
      number: 14,
      title: 'PM-1: Fix',
      head: { ref: 'agent/y', sha: 'k1' },
    });
    const { pullRequest } = await h.git.link(alice(), issue.id, PR_URL(14), {
      type: 'user',
      id: 'alice',
    });
    const path = (verb: string) =>
      `/git/pullRequests/${pullRequest.id}/${verb}?issueId=${issue.identifier}`;

    const edited = await h.request('POST', path('edit'), {
      runToken,
      body: { title: 'fix(login): keep the session', ready: true },
    });
    expect(edited.status).toBe(200);
    expect(edited.body.data).toMatchObject({
      title: 'fix(login): keep the session',
    });
    const both = await h.request('POST', path('edit'), {
      runToken,
      body: { draft: true, ready: true },
    });
    expect(both.status).toBe(400);

    const closed = await h.request('POST', path('close'), {
      runToken,
      body: { reason: 'Superseded', unlink: true },
    });
    expect(closed.status).toBe(200);
    expect(closed.body.data).toMatchObject({ state: 'closed' });
    expect((await h.git.list(alice(), issue.id)).data).toEqual([]);
    const activities = await prActivities(issue.id);
    expect(activities.map((entry) => entry.action).sort()).toEqual([
      'pr_closed',
      'pr_edited',
    ]);
    expect(
      activities.find((entry) => entry.action === 'pr_closed'),
    ).toMatchObject({
      actorType: 'agent',
      actorId: agentId,
      details: { reason: 'Superseded', unlinked: true },
    });
  });
});

describe('done by hand', () => {
  /** An issue carol (a member) owns in a project alice leads, in `statusKey`. */
  async function projectIssue(statusKey: 'in_review' | 'in_progress') {
    await h.addUser('carol');
    const project = await h.projects.projects.create(alice(), {
      name: 'Studio',
      leadUserId: 'alice',
    });
    await h.projects.projects.addMember(alice(), project.id, {
      userId: 'carol',
    });
    const issue = await h.projects.issues.create(h.viewer('carol'), {
      title: 'Fix login',
      projectId: project.id,
      start: false,
    });
    const carolMoves = async (to: string) => {
      const current = await detail(issue);
      return h.projects.issues.update(h.viewer('carol'), issue.id, {
        revision: current.revision,
        statusKey: to,
      });
    };
    await carolMoves('in_progress');
    if (statusKey === 'in_review') await carolMoves('in_review');
    return { issue, carolMoves };
  }

  it.each(['in_review', 'in_progress'] as const)(
    "moves a member's issue from %s to Done at once, with no approval",
    async (from) => {
      const { carolMoves } = await projectIssue(from);
      const outcome = await carolMoves('done');
      expect(outcome.pendingApproval).toBeUndefined();
      expect(outcome.statusKey).toBe('done');
      expect(await h.projects.approvals.mine(alice())).toHaveLength(0);
    },
  );

  it('moves the issue to Done at once when the project lead moves it', async () => {
    const { issue } = await projectIssue('in_review');
    const outcome = await move(issue, 'done');
    expect(outcome.pendingApproval).toBeUndefined();
    expect(outcome.statusKey).toBe('done');
  });

  it('completes the issue at once when its pull request is merged', async () => {
    const { issue } = await projectIssue('in_review');
    h.github.addPull(REPO, { number: 20, head: { ref: 'x', sha: 'm1' } });
    const { pullRequest } = await h.git.link(
      h.viewer('carol'),
      issue.identifier,
      PR_URL(20),
      { type: 'user', id: 'carol' },
    );
    await h.git.markMerged(h.viewer('carol'), issue.identifier, pullRequest.id);
    expect((await detail(issue)).statusKey).toBe('done');
    expect(await h.projects.approvals.mine(alice())).toHaveLength(0);
  });
});

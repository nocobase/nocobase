// @vitest-environment node
/**
 * Studio's pull requests over the projects plugin: linking, polling GitHub with validators, `studio.merged` moving the
 * issue to Done from In progress, Blocked or In review, failing checks, conflicts and passing checks waking the project
 * manager, and merging from Studio, against a GitHub stand-in.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  GIT_INBOX_SOURCE,
  PR_MERGE_REQUESTED,
  PR_SIGNAL_STOPPED,
  SIGNAL_WAKE_LIMIT,
} from '../../shared/git.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
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
import {
  findPullRequestById,
  findRepoById,
  updateRepo,
} from '../../server/git/store.js';
import { issueKeyOfBranch } from '../../shared/git.js';
import {
  bindingOf,
  connectedRepo,
  mentionAgent,
  tokenConnection,
} from './helpers.js';
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
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

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

describe('pull requests', () => {
  /** An issue alice owns, executed by the project manager, in `statusKey` (in review by default). */
  async function reviewIssue(
    title = 'Fix login',
    statusKey: 'in_progress' | 'blocked' | 'in_review' = 'in_review',
  ) {
    await h.createAgent({ actions: AGENT_ACTIONS });
    const issue = await h.projects.issues.create(alice(), {
      title,
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    if (statusKey !== 'in_progress') await move(issue, statusKey);
    return { issue, agentId: PROJECT_MANAGER_ID };
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

  it('wakes the project manager when checks fail, once per head, then tells the owner', async () => {
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

  it('wakes the project manager when its pull request conflicts', async () => {
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

  it('wakes the project manager once per head when all checks pass, unless the repository turns it off', async () => {
    const { issue } = await reviewIssue();
    const repo = await repoWithToken();
    const poll = async () =>
      h.git.pollRepo((await findRepoById(h.projects.tx.read(), repo.id))!);
    h.github.addPull(REPO, {
      number: 15,
      head: { ref: `agent/${issue.identifier}`, sha: 'p1' },
    });
    await poll();
    const passed = async () =>
      (
        await Promise.all(
          (await runsOf(issue.id)).map((run) => h.agents.runs.detail(run.id)),
        )
      )
        .flatMap((run) => run.inputs)
        .filter(
          (input) =>
            (input.payload as { trigger?: string }).trigger ===
            'prChecksPassed',
        );
    expect(await passed()).toEqual([]);
    h.github.setStatus(REPO, 'p1', 'success');
    await poll();
    expect(await passed()).toEqual([
      expect.objectContaining({
        type: 'signal',
        text: expect.stringContaining(
          'Currently reported required checks of pull request',
        ),
        payload: expect.objectContaining({
          trigger: 'prChecksPassed',
          number: 15,
          headSha: 'p1',
        }),
      }),
    ]);
    expect(
      (await runsOf(issue.id)).every(
        (run) => run.agentId === PROJECT_MANAGER_ID,
      ),
    ).toBe(true);
    // The same head again: once is enough.
    await poll();
    expect(await passed()).toHaveLength(1);
    // A new head that passes wakes it again.
    const pull = h.github.pull(REPO, 15);
    pull.head = { ...pull.head, sha: 'p2' };
    h.github.setStatus(REPO, 'p2', 'success');
    await poll();
    expect(
      (await passed()).map(
        (input) => (input.payload as { headSha?: string }).headSha,
      ),
    ).toEqual(['p1', 'p2']);
    // Turned off for the repository: a passing head wakes nobody.
    await updateRepo(h.projects.tx.read(), repo.id, {
      wakeOnChecksPassed: false,
    });
    pull.head = { ...pull.head, sha: 'p3' };
    h.github.setStatus(REPO, 'p3', 'success');
    await poll();
    expect(await passed()).toHaveLength(2);
  });

  it('does not wake anyone on passing checks of an issue the project manager does not execute', async () => {
    await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'By hand',
      statusKey: 'in_progress',
      executor: { type: 'user', id: 'alice' },
      start: false,
    });
    const repo = await repoWithToken();
    h.github.addPull(REPO, {
      number: 16,
      head: { ref: `agent/${issue.identifier}`, sha: 'q1' },
    });
    await h.git.pollRepo(repo);
    h.github.setStatus(REPO, 'q1', 'success');
    await h.git.pollRepo((await findRepoById(h.projects.tx.read(), repo.id))!);
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it.each(['in_progress', 'blocked', 'in_review'] as const)(
    'completes an issue %s once its pull request is merged',
    async (statusKey) => {
      const { issue } = await reviewIssue('Fix login', statusKey);
      h.github.addPull(REPO, { number: 17, head: { ref: 'x', sha: 'r1' } });
      const { pullRequest } = await h.git.link(
        alice(),
        issue.identifier,
        PR_URL(17),
        { type: 'user', id: 'alice' },
      );
      await h.git.markMerged(alice(), issue.identifier, pullRequest.id);
      expect((await detail(issue)).statusKey).toBe('done');
    },
  );

  it('leaves an issue in backlog, and one whose only pull request is opted out, where it is on a merge', async () => {
    await h.createAgent();
    const waiting = await h.projects.issues.create(alice(), {
      title: 'Not started',
      start: false,
    });
    expect(waiting.statusKey).toBe('backlog');
    h.github.addPull(REPO, { number: 18, head: { ref: 'x', sha: 's1' } });
    const early = await h.git.link(alice(), waiting.identifier, PR_URL(18), {
      type: 'user',
      id: 'alice',
    });
    await h.git.markMerged(alice(), waiting.identifier, early.pullRequest.id);
    expect((await detail(waiting)).statusKey).toBe('backlog');

    const { issue } = await reviewIssue('Opted out');
    h.github.addPull(REPO, { number: 19, head: { ref: 'y', sha: 't1' } });
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(19),
      { type: 'user', id: 'alice' },
    );
    await h.git.setAutoComplete(
      alice(),
      issue.identifier,
      pullRequest.id,
      true,
    );
    await h.git.markMerged(alice(), issue.identifier, pullRequest.id);
    expect((await detail(issue)).statusKey).toBe('in_review');
  });

  for (const signal of ['checks', 'conflict'] as const) {
    it(`counts one ${signal} head once across linked issues that resume development one by one`, async () => {
      const repo = await repoWithToken();
      h.github.addPull(REPO, {
        number: 30,
        head: { ref: 'shared-development', sha: 'shared-head' },
      });
      const issues = [];
      await h.createAgent({ name: 'Developer' });
      for (let index = 0; index < 4; index++) {
        const issue = await h.projects.issues.create(alice(), {
          title: `Linked work ${index}`,
          statusKey: 'in_progress',
          executor: { type: 'agent', id: PROJECT_MANAGER_ID },
          start: false,
        });
        if (index > 0) await move(issue, 'in_review');
        await h.git.link(alice(), issue.id, PR_URL(30), {
          type: 'user',
          id: 'alice',
        });
        issues.push(issue);
      }
      if (signal === 'checks')
        h.github.setStatus(REPO, 'shared-head', 'failure');
      else h.github.pull(REPO, 30).mergeable_state = 'dirty';
      await h.git.pollRepo(repo);
      const pull = (await h.git.list(alice(), issues[0]!.id)).data[0]!;
      expect(
        (await findPullRequestById(h.projects.tx.read(), pull.id))?.signals[
          signal
        ],
      ).toMatchObject({ count: 1 });
      for (const issue of issues) {
        const inputs = (
          await Promise.all(
            (await runsOf(issue.id)).map((run) => h.agents.runs.detail(run.id)),
          )
        ).flatMap((run) => run.inputs);
        expect(
          inputs.filter(
            (input) =>
              (input.payload as { trigger?: string }).trigger ===
              (signal === 'checks' ? 'prChecksFailed' : 'prConflict'),
          ),
        ).toHaveLength(1);
        if ((await detail(issue)).statusKey !== 'in_progress')
          await move(issue, 'in_progress');
        const payload = await h.claimOne();
        expect((await h.agents.runs.get(payload.run.id)).subject.id).toBe(
          issue.id,
        );
        await h.runner(RUNNER_ROUTES.start, payload.run.id, {
          workDir: '/tmp/work',
          adapter: { kind: 'claude' },
          acceptsInput: false,
        });
        expect(
          (
            await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
              summary: 'Done',
              handledInputIds: payload.inputs.map(
                (input: { id: string }) => input.id,
              ),
            })
          ).status,
        ).toBe(200);
      }
      await h.git.pollRepo(repo);
      expect(
        (await findPullRequestById(h.projects.tx.read(), pull.id))?.signals[
          signal
        ],
      ).toMatchObject({ count: 1 });
    });
  }

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
      executor: null,
      statusKey: 'in_progress',
      start: false,
    });
    await mentionAgent(h, 'alice', issue.id, agentId);
    const payload = await h.claimOne();
    expect(payload.agent.id).toBe(agentId);
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
      executor: null,
      statusKey: 'in_progress',
      start: false,
    });
    await mentionAgent(h, 'alice', issue.id, agentId);
    const payload = await h.claimOne();
    expect(payload.agent.id).toBe(agentId);
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
    "moves a member's issue from %s to Done at once",
    async (from) => {
      const { carolMoves } = await projectIssue(from);
      const outcome = await carolMoves('done');
      expect(outcome.statusKey).toBe('done');
    },
  );

  it('moves the issue to Done at once when the project lead moves it', async () => {
    const { issue } = await projectIssue('in_review');
    const outcome = await move(issue, 'done');
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
  });
});

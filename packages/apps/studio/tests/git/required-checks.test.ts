// @vitest-environment node
/**
 * Required and reference checks: an agent is woken once every required check of a head has finished, with why they
 * failed; a failed reference check neither wakes it nor blocks merging; `nb-studio pr checks` reads the failures again;
 * and a manager merges past failed required checks with a reason, which GitHub's branch protection may still refuse.
 */
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findRepoById, updateRepo } from '../../server/git/store.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import type { FakeCheckRun } from './fake-github.js';
import { connectedRepo, mentionAgent } from './helpers.js';

const REPO = 'acme/studio';
const PR_URL = (number: number) => `https://github.com/${REPO}/pull/${number}`;
const ACTIONS = { slug: 'github-actions' };
const PREVIEW = 'Studio preview';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('bob', 'admin');
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

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

/** An issue alice owns, executed by an agent, in development. */
async function developedIssue() {
  await h.createAgent();
  const issue = await h.projects.issues.create(alice(), {
    title: 'Fix login',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
    start: false,
  });
  await move(issue, 'in_progress');
  return issue;
}

/** The repository, with `Studio preview` as its reference check. */
async function repoWithReference() {
  const row = await connectedRepo(h, REPO);
  await updateRepo(h.projects.tx.read(), row.id, {
    referenceChecks: [PREVIEW],
  });
  return (await findRepoById(h.projects.tx.read(), row.id))!;
}

async function checkWakes(issueId: string) {
  const runs = await h.agents.runs.list({
    subjectKind: 'issue',
    subjectId: issueId,
  });
  return (await Promise.all(runs.map((run) => h.agents.runs.detail(run.id))))
    .flatMap((run) => run.inputs)
    .filter(
      (input) =>
        (input.payload as { trigger?: string }).trigger === 'prChecksFailed',
    );
}

const failing = (name: string, extra: Partial<FakeCheckRun> = {}) =>
  ({
    name,
    status: 'completed',
    conclusion: 'failure',
    ...extra,
  }) satisfies FakeCheckRun;

const passing = (name: string) =>
  ({
    name,
    status: 'completed',
    conclusion: 'success',
  }) satisfies FakeCheckRun;

describe('required and reference checks', () => {
  it('wakes the agent once every required check finished, with why they failed', async () => {
    const issue = await developedIssue();
    const repo = await repoWithReference();
    h.github.addPull(REPO, {
      number: 5,
      head: { ref: `agent/${issue.identifier}`, sha: 'h1' },
    });
    await h.git.pollRepo(repo);
    h.github.setCheck(
      REPO,
      'h1',
      failing('test', {
        app: ACTIONS,
        annotations: [
          {
            path: 'tests/a.test.ts',
            start_line: 3,
            end_line: 3,
            annotation_level: 'failure',
            message: 'expected 1 to be 2',
          },
        ],
        log: '2026-10-09T00:00:00.0000000Z ##[group]Run pnpm test\n2026-10-09T00:00:01.0000000Z ##[error]expected 1 to be 2\n',
      }),
    );
    h.github.setCheck(REPO, 'h1', {
      name: 'lint',
      status: 'in_progress',
      conclusion: null,
      app: ACTIONS,
    });
    h.github.setCheck(
      REPO,
      'h1',
      failing(PREVIEW, { app: { slug: 'nocobase-ci' } }),
    );
    await h.git.pollRepo(repo);
    // `lint` still runs: the failure of `test` is not final yet.
    expect(await checkWakes(issue.id)).toHaveLength(0);

    h.github.setCheck(REPO, 'h1', failing('lint', { app: ACTIONS }));
    await h.git.pollRepo(repo);
    const wakes = await checkWakes(issue.id);
    expect(wakes).toHaveLength(1);
    const [wake] = wakes;
    expect(wake!.payload).toMatchObject({
      failedChecks: ['test', 'lint'],
      referenceFailures: [PREVIEW],
    });
    expect(wake!.text).toContain('failed: test, lint');
    expect(wake!.text).toContain(
      'tests/a.test.ts:3 failure: expected 1 to be 2',
    );
    expect(wake!.text).toContain('##[error]expected 1 to be 2');
    expect(wake!.text).toContain(`Reference checks failed too (${PREVIEW})`);
    expect(wake!.text).not.toContain(`### ${PREVIEW}`);
    expect(wake!.text).toMatch(
      new RegExp(`nb-studio pr checks ${issue.identifier} \\S+`, 'u'),
    );

    await h.git.pollRepo(repo);
    expect(await checkWakes(issue.id)).toHaveLength(1);
  });

  it('neither wakes the agent nor blocks merging for a failed reference check', async () => {
    const issue = await developedIssue();
    const repo = await repoWithReference();
    h.github.addPull(REPO, {
      number: 6,
      head: { ref: `agent/${issue.identifier}`, sha: 'r1' },
    });
    h.github.setCheck(REPO, 'r1', passing('test'));
    h.github.setCheck(
      REPO,
      'r1',
      failing(PREVIEW, { app: { slug: 'nocobase-ci' } }),
    );
    await h.git.pollRepo(repo);
    expect(await checkWakes(issue.id)).toHaveLength(0);

    const [pull] = (await h.git.list(alice(), issue.id)).data;
    expect(pull).toMatchObject({ ciState: 'failure', mergeBlocker: null });
    const preflight = await h.git.preflight(alice(), issue.id, pull!.id);
    expect(preflight).toMatchObject({
      blocker: null,
      failedChecks: [],
      referenceFailures: [{ name: PREVIEW }],
    });
    await h.git.merge(alice(), issue.id, pull!.id, 'r1');
    expect(h.github.pull(REPO, 6).merged).toBe(true);
  });

  it('signals required checks passing despite reference failures, once per head', async () => {
    const issue = await developedIssue();
    const repo = await repoWithReference();
    h.github.addPull(REPO, {
      number: 8,
      head: { ref: `agent/${issue.identifier}`, sha: 'pass1' },
    });
    h.github.setCheck(REPO, 'pass1', failing(PREVIEW));
    h.github.setCheck(REPO, 'pass1', {
      name: 'test',
      status: 'in_progress',
      conclusion: null,
    });
    const passedInputs = async () => {
      const runs = await h.agents.runs.list({
        subjectKind: 'issue',
        subjectId: issue.id,
      });
      return (
        await Promise.all(runs.map((run) => h.agents.runs.detail(run.id)))
      )
        .flatMap((run) => run.inputs)
        .filter(
          (input) =>
            (input.payload as { trigger?: string }).trigger ===
            'prChecksPassed',
        );
    };
    await h.git.pollRepo(repo);
    expect(await passedInputs()).toHaveLength(0);
    h.github.setCheck(REPO, 'pass1', passing('test'));
    await h.git.pollRepo(repo);
    expect(await passedInputs()).toHaveLength(1);
    await h.git.pollRepo(repo);
    expect(await passedInputs()).toHaveLength(1);
    expect(await checkWakes(issue.id)).toHaveLength(0);
  });

  it('allows a run to read visible linked checks over HTTP, rejecting invisible and unlinked requests', async () => {
    const agentId = await h.createAgent({ actions: ['pm.issues/view'] });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Read checks',
      statusKey: 'in_progress',
      start: false,
    });
    await h.projects.issues.update(alice(), issue.id, {
      revision: issue.revision,
      executor: null,
      start: false,
    });
    await repoWithReference();
    h.github.addPull(REPO, { number: 9, head: { ref: 'logs', sha: 'logs1' } });
    h.github.setCheck(
      REPO,
      'logs1',
      failing('test', { app: ACTIONS, log: '##[error]boom' }),
    );
    h.github.setCheck(
      REPO,
      'logs1',
      failing(PREVIEW, {
        app: { slug: 'nocobase-ci' },
        html_url: 'https://ci.example/logs',
      }),
    );
    const { pullRequest } = await h.git.link(alice(), issue.id, PR_URL(9), {
      type: 'user',
      id: 'alice',
    });
    await mentionAgent(h, 'alice', issue.id, agentId);
    const payload = await h.claimOne();
    const token = payload.cli.credential.content.token as string;
    const url = `/git/pullRequests/${pullRequest.id}/checks`;
    const read = await h.request('GET', `${url}?issueId=${issue.id}`, {
      runToken: token,
    });
    expect(read.status).toBe(200);
    expect(read.body.data.checks).toEqual([
      expect.objectContaining({
        name: 'test',
        log: expect.stringContaining('boom'),
      }),
      expect.objectContaining({
        name: PREVIEW,
        reference: true,
        logUnavailable: 'notActions',
        url: 'https://ci.example/logs',
      }),
    ]);
    const other = await h.projects.issues.create(alice(), {
      title: 'No link',
      start: false,
    });
    const unlinked = await h.request('GET', `${url}?issueId=${other.id}`, {
      runToken: token,
    });
    expect(unlinked.status).toBe(404);
    const hidden = await h.projects.issues.create(bob(), {
      title: 'Private',
      start: false,
    });
    const calls = h.github.requests.length;
    const denied = await h.request('GET', `${url}?issueId=${hidden.id}`, {
      runToken: token,
    });
    expect(denied.status).toBe(404);
    expect(h.github.requests).toHaveLength(calls);
    expect((await h.request('GET', `${url}?issueId=${issue.id}`)).status).toBe(
      401,
    );
    const force = await h.request(
      'POST',
      `/git/pullRequests/${pullRequest.id}/merge?issueId=${issue.id}`,
      {
        runToken: token,
        body: { expectedHeadSha: 'logs1', force: true, reason: 'Flaky' },
      },
    );
    expect(force.status).toBe(403);
    expect(h.github.pull(REPO, 9).merged).toBeFalsy();
    const restrictedAgent = await h.createAgent({ actions: [] });
    await mentionAgent(h, 'alice', issue.id, restrictedAgent);
    const restricted = await h.claimOne();
    const legacyRead = await h.request('GET', `${url}?issueId=${issue.id}`, {
      runToken: restricted.cli.credential.content.token as string,
    });
    expect(legacyRead.status).toBe(200);
    h.roles.set('alice', 'none');
    const forbidden = await h.request('GET', `${url}?issueId=${issue.id}`, {
      runToken: restricted.cli.credential.content.token as string,
    });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.reason).toBe('RUN_ACTION_FORBIDDEN');
  });

  it('reads why the checks failed, saying where another CI keeps its log', async () => {
    const issue = await developedIssue();
    await repoWithReference();
    h.github.addPull(REPO, { number: 7, head: { ref: 'x', sha: 'p1' } });
    h.github.setCheck(
      REPO,
      'p1',
      failing('test', { app: ACTIONS, log: '##[error]boom\n' }),
    );
    h.github.setCheck(
      REPO,
      'p1',
      failing(PREVIEW, {
        app: { slug: 'nocobase-ci' },
        html_url: 'https://ci.example/runs/7',
      }),
    );
    const { pullRequest } = await h.git.link(alice(), issue.id, PR_URL(7), {
      type: 'user',
      id: 'alice',
    });
    const read = await h.git.failedChecks(alice(), issue.id, pullRequest.id);
    expect(read.headSha).toBe('p1');
    expect(read.checks).toEqual([
      expect.objectContaining({
        name: 'test',
        reference: false,
        logUnavailable: null,
        log: expect.stringContaining('##[error]boom'),
      }),
      expect.objectContaining({
        name: PREVIEW,
        reference: true,
        log: null,
        logUnavailable: 'notActions',
        url: 'https://ci.example/runs/7',
      }),
    ]);
  });
});

describe('merging past failed required checks', () => {
  async function failedPull(number: number, sha: string) {
    const issue = await developedIssue();
    await move(issue, 'in_review');
    await repoWithReference();
    h.github.addPull(REPO, { number, head: { ref: `b${number}`, sha } });
    h.github.setCheck(REPO, sha, failing('test'));
    const { pullRequest } = await h.git.link(
      alice(),
      issue.id,
      PR_URL(number),
      { type: 'user', id: 'alice' },
    );
    return { issue, pullRequest };
  }

  async function forceActivities(issueId: string) {
    return (
      await h.projects.issueQueries.activities(alice(), issueId, {})
    ).data.filter((entry) => entry.action.startsWith('pr_force_merge'));
  }

  it('lets a manager merge with a reason, commented on the pull request and kept on the issue', async () => {
    const { issue, pullRequest } = await failedPull(20, 'f1');
    expect(
      await h.git.preflight(alice(), issue.id, pullRequest.id),
    ).toMatchObject({
      blocker: 'ciFailed',
      failedChecks: [{ name: 'test' }],
      canForce: false,
    });
    expect(
      await h.git.preflight(bob(), issue.id, pullRequest.id),
    ).toMatchObject({ blocker: 'ciFailed', canForce: true });

    // Without force, failed required checks block; the issue's owner alone may not force.
    await expect(
      h.git.merge(bob(), issue.id, pullRequest.id, 'f1'),
    ).rejects.toMatchObject({ details: { code: 'PR_NOT_MERGEABLE' } });
    await expect(
      h.git.merge(alice(), issue.id, pullRequest.id, 'f1', {
        force: true,
        reason: 'Flaky',
      }),
    ).rejects.toMatchObject({ details: { code: 'FORBIDDEN' } });
    await expect(
      h.git.merge(bob(), issue.id, pullRequest.id, 'f1', {
        force: true,
        reason: '  ',
      }),
    ).rejects.toMatchObject({ details: { code: 'INVALID_FORCE_REASON' } });
    expect(h.github.comments(REPO, 20)).toEqual([]);

    const merged = await h.git.merge(bob(), issue.id, pullRequest.id, 'f1', {
      force: true,
      reason: 'Flaky upstream test',
    });
    expect(merged.state).toBe('merged');
    const [comment] = h.github.comments(REPO, 20);
    expect(comment).toContain('Reason: Flaky upstream test');
    expect(comment).toContain('[test](');
    expect(await forceActivities(issue.id)).toEqual([
      expect.objectContaining({
        action: 'pr_force_merged',
        actorId: 'bob',
        details: expect.objectContaining({
          reason: 'Flaky upstream test',
          headSha: 'f1',
          failedChecks: [expect.objectContaining({ name: 'test' })],
        }),
      }),
    ]);
  });

  it.each(['queued', 'in_progress'] as const)(
    'blocks normal and forced merging while a required check is %s',
    async (status) => {
      const { issue, pullRequest } = await failedPull(22, 'wait1');
      h.github.setCheck(REPO, 'wait1', {
        name: 'build',
        status,
        conclusion: null,
      });
      expect(
        (await h.git.preflight(bob(), issue.id, pullRequest.id)).blocker,
      ).toBe('ciPending');
      expect((await h.git.list(bob(), issue.id)).data[0]?.mergeBlocker).toBe(
        'ciPending',
      );
      for (const options of [{}, { force: true, reason: 'Flaky' }]) {
        await expect(
          h.git.merge(bob(), issue.id, pullRequest.id, 'wait1', options),
        ).rejects.toMatchObject({
          details: { code: 'PR_NOT_MERGEABLE', blocker: 'ciPending' },
        });
      }
      expect(h.github.comments(REPO, 22)).toEqual([]);
      expect(
        h.github.requests.filter(
          (request) =>
            request.method === 'PUT' && request.path.includes('/merge'),
        ),
      ).toHaveLength(0);
    },
  );

  it('blocks forcing when required check results are missing', async () => {
    const { issue, pullRequest } = await failedPull(25, 'missing1');
    h.github.pull(REPO, 25).head.sha = 'missing2';
    expect(
      (await h.git.preflight(bob(), issue.id, pullRequest.id)).blocker,
    ).toBe('ciMissing');
    await expect(
      h.git.merge(bob(), issue.id, pullRequest.id, 'missing2', {
        force: true,
        reason: 'Flaky',
      }),
    ).rejects.toMatchObject({
      details: { code: 'PR_NOT_MERGEABLE', blocker: 'ciMissing' },
    });
    expect(h.github.comments(REPO, 25)).toEqual([]);
    expect(
      h.github.requests.filter(
        (request) =>
          request.method === 'PUT' && request.path.includes('/merge'),
      ),
    ).toHaveLength(0);
  });

  it('rejects an agent at the service boundary even with administrator scopes', async () => {
    const { issue, pullRequest } = await failedPull(26, 'agent1');
    const agentId = await h.createAgent();
    await expect(
      h.git.merge(
        { ...bob(), actor: { type: 'agent', id: agentId } },
        issue.id,
        pullRequest.id,
        'agent1',
        { force: true, reason: 'Flaky' },
      ),
    ).rejects.toMatchObject({ details: { code: 'FORBIDDEN' } });
    expect(h.github.comments(REPO, 26)).toEqual([]);
    expect(
      h.github.requests.filter(
        (request) =>
          request.method === 'PUT' && request.path.includes('/merge'),
      ),
    ).toHaveLength(0);
  });

  it('does not merge when the PR comment fails', async () => {
    const { issue, pullRequest } = await failedPull(23, 'comment1');
    h.github.failures.set(`${REPO}/issues/23/comments`, 403);
    await expect(
      h.git.merge(bob(), issue.id, pullRequest.id, 'comment1', {
        force: true,
        reason: 'Flaky',
      }),
    ).rejects.toThrow();
    expect(
      h.github.requests.filter(
        (request) =>
          request.method === 'PUT' && request.path.includes('/merge'),
      ),
    ).toHaveLength(0);
    expect(h.github.pull(REPO, 23).merged).toBeFalsy();
  });

  it('requires a new confirmation after the head changes', async () => {
    const { issue, pullRequest } = await failedPull(24, 'old1');
    await h.git.preflight(bob(), issue.id, pullRequest.id);
    h.github.pull(REPO, 24).head.sha = 'new1';
    h.github.setCheck(REPO, 'new1', failing('test'));
    await expect(
      h.git.merge(bob(), issue.id, pullRequest.id, 'old1', {
        force: true,
        reason: 'Flaky',
      }),
    ).rejects.toMatchObject({ details: { code: 'PR_CHANGED' } });
    expect(h.github.comments(REPO, 24)).toEqual([]);
    expect(
      h.github.requests.filter(
        (request) =>
          request.method === 'PUT' && request.path.includes('/merge'),
      ),
    ).toHaveLength(0);
  });

  it('still answers to GitHub’s branch protection and to every other blocker', async () => {
    const { issue, pullRequest } = await failedPull(21, 'g1');
    h.github.protectedPulls.add(`${REPO}#21`);
    await expect(
      h.git.merge(bob(), issue.id, pullRequest.id, 'g1', {
        force: true,
        reason: 'Expected cross-repository failure',
      }),
    ).rejects.toMatchObject({
      details: { code: 'PR_NOT_MERGEABLE', blocker: 'protected' },
    });
    expect(h.github.pull(REPO, 21).merged).toBeFalsy();
    expect(h.github.comments(REPO, 21)).toHaveLength(1);
    expect(await forceActivities(issue.id)).toEqual([
      expect.objectContaining({
        action: 'pr_force_merge_refused',
        details: expect.objectContaining({
          reason: 'Expected cross-repository failure',
        }),
      }),
    ]);

    // A draft is not a check: forcing does not go past it.
    h.github.protectedPulls.clear();
    h.github.pull(REPO, 21).draft = true;
    await expect(
      h.git.merge(bob(), issue.id, pullRequest.id, 'g1', {
        force: true,
        reason: 'Flaky',
      }),
    ).rejects.toMatchObject({
      details: { code: 'PR_NOT_MERGEABLE', blocker: 'draft' },
    });
  });
});

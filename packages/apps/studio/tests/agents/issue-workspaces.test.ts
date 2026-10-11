// @vitest-environment node
/**
 * Whether runners may remove the working directories of an issue (`SubjectBinding.workspaces` of the issue kind), over
 * a real database: an issue is over when it is done or cancelled and every linked pull request is merged or closed, a
 * squash-merged one included, since Studio decides from the pull request's state and not from branch history. An issue
 * still in progress, one with an open pull request, a deleted one, one linking a pull request Studio has no record of,
 * and an id Studio does not know keep their directories. A directory named only by its issue's key resolves to that
 * issue while Studio still has it, and runners are told, as proof that a directory's commits were pushed, the head each
 * merged pull request was merged at as GitHub confirmed it, under the URL the project checks the repository out from.
 */
import {
  HEADERS,
  RUNNER_ROUTES,
  type WorkspacesRequest,
} from '@nocobase/agent-protocol';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ISSUE_SUBJECT } from '../../server/agents/catalog/triggers.js';
import {
  ensureRepo,
  insertLink,
  upsertPullRequest,
} from '../../server/git/store.js';
import {
  API,
  bindingOf,
  connectedRepo,
  tokenConnection,
} from '../git/helpers.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

const FULL_NAME = 'acme/app';
const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

let h: BridgeHarness;
let projectId: string;
let nextNumber = 1;

const alice = () => h.viewer('alice');

beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  projectId = (
    await h.projects.projects.create(alice(), {
      name: 'Acme',
      visibility: 'members',
    })
  ).id;
});

afterEach(async () => {
  await h.close();
});

async function issueIn(statusKey: string | null): Promise<Issue> {
  const issue = await h.projects.issues.create(alice(), {
    title: `Issue in ${statusKey ?? 'its first status'}`,
    projectId,
  });
  if (!statusKey) return issue;
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  await h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
  return issue;
}

/**
 * Links a pull request in `state` to the issue; a merged one as a squash, whose head the base branch never carries.
 * With `confirmed`, GitHub confirmed the head it was merged at.
 */
async function linkPullRequest(
  issue: Issue,
  state: 'open' | 'merged' | 'closed',
  options: { confirmed?: string; headSha?: string } = {},
): Promise<void> {
  const conn = h.database.connection();
  const repo = await ensureRepo(conn, API, FULL_NAME);
  const number = nextNumber++;
  const { pr } = await upsertPullRequest(
    conn,
    repo.id,
    {
      repo: FULL_NAME,
      number,
      url: `https://git.example.com/${FULL_NAME}/pull/${number}`,
      title: issue.title,
      body: null,
      state,
      draft: false,
      headRef: `agent/${issue.identifier}`,
      baseRef: 'main',
      headSha: options.headSha ?? SHA,
      authorLogin: 'agent',
      mergeableState: null,
      mergedAt: state === 'merged' ? new Date().toISOString() : null,
      mergedByLogin: state === 'merged' ? 'alice' : null,
      mergeCommitSha:
        state === 'merged' ? 'f1b2c3d4e5f60718293a4b5c6d7e8f9012345678' : null,
    } as never,
    {},
    options.confirmed
      ? { sha: options.confirmed, source: 'webhook' }
      : undefined,
  );
  await insertLink(conn, {
    issueId: issue.id,
    pullRequestId: pr.id,
    linkedByType: 'system',
    linkedById: null,
  });
}

async function settled(ids: readonly string[]): Promise<Set<string>> {
  const workspaces = h.agents.subjects.get(ISSUE_SUBJECT)?.workspaces;
  expect(workspaces).toBeDefined();
  return new Set(await workspaces!.settled(h.database.connection(), ids));
}

describe('issue working directories', () => {
  it('are over for a done or cancelled issue whose pull requests are all merged or closed', async () => {
    const squashed = await issueIn('done');
    await linkPullRequest(squashed, 'merged');
    const abandoned = await issueIn('cancelled');
    await linkPullRequest(abandoned, 'closed');
    const both = await issueIn('done');
    await linkPullRequest(both, 'merged');
    await linkPullRequest(both, 'closed');
    const withoutPullRequest = await issueIn('done');

    expect(
      await settled([
        squashed.id,
        abandoned.id,
        both.id,
        withoutPullRequest.id,
      ]),
    ).toEqual(
      new Set([squashed.id, abandoned.id, both.id, withoutPullRequest.id]),
    );
  });

  it('are kept while the issue goes on, a pull request is still open, or the issue is unknown', async () => {
    const fresh = await issueIn(null);
    const working = await issueIn('in_progress');
    await linkPullRequest(working, 'merged');
    const stillOpen = await issueIn('done');
    await linkPullRequest(stillOpen, 'merged');
    await linkPullRequest(stillOpen, 'open');
    const finished = await issueIn('done');

    expect(
      await settled([
        fresh.id,
        working.id,
        stillOpen.id,
        'no-such-issue',
        finished.id,
      ]),
    ).toEqual(new Set([finished.id]));
    expect(await settled([])).toEqual(new Set());
  });

  it('are kept for a deleted issue, even one that was done', async () => {
    const deleted = await issueIn('done');
    await linkPullRequest(deleted, 'merged');
    expect(await settled([deleted.id])).toEqual(new Set([deleted.id]));

    // Only an administrator deletes issues.
    h.roles.set('alice', 'admin');
    await h.projects.issues.remove(alice(), deleted.id);

    expect(await settled([deleted.id])).toEqual(new Set());
  });

  it('are kept when a linked pull request has no record, as its state cannot be told', async () => {
    const dangling = await issueIn('done');
    await linkPullRequest(dangling, 'merged');
    await insertLink(h.database.connection(), {
      issueId: dangling.id,
      pullRequestId: 'missing-pull-request',
      linkedByType: 'system',
      linkedById: null,
    });

    expect(await settled([dangling.id])).toEqual(new Set());
  });
});

const URL = 'https://github.com/acme/app.git';

/** The issue binding's `commits` and `resolveKeys`, as the agents plugin calls them. */
const binding = () => h.agents.subjects.get(ISSUE_SUBJECT)!.workspaces!;

/** The project's working directory, bound to the repository through a connection, which reaches it too. */
async function boundProject(): Promise<void> {
  h.roles.set('alice', 'admin');
  try {
    const connection = await tokenConnection(h);
    await connectedRepo(h, FULL_NAME, connection);
    await h.projects.projects.addResource(alice(), projectId, {
      type: 'gitRepo',
      url: URL,
      label: 'app',
      defaultRef: 'main',
      binding: bindingOf(connection, FULL_NAME),
    } as never);
  } finally {
    h.roles.delete('alice');
  }
}

describe('commit evidence', () => {
  it('names the confirmed merged heads under the URL the project checks the repository out from', async () => {
    await boundProject();
    const issue = await issueIn('done');
    await linkPullRequest(issue, 'merged', {
      confirmed: 'b'.repeat(40),
      headSha: 'b'.repeat(40),
    });
    await linkPullRequest(issue, 'merged', {
      confirmed: 'a'.repeat(40),
      headSha: 'a'.repeat(40),
    });
    // Recorded merged without a confirmed head (a person's mark, a record from before), and closed unmerged: neither.
    await linkPullRequest(issue, 'merged', { headSha: 'c'.repeat(40) });
    await linkPullRequest(issue, 'closed', { headSha: 'd'.repeat(40) });

    const commits = await binding().commits!(h.database.connection(), [
      issue.id,
      'no-such-issue',
    ]);
    expect(Object.fromEntries(commits)).toEqual({
      [issue.id]: [
        { repository: URL, headSha: 'a'.repeat(40) },
        { repository: URL, headSha: 'b'.repeat(40) },
      ],
    });
  });

  it('names none for a repository no working directory of the project is bound to through its connection', async () => {
    const issue = await issueIn('done');
    await linkPullRequest(issue, 'merged', {
      confirmed: 'b'.repeat(40),
      headSha: 'b'.repeat(40),
    });
    expect(
      (await binding().commits!(h.database.connection(), [issue.id])).size,
    ).toBe(0);
  });
});

describe('directories named by their issue key', () => {
  it('resolve to the issue Studio still has, and to nothing once it is deleted', async () => {
    const issue = await issueIn('done');
    const keys = await binding().resolveKeys!(h.database.connection(), [
      issue.identifier,
      'NOPE-1',
      '',
    ]);
    expect(Object.fromEntries(keys)).toEqual({
      [issue.identifier]: [issue.id],
    });

    h.roles.set('alice', 'admin');
    await h.projects.issues.remove(alice(), issue.id);
    expect(
      (
        await binding().resolveKeys!(h.database.connection(), [
          issue.identifier,
        ])
      ).size,
    ).toBe(0);
  });
});

describe("a runner's report", () => {
  /** An issue of the project an agent worked on through the harness's runner, its run finished. */
  async function workedOn(): Promise<{ issue: Issue; runId: string }> {
    const agentId = await h.createAgent({ name: `Coder ${nextNumber}` });
    const issue = await issueIn(null);
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(alice(), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/w',
      adapter: { kind: 'claude' },
      acceptsInput: false,
    });
    const done = await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
      summary: 'Done.',
      handledInputIds: payload.inputs.map((input: { id: string }) => input.id),
    });
    expect(done.status).toBe(200);
    return { issue, runId: payload.run.id as string };
  }

  async function move(issue: Issue, statusKey: string): Promise<void> {
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(alice(), issue.id, {
      revision: current.revision,
      statusKey,
    });
  }

  async function report(directories: WorkspacesRequest['directories']) {
    const answer = await h.request(
      'POST',
      RUNNER_ROUTES.workspaces.replace(/^\/api/u, ''),
      {
        headers: { [HEADERS.runnerKey]: h.runnerKey() ?? '' },
        body: { reportId: 'report-1', workspaces: [], directories },
      },
    );
    expect(answer.status).toBe(200);
    return answer.body.data as {
      remove: string[];
      keep: string[];
      decisions: {
        workDir: string;
        settled: boolean | null;
        reason: string;
        commits: unknown[];
      }[];
    };
  }

  it('lets the directories of a finished issue go, new and old, with the heads its pull requests were merged at', async () => {
    await boundProject();
    const { issue, runId } = await workedOn();
    const other = await issueIn('done');
    await linkPullRequest(issue, 'merged', {
      confirmed: 'b'.repeat(40),
      headSha: 'b'.repeat(40),
    });
    await move(issue, 'done');
    const lastUsedAt = new Date().toISOString();

    const answer = await report([
      {
        runId,
        subjectKey: issue.identifier,
        workDir: '/w/new',
        unpushed: false,
        lastUsedAt,
      },
      {
        subjectKey: issue.identifier,
        workDir: '/w/old',
        unpushed: false,
        lastUsedAt,
      },
      {
        subjectKey: other.identifier,
        workDir: '/w/never',
        unpushed: false,
        lastUsedAt,
      },
      {
        subjectKey: 'NOPE-1',
        workDir: '/w/unknown',
        unpushed: false,
        lastUsedAt,
      },
    ]);

    const evidence = [{ repository: URL, headSha: 'b'.repeat(40) }];
    expect(answer.remove).toEqual([runId]);
    const byDir = Object.fromEntries(
      answer.decisions.map((decision) => [decision.workDir, decision]),
    );
    expect(byDir['/w/new']).toMatchObject({
      settled: true,
      reason: 'settled',
      commits: evidence,
    });
    expect(byDir['/w/old']).toMatchObject({
      settled: true,
      reason: 'settled',
      commits: evidence,
    });
    // Another issue this runner never worked on, and a key Studio does not know, stay.
    expect(byDir['/w/never']).toMatchObject({
      settled: null,
      reason: 'ownershipUnknown',
      commits: [],
    });
    expect(byDir['/w/unknown']).toMatchObject({
      settled: null,
      reason: 'subjectUnknown',
      commits: [],
    });
  });

  it('keeps them while the issue goes on or a pull request is open', async () => {
    await boundProject();
    const { issue, runId } = await workedOn();
    await linkPullRequest(issue, 'open');
    await move(issue, 'done');
    const lastUsedAt = new Date().toISOString();

    const answer = await report([
      {
        runId,
        subjectKey: issue.identifier,
        workDir: '/w/new',
        unpushed: false,
        lastUsedAt,
      },
      {
        subjectKey: issue.identifier,
        workDir: '/w/old',
        unpushed: false,
        lastUsedAt,
      },
    ]);

    expect(answer.remove).toEqual([]);
    expect(answer.keep).toEqual([runId]);
    expect(
      answer.decisions.map((decision) => [
        decision.workDir,
        decision.settled,
        decision.reason,
      ]),
    ).toEqual([
      ['/w/new', false, 'active'],
      ['/w/old', false, 'active'],
    ]);
  });
});

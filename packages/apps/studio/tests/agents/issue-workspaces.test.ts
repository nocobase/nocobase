// @vitest-environment node
/**
 * Whether runners remove the working directories of an issue (`SubjectBinding.workspaces` of the issue kind), over a
 * real database: an issue is over when it is done or cancelled, whatever its pull requests are. An issue still in
 * progress, a deleted one and an id Studio does not know keep their directories. A directory named only by its issue's
 * key resolves to that issue while Studio still has it, on whichever runner keeps it; one of an issue a run has not
 * finished on stays.
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
import { API } from '../git/helpers.js';
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

async function move(issue: Pick<Issue, 'id'>, statusKey: string) {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  await h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function issueIn(statusKey: string | null): Promise<Issue> {
  const issue = await h.projects.issues.create(alice(), {
    title: `Issue in ${statusKey ?? 'its first status'}`,
    projectId,
  });
  if (statusKey) await move(issue, statusKey);
  return issue;
}

/** Links a pull request in `state` to the issue. */
async function linkPullRequest(
  issue: Issue,
  state: 'open' | 'merged' | 'closed',
): Promise<void> {
  const conn = h.database.connection();
  const repo = await ensureRepo(conn, API, FULL_NAME);
  const number = nextNumber++;
  const { pr } = await upsertPullRequest(conn, repo.id, {
    repo: FULL_NAME,
    number,
    url: `https://git.example.com/${FULL_NAME}/pull/${number}`,
    title: issue.title,
    body: null,
    state,
    draft: false,
    headRef: `agent/${issue.identifier}`,
    baseRef: 'main',
    headSha: SHA,
    authorLogin: 'agent',
    mergeableState: null,
    mergedAt: state === 'merged' ? new Date().toISOString() : null,
    mergedByLogin: state === 'merged' ? 'alice' : null,
    mergeCommitSha: null,
    closedAt: null,
  });
  await insertLink(conn, {
    issueId: issue.id,
    pullRequestId: pr.id,
    linkedByType: 'system',
    linkedById: null,
  });
}

const binding = () => h.agents.subjects.get(ISSUE_SUBJECT)!.workspaces!;

async function settled(ids: readonly string[]): Promise<Set<string>> {
  return new Set(await binding().settled(h.database.connection(), ids));
}

describe('issue working directories', () => {
  it('are over once the issue is done or cancelled, whatever its pull requests are', async () => {
    const merged = await issueIn('done');
    await linkPullRequest(merged, 'merged');
    const stillOpen = await issueIn('done');
    await linkPullRequest(stillOpen, 'open');
    const cancelled = await issueIn('cancelled');
    await linkPullRequest(cancelled, 'open');
    const dangling = await issueIn('done');
    await insertLink(h.database.connection(), {
      issueId: dangling.id,
      pullRequestId: 'missing-pull-request',
      linkedByType: 'system',
      linkedById: null,
    });
    const withoutPullRequest = await issueIn('done');

    expect(
      await settled([
        merged.id,
        stillOpen.id,
        cancelled.id,
        dangling.id,
        withoutPullRequest.id,
      ]),
    ).toEqual(
      new Set([
        merged.id,
        stillOpen.id,
        cancelled.id,
        dangling.id,
        withoutPullRequest.id,
      ]),
    );
  });

  it('are kept while the issue goes on, or when it is unknown', async () => {
    const fresh = await issueIn(null);
    const working = await issueIn('in_progress');
    await linkPullRequest(working, 'merged');
    const finished = await issueIn('done');

    expect(
      await settled([fresh.id, working.id, 'no-such-issue', finished.id]),
    ).toEqual(new Set([finished.id]));
    expect(await settled([])).toEqual(new Set());
  });

  it('are kept for a deleted issue, even one that was done', async () => {
    const deleted = await issueIn('done');
    expect(await settled([deleted.id])).toEqual(new Set([deleted.id]));

    // Only an administrator deletes issues.
    h.roles.set('alice', 'admin');
    await h.projects.issues.remove(alice(), deleted.id);

    expect(await settled([deleted.id])).toEqual(new Set());
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
    const agentId = await h.createAgent({ name: `Coder ${nextNumber++}` });
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

  const lastUsedAt = new Date().toISOString();
  const dir = (workDir: string, subjectKey: string, runId?: string) => ({
    workDir,
    subjectKey,
    unpushed: true,
    lastUsedAt,
    ...(runId === undefined ? {} : { runId }),
  });

  it('lets every directory of a finished issue go, new or old, unpushed or not, whoever worked on it', async () => {
    const { issue, runId } = await workedOn();
    await linkPullRequest(issue, 'open');
    await move(issue, 'done');
    const cancelled = await issueIn('cancelled');

    const answer = await report([
      dir('/w/new', issue.identifier, runId),
      dir('/w/old', issue.identifier),
      dir('/w/gone-run', issue.identifier, 'no-such-run'),
      dir('/w/never', cancelled.identifier),
      dir('/w/unknown', 'NOPE-1'),
    ]);

    expect(answer.remove.sort()).toEqual(['no-such-run', runId].sort());
    const byDir = Object.fromEntries(
      answer.decisions.map((decision) => [decision.workDir, decision]),
    );
    for (const workDir of ['/w/new', '/w/old', '/w/gone-run', '/w/never'])
      expect(byDir[workDir]).toMatchObject({
        settled: true,
        reason: 'settled',
        commits: [],
      });
    expect(byDir['/w/unknown']).toMatchObject({
      settled: null,
      reason: 'subjectUnknown',
    });
  });

  it('keeps them while the issue goes on, or a run on it has not finished', async () => {
    const { issue, runId } = await workedOn();
    const answer = await report([
      dir('/w/new', issue.identifier, runId),
      dir('/w/old', issue.identifier),
    ]);
    expect(answer.remove).toEqual([]);
    expect(answer.keep).toEqual([runId]);
    expect(
      answer.decisions.map((decision) => [decision.settled, decision.reason]),
    ).toEqual([
      [false, 'active'],
      [false, 'active'],
    ]);

    // Done, but its run is back in the queue: still kept.
    await move(issue, 'done');
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({ filter: { id: runId }, values: { status: 'queued' } });
    expect(
      (await report([dir('/w/old', issue.identifier)])).decisions,
    ).toMatchObject([{ settled: false, reason: 'active' }]);
  });
});

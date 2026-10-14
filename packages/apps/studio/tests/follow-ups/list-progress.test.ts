// @vitest-environment node
/**
 * My follow-ups reads every row's progress up front (`prefetchProgressReads`, `agents/manager/progress.ts`): the same
 * progress the issue's own reads give, except why queued work waits, in a number of reads that does not grow with the
 * rows.
 */
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  issueProgress,
  prefetchProgressReads,
  type ProgressMemo,
} from '../../server/agents/manager/progress.js';
import {
  progressFacts,
  progressOf,
} from '../../server/agent-sessions/progress.js';
import { createFollowUps } from '../../server/follow-ups/service.js';
import {
  ensureRepo,
  insertLink,
  upsertPullRequest,
} from '../../server/git/store.js';
import type { IssueProgress } from '../../shared/project-manager.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { API } from '../git/helpers.js';

let h: BridgeHarness;
let worker: string;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  worker = await h.createAgent({ name: 'Worker' });
});
afterEach(() => h.close());

let nextPullRequest = 1;
const manager = () =>
  ({
    ...h.viewer('alice'),
    actor: { type: 'agent', id: PROJECT_MANAGER_ID },
  }) as ReturnType<BridgeHarness['viewer']>;

/**
 * One issue of each kind a row shows: checks pending, a decision asked, queued work (unless `queued` is false), managed,
 * in backlog.
 */
async function seed({ queued: withQueued = true } = {}): Promise<void> {
  const alice = h.viewer('alice');
  const conn = h.projects.tx.read();
  const repo = await ensureRepo(conn, API, 'acme/app');
  const create = (statusKey: string) =>
    h.projects.issues.create(alice, {
      title: `A ${statusKey} issue`,
      statusKey,
      start: false,
    });
  const move = async (issueId: string, statusKey: string, as = alice) => {
    const current = await h.projects.issueQueries.detail(alice, issueId);
    await h.projects.issues.update(as, issueId, {
      revision: current.revision,
      statusKey,
    });
  };

  const review = await create('in_progress');
  const number = (nextPullRequest += 1);
  const { pr } = await upsertPullRequest(
    conn,
    repo.id,
    {
      repo: 'acme/app',
      number,
      url: `https://github.com/acme/app/pull/${number}`,
      title: 'A change',
      body: null,
      state: 'open',
      draft: false,
      headRef: `branch-${number}`,
      baseRef: 'main',
      headSha: 'a'.repeat(40),
      authorLogin: 'octo',
      mergeableState: 'clean',
      mergedAt: null,
      mergedByLogin: null,
      mergeCommitSha: null,
      closedAt: null,
    },
    { ciState: 'pending' },
  );
  await insertLink(conn, {
    issueId: review.id,
    pullRequestId: pr.id,
    linkedByType: 'user',
    linkedById: 'alice',
  });
  await move(review.id, 'in_review');

  const blocked = await create('in_progress');
  await h.projects.comments.create(manager(), blocked.id, {
    content: 'Next: wait for the owner\nNeeds you: pick A or B?',
  });
  await move(blocked.id, 'blocked', manager());

  const queued = await create('in_progress');
  await h.projects.comments.create(manager(), queued.id, {
    content: 'Next: let the worker start',
  });
  if (withQueued)
    await h.projects.comments.create(alice, queued.id, {
      content: `[@Worker](mention://agent/${worker}) do the next step`,
    });

  await create('in_progress');
  await create('backlog');
}

/** The services and database objects whose calls are counted, wherever they are reached from. */
const COUNTED = new Set([
  'query',
  'issueQueries',
  'commentQueries',
  'issueContext',
  'runs',
  'requests',
  'agents',
  'runners',
  'claims',
]);

/** The plugins' services over the harness, counting what is asked of them and of the database. */
function countedDeps(): {
  readonly agents: BridgeHarness['agents'];
  readonly projects: BridgeHarness['projects'];
  readonly reads: () => number;
} {
  let count = 0;
  /** Counts each call of the object's methods, and of the `COUNTED` objects it holds. */
  function counted<T extends object>(target: T): T {
    return new Proxy(target, {
      get(object, key) {
        const value = Reflect.get(object, key) as unknown;
        if (typeof value === 'function')
          return (...args: unknown[]) => {
            count += 1;
            return (value as (...args: unknown[]) => unknown).apply(
              object,
              args,
            );
          };
        return typeof key === 'string' &&
          COUNTED.has(key) &&
          typeof value === 'object' &&
          value
          ? counted(value)
          : value;
      },
    });
  }
  const conn = counted(h.projects.tx.read());
  return {
    // Every read goes through the counted connection.
    projects: new Proxy(counted(h.projects), {
      get: (object, key) =>
        key === 'tx'
          ? { read: () => conn }
          : (Reflect.get(object, key) as unknown),
    }),
    agents: counted(h.agents),
    reads: () => count,
  };
}

/** The follow-ups service over the counted services. */
function countedFollowUps(): {
  readonly followUps: ReturnType<typeof createFollowUps>;
  readonly reads: () => number;
} {
  const { agents, projects, reads } = countedDeps();
  return {
    followUps: createFollowUps({
      projects,
      agents,
      preferences: {
        get: () => Promise.resolve(undefined),
        set: () => Promise.resolve(),
      },
    }),
    reads,
  };
}

/** The issue's own progress as a list row shows it: without why its queued work waits. */
function asRow(progress: IssueProgress): IssueProgress {
  if (progress.state !== 'queued' || !progress.agent) return progress;
  const { managerWait: _wait, ...row } = progress;
  return { ...row, waiting: null };
}

describe('the progress of My follow-ups rows', () => {
  it('is the issue’s own progress, without why queued work waits', async () => {
    await seed();
    await h.claimOne();
    await seed();
    const viewer = { userId: 'alice', seesMachines: false };
    const deps = { agents: h.agents, projects: h.projects };
    const conn = h.projects.tx.read();
    const { data: issues } = await h.projects.issueQueries.page(
      h.viewer('alice'),
      { ownerUserId: 'alice', limit: 100 },
    );
    expect(issues.length).toBe(10);
    const reads = await prefetchProgressReads(deps, conn, issues, viewer);
    const memo: ProgressMemo = new Map();
    const states = new Set<string>();
    for (const issue of issues as IssueListItem[]) {
      const own = await issueProgress(deps, conn, issue, viewer);
      const row = await issueProgress(deps, conn, issue, viewer, memo, {
        reads,
        list: true,
      });
      states.add(row.state);
      expect(row).toEqual(asRow(own));
    }
    expect([...states].sort()).toEqual(
      [
        'checksPending',
        'idle',
        'needsDecision',
        'notStarted',
        'queued',
        'working',
      ].sort(),
    );
  });

  it('takes as many reads for many issues as for a few', async () => {
    await seed();
    await h.claimOne();
    const viewer = h.viewer('alice');
    const few = countedFollowUps();
    const before = await few.followUps.overview(viewer);
    expect(before.issues).toHaveLength(5);

    await seed();
    await seed();
    await seed();
    const many = countedFollowUps();
    const after = await many.followUps.overview(viewer);
    expect(after.issues).toHaveLength(20);
    expect(many.reads()).toBe(few.reads());
    expect(few.reads()).toBeGreaterThan(10);
    expect(few.reads()).toBeLessThan(60);
  });
});

describe('the progress an agent session reads', () => {
  const owned = async () =>
    (
      await h.projects.issueQueries.page(h.viewer('alice'), {
        ownerUserId: 'alice',
        limit: 100,
      })
    ).data;

  it('is each issue’s own progress, queued work included', async () => {
    await seed();
    await h.claimOne();
    await seed();
    const issues = await owned();
    const deps = { agents: h.agents, projects: h.projects };
    const facts = await progressOf(deps, issues, 'alice');
    const conn = h.projects.tx.read();
    for (const issue of issues)
      expect(facts.get(issue.id)).toEqual(
        progressFacts(
          issue,
          await issueProgress(deps, conn, issue, {
            userId: 'alice',
            seesMachines: false,
          }),
        ),
      );
    expect(
      [...facts.values()].some(
        (fact) => fact.now === 'It waits for an agent to start on it.',
      ),
    ).toBe(true);
  });

  it('takes as many reads for many issues as for a few, while none waits in the queue', async () => {
    await seed({ queued: false });
    const few = countedDeps();
    await progressOf(few, await owned(), 'alice');
    await seed({ queued: false });
    await seed({ queued: false });
    await seed({ queued: false });
    const issues = await owned();
    expect(issues).toHaveLength(20);
    const many = countedDeps();
    await progressOf(many, issues, 'alice');
    expect(many.reads()).toBe(few.reads());
  });
});

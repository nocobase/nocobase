// @vitest-environment node
/**
 * The task lists' reads under load (`GET /api/taskGroups` and its children, rows and summary, and what the viewer
 * follows): each runs a fixed number of queries whatever the number of tasks, sub-tasks, dependencies and followed
 * tasks; rows and children read several tasks at once; the summary is reused for a few seconds per viewer.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { Knex } from 'knex';
import { afterEach, expect, it } from 'vitest';

import {
  FOLLOWING_PREFERENCE,
  SEEN_PREFERENCE,
} from '../../shared/follow-ups.js';
import { createFollowUps } from '../../server/follow-ups/service.js';
import { createTaskGroups } from '../../server/issues/task-groups.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let harnesses: BridgeHarness[] = [];
afterEach(async () => {
  for (const each of harnesses) await each.close();
  harnesses = [];
});

const STATUSES = ['backlog', 'in_progress', 'in_review', 'blocked', 'done'];

interface Workload {
  readonly h: BridgeHarness;
  readonly roots: readonly string[];
}

/** `trees` trees of a root and three staged sub-tasks, a dependency between neighbours, a few followed and unread. */
async function workload(trees: number): Promise<Workload> {
  const h = await createBridgeHarness();
  harnesses.push(h);
  for (const id of ['alice', 'bob']) {
    await h.addUser(id);
    h.roles.set(id, 'admin');
  }
  const roots: string[] = [];
  let previous: string | null = null;
  for (let n = 0; n < trees; n += 1) {
    const owner = n % 3 === 0 ? 'bob' : 'alice';
    const root = await h.projects.issues.create(h.viewer(owner), {
      title: `Root ${n}`,
      start: false,
      executor: { type: 'user', id: n % 2 === 0 ? 'alice' : 'bob' },
      ...(previous ? { blockedBy: [previous] } : {}),
    });
    roots.push(root.id);
    previous = root.id;
    for (let c = 0; c < 3; c += 1) {
      const child = await h.projects.issues.create(h.viewer('alice'), {
        title: `Child ${n}.${c}`,
        start: false,
        parentIssueId: root.id,
        stage: c,
      });
      const statusKey = STATUSES[(n + c) % STATUSES.length]!;
      if (statusKey !== 'backlog')
        await h.projects.issues.update(h.viewer('alice'), child.id, {
          revision: child.revision,
          statusKey,
        });
    }
    if (n % 2 === 0)
      await h.projects.comments.create(h.viewer('bob'), root.id, {
        content: `Note on ${n}`,
      });
  }
  const followed = roots.slice(0, Math.ceil(roots.length / 2));
  h.preferences.set(`alice:${FOLLOWING_PREFERENCE}`, followed);
  h.preferences.set(
    `alice:${SEEN_PREFERENCE}`,
    Object.fromEntries(followed.map((id) => [id, '2020-01-01T00:00:00.000Z'])),
  );
  return { h, roots };
}

function service(h: BridgeHarness) {
  return createTaskGroups({
    projects: h.projects,
    follows: createFollowUps({
      projects: h.projects,
      agents: h.agents,
      preferences: {
        get: (userId, key) =>
          Promise.resolve(h.preferences.get(`${userId}:${key}`)),
        set: (userId, key, value) => {
          h.preferences.set(`${userId}:${key}`, structuredClone(value));
          return Promise.resolve();
        },
      },
    }),
  });
}

const scope = new AsyncLocalStorage<symbol>();

/** The statements `read` runs, after a first call has read what the database layer caches. */
async function queries(
  h: BridgeHarness,
  read: () => Promise<unknown>,
): Promise<number> {
  const client = await h.database.connection().client<Knex>();
  await read();
  const mark = Symbol('read');
  let count = 0;
  const listener = () => {
    if (scope.getStore() === mark) count += 1;
  };
  client.on('query', listener);
  try {
    await scope.run(mark, read);
  } finally {
    client.removeListener('query', listener);
  }
  return count;
}

async function counts({ h, roots }: Workload): Promise<Record<string, number>> {
  const tasks = service(h);
  const alice = h.viewer('alice');
  const ok = async (path: string) => {
    const response = await h.request('GET', path, { user: 'alice' });
    expect({ path, status: response.status }).toEqual({ path, status: 200 });
    return response.body as { data: unknown };
  };
  const table = await tasks.read(alice, { mode: 'table' });
  return {
    summary: await queries(h, () => tasks.summary(alice)),
    owned: await queries(h, () =>
      ok('/taskGroups?ownerUserId=alice&mode=split&follow=all'),
    ),
    executing: await queries(h, () =>
      ok('/taskGroups?executorId=alice&mode=split&follow=all'),
    ),
    table: await queries(h, () => ok('/taskGroups?mode=table')),
    rows: await queries(h, () =>
      ok(`/taskGroups/rows?mode=table&ids=${roots.slice(0, 3).join(',')}`),
    ),
    children: await queries(h, () =>
      tasks.children(alice, {
        parentIds: roots.slice(0, 3),
        generation: table.generation,
      }),
    ),
    following: await queries(h, () => ok('/followUps/following')),
  };
}

it('reads a fixed number of queries whatever the number of tasks', async () => {
  const few = await counts(await workload(4));
  const many = await counts(await workload(16));
  expect(many).toEqual(few);
}, 180_000);

it('reads the children of several parents and single rows in one request each', async () => {
  const { h, roots } = await workload(6);
  const tasks = service(h);
  const alice = h.viewer('alice');
  const table = await tasks.read(alice, { mode: 'table' });
  const children = await tasks.children(alice, {
    parentIds: roots.slice(0, 3),
    generation: table.generation,
  });
  expect(children.parents.map((page) => page.parentId)).toEqual(
    roots.slice(0, 3),
  );
  for (const page of children.parents)
    expect(page.data.map((item) => item.issue.parentIssueId)).toEqual([
      page.parentId,
      page.parentId,
      page.parentId,
    ]);

  // An edit that moves nothing answers the same membership; a status change moves the task to another group. The
  // first half are followed, so they stay in the follow group whatever their status.
  const split = await tasks.read(alice, {});
  const root = await h.projects.issueQueries.visible(alice, roots[5]!);
  const renamed = await h.projects.issues.update(alice, root.id, {
    revision: root.revision,
    title: 'Renamed root',
  });
  const rows = await tasks.rows(alice, { ids: [root.id, 'missing'] });
  expect(rows.membership).toBe(split.membership);
  expect(rows.data.map((item) => item.issue.title)).toEqual(['Renamed root']);
  await h.projects.issues.update(alice, root.id, {
    revision: renamed.revision,
    statusKey: 'in_progress',
  });
  expect((await tasks.rows(alice, { ids: [root.id] })).membership).not.toBe(
    split.membership,
  );
}, 60_000);

it('reuses a viewer’s summary for a few seconds', async () => {
  const { h } = await workload(2);
  const stored = new Map<string, unknown>();
  let computed = 0;
  const tasks = createTaskGroups({
    projects: h.projects,
    cache: {
      async wrap<T>(key: string, load: () => T | Promise<T>): Promise<T> {
        if (!stored.has(key)) {
          computed += 1;
          stored.set(key, await load());
        }
        return stored.get(key) as T;
      },
    },
  });
  const first = await tasks.summary(h.viewer('alice'));
  expect(await tasks.summary(h.viewer('alice'))).toEqual(first);
  expect(computed).toBe(1);
  // Another viewer, or the same one with other permissions, counts on their own.
  await tasks.summary(h.viewer('bob'));
  await tasks.summary({ ...h.viewer('alice'), projectIds: [] });
  expect(computed).toBe(3);
}, 60_000);

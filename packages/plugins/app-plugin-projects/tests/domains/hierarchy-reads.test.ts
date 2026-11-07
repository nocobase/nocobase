// @vitest-environment node
/**
 * The authorized hierarchy a grouped list is built from (`issueQueries.hierarchy`, `hierarchyItems`): which issues wait
 * for unfinished ones, as the list counts tell it, in a fixed number of queries whatever the number of issues; and the
 * `moved` mark on a change of project, parent or executor, which announces the change as one that moves lists.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { Knex } from 'knex';
import { afterEach, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import { createHarness, type Harness } from '../harness.js';

const harnesses: Harness[] = [];
afterEach(async () => {
  for (const h of harnesses.splice(0)) await h.close();
});

async function harness(): Promise<Harness> {
  const h = await createHarness();
  harnesses.push(h);
  await h.addUser('admin', 'admin');
  return h;
}

const admin = (h: Harness) => h.viewer('admin', 'admin');

async function move(h: Harness, issue: Issue, statusKey: string) {
  const current = await h.services.issueQueries.visible(admin(h), issue.id);
  return h.services.issues.update(admin(h), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

/** `n` chains of a parent with three staged sub-issues, each parent waiting for the one before it. */
async function seed(h: Harness, n: number): Promise<Issue[]> {
  const issues: Issue[] = [];
  let previous: Issue | null = null;
  for (let at = 0; at < n; at += 1) {
    const parent: Issue = await h.services.issues.create(admin(h), {
      title: `Parent ${at}`,
      ...(previous ? { blockedBy: [previous.id] } : {}),
    });
    issues.push(parent);
    for (let stage = 0; stage < 3; stage += 1)
      issues.push(
        await h.services.issues.create(admin(h), {
          title: `Step ${at}.${stage}`,
          parentIssueId: parent.id,
          stage,
        }),
      );
    // Every other chain's first stage is finished, so its second stage no longer waits.
    if (at % 2 === 0) await move(h, issues.at(-3)!, 'done');
    if (previous && at % 3 === 0) await move(h, previous, 'done');
    previous = parent;
  }
  return issues;
}

const scope = new AsyncLocalStorage<symbol>();

async function queries(h: Harness, read: () => Promise<unknown>) {
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

it('tells which issues wait as the list counts do, in a fixed number of queries', async () => {
  const counts: number[][] = [];
  for (const size of [2, 8]) {
    const h = await harness();
    const issues = await seed(h, size);
    const hierarchy = await h.services.issueQueries.hierarchy(admin(h), {});
    const items = await h.services.issueQueries.hierarchyItems(
      admin(h),
      issues.map((issue) => issue.id),
    );
    expect(
      [...hierarchy.blockedIds].sort(),
      'the issues whose list row counts an unfinished blocker',
    ).toEqual(
      items
        .filter((item) => item.blockedCount > 0)
        .map((item) => item.id)
        .sort(),
    );
    expect(hierarchy.blockedIds.size).toBeGreaterThan(0);
    const readable = new Set(hierarchy.issues.map((issue) => issue.id));
    counts.push([
      await queries(h, () => h.services.issueQueries.hierarchy(admin(h), {})),
      await queries(h, () =>
        h.services.issueQueries.hierarchy(admin(h), { statusKey: 'backlog' }),
      ),
      await queries(h, () =>
        h.services.issueQueries.hierarchyItems(
          admin(h),
          issues.map((issue) => issue.id),
          readable,
        ),
      ),
    ]);
  }
  expect(counts[1]).toEqual(counts[0]);
}, 120_000);

it('matches exact filters on the issues already read, and reads the others', async () => {
  const h = await harness();
  const [parent] = await seed(h, 2);
  await move(h, parent!, 'in_progress');
  const all = await h.services.issueQueries.hierarchy(admin(h), {});
  const working = await h.services.issueQueries.hierarchy(admin(h), {
    statusKey: 'in_progress',
  });
  expect(working.matchingIds).toEqual([parent!.id]);
  expect(working.issues).toHaveLength(all.issues.length);
  // Owned by the person, or executed by them as a user, as the database filter reads it.
  await h.addUser('bob', 'bob');
  const executed = await h.services.issues.create(admin(h), {
    title: 'Bob executes',
    ownerUserId: 'admin',
    executor: { type: 'user', id: 'bob' },
  });
  const involved = await h.services.issueQueries.hierarchy(admin(h), {
    involvesUserId: 'bob',
  });
  expect(involved.matchingIds).toEqual([executed.id]);
  expect(
    (
      await h.services.issueQueries.hierarchy(admin(h), {
        involvesUserId: 'admin',
      })
    ).matchingIds,
  ).toHaveLength(all.issues.length + 1);
  const searched = await h.services.issueQueries.hierarchy(admin(h), {
    q: 'step 1.',
  });
  expect(searched.matchingIds).toHaveLength(3);
});

it('marks a change of project, parent or executor as moving the issue', async () => {
  const h = await harness();
  const changed: { issueId: string; moved?: boolean }[] = [];
  h.services.events.onAny((event) => {
    if (event.type === 'issue.changed')
      changed.push(event as unknown as { issueId: string; moved?: boolean });
  });
  const project = await h.services.projects.create(admin(h), {
    name: 'Elsewhere',
  });
  const parent = await h.services.issues.create(admin(h), { title: 'Parent' });
  const issue = await h.services.issues.create(admin(h), { title: 'Issue' });
  const marks = async (patch: Record<string, unknown>) => {
    changed.length = 0;
    const current = await h.services.issueQueries.visible(admin(h), issue.id);
    await h.services.issues.update(admin(h), issue.id, {
      revision: current.revision,
      ...patch,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    return changed
      .filter((event) => event.issueId === issue.id)
      .map((event) => event.moved === true);
  };
  expect(await marks({ title: 'Renamed' })).toEqual([false]);
  expect(await marks({ projectId: project.id })).toEqual([true]);
  expect(await marks({ parentIssueId: parent.id })).toEqual([true]);
  expect(await marks({ executor: { type: 'user', id: 'admin' } })).toEqual([
    true,
  ]);
});

it('limits hierarchy records to unfinished issues, explicit issues and contiguous visible ancestors', async () => {
  const h = await harness();
  const parent = await h.services.issues.create(admin(h), {
    title: 'Finished parent',
  });
  await move(h, parent, 'done');
  const child = await h.services.issues.create(admin(h), {
    title: 'Unfinished child',
    parentIssueId: parent.id,
  });
  const followed = await h.services.issues.create(admin(h), {
    title: 'Finished explicit issue',
  });
  await move(h, followed, 'done');
  const historical = await h.services.issues.create(admin(h), {
    title: 'Other history',
  });
  await move(h, historical, 'cancelled');
  const result = await h.services.issueQueries.hierarchy(
    admin(h),
    {},
    { unfinishedOnly: true, includeIds: [followed.id] },
  );
  expect(result.issues.map((issue) => issue.id).sort()).toEqual(
    [parent.id, child.id, followed.id].sort(),
  );
  expect(
    (await h.services.issueQueries.hierarchy(admin(h), {})).issues,
  ).toHaveLength(4);
  expect(
    (
      await h.services.issueQueries.hierarchy(
        { ...admin(h), projectIds: [] },
        {},
        { unfinishedOnly: true, includeIds: [followed.id] },
      )
    ).issues,
  ).toEqual([]);
});

it('keeps database hierarchy relations equivalent to authorized filter matches', async () => {
  const h = await harness();
  await seed(h, 2);
  const client = await h.database.connection().client<Knex>();
  for (const viewer of [
    admin(h),
    { ...admin(h), projectIds: [] },
    h.viewer('admin', 'member'),
  ]) {
    for (const query of [
      {},
      { statusKey: 'done' },
      { involvesUserId: 'admin' },
      { q: 'STEP 1.' },
      { q: '%' },
    ]) {
      const hierarchy = await h.services.issueQueries.hierarchy(viewer, query);
      const source = await h.services.issueQueries.hierarchySource(
        viewer,
        query,
      );
      const rows = (await client
        .with(
          'authorized',
          client.raw(source.matching.sql, [
            ...source.matching.parameters,
          ] as Knex.RawBinding[]),
        )
        .select('id')
        .from('authorized')) as { id: string }[];
      expect(rows.map((row) => row.id).sort()).toEqual(
        [...hierarchy.matchingIds].sort(),
      );
    }
  }
});

it('keeps the blocker relation equivalent to hierarchy waits without exposing invisible blockers', async () => {
  const h = await harness();
  await h.addUser('bob');
  const issues = await seed(h, 2);
  const secret = await h.services.projects.create(admin(h), {
    name: 'Hidden blockers',
    visibility: 'members',
  });
  for (const issue of [issues[0]!, issues[2]!]) {
    const current = await h.services.issueQueries.visible(admin(h), issue.id);
    await h.services.issues.update(admin(h), issue.id, {
      revision: current.revision,
      projectId: secret.id,
    });
  }
  const self = issues.at(-1)!;
  await h.database
    .connection()
    .query.insertInto('pmIssueDependencies')
    .values({
      id: 'historical-self',
      issueId: self.id,
      dependsOnIssueId: self.id,
      type: 'blockedBy',
      createdByType: 'user',
      createdById: 'admin',
      createdAt: new Date().toISOString(),
    })
    .execute();
  await move(h, issues[0]!, 'backlog');
  const viewer = h.viewer('bob', 'member');
  const client = await h.database.connection().client<Knex>();
  for (const state of ['open', 'done', 'deleted', 'restored'] as const) {
    if (state === 'done') await move(h, issues[2]!, 'done');
    if (state === 'deleted')
      await h.services.issues.remove(admin(h), issues[0]!.id);
    if (state === 'restored')
      await h.services.issues.restore(admin(h), issues[0]!.id);
    const hierarchy = await h.services.issueQueries.hierarchy(
      viewer,
      {},
      { unfinishedOnly: true },
    );
    const source = await h.services.issueQueries.hierarchySource(viewer, {});
    const rows = (await client
      .with(
        'authorized',
        client.raw(source.blocked.sql, [
          ...source.blocked.parameters,
        ] as Knex.RawBinding[]),
      )
      .select('id')
      .from('authorized')) as { id: string }[];
    const unfinished = new Set(
      hierarchy.issues
        .filter((i) => !['done', 'cancelled'].includes(i.statusKey))
        .map((i) => i.id),
    );
    expect(rows.map((r) => r.id).sort()).toEqual(
      [...hierarchy.blockedIds].filter((id) => unfinished.has(id)).sort(),
    );
    expect(rows.map((r) => r.id)).not.toContain(issues[0]!.id);
    expect(rows.map((r) => r.id)).not.toContain(issues[2]!.id);
  }
});

it('hydrates narrow count candidates without materializing unrelated visible records', async () => {
  const h = await harness();
  const issues = await seed(h, 1);
  const viewer = admin(h);
  for (let n = 0; n < 24; n++)
    await h.services.issues.create(viewer, { title: `Unrelated ${n}` });
  const source = await h.services.issueQueries.hierarchySource(viewer, {});
  const read = () =>
    h.services.issueQueries.hierarchyItems(
      viewer,
      [issues[3]!.id],
      source.visible,
    );
  await read();
  const client = await h.database.connection().client<Knex>();
  const mark = Symbol('narrow-counts');
  const sizes: number[] = [];
  const listener = (rows: unknown) => {
    if (scope.getStore() === mark && Array.isArray(rows))
      sizes.push(rows.length);
  };
  client.on('query-response', listener);
  try {
    const rows = await scope.run(mark, read);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.blockedCount).toBe(1);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(4);
  } finally {
    client.removeListener('query-response', listener);
  }
});

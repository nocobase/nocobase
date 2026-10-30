// @vitest-environment node
/**
 * The flat issue lists under load (`issueQueries.board`, `issueQueries.page`): the board reads a fixed number of
 * queries whatever the number of issues, answers each column as its own page would, and a page narrowed to some issues
 * (`issueIds`) keeps the other filters.
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

const STATUSES = ['backlog', 'in_progress', 'in_review', 'blocked', 'done'];

async function workload(n: number): Promise<{ h: Harness; issues: Issue[] }> {
  const h = await createHarness();
  harnesses.push(h);
  await h.addUser('admin', 'admin');
  await h.addUser('alice', 'alice');
  const admin = h.viewer('admin', 'admin');
  const project = await h.services.projects.create(admin, { name: 'P' });
  const label = await h.services.labels.create(admin, {
    name: 'L',
    color: 'blue',
  });
  const issues: Issue[] = [];
  for (let at = 0; at < n; at += 1) {
    const created = await h.services.issues.create(admin, {
      title: `Issue ${at}`,
      ...(at % 2 === 0 ? { projectId: project.id } : {}),
      ...(at % 3 === 0 ? { labelIds: [label.id] } : {}),
      ...(at % 4 === 1 && issues[0] ? { parentIssueId: issues[0].id } : {}),
      ...(at % 5 === 4 && issues.at(-2)
        ? { blockedBy: [issues.at(-2)!.id] }
        : {}),
    });
    const statusKey = STATUSES[at % STATUSES.length]!;
    issues.push(
      statusKey === 'backlog'
        ? created
        : await h.services.issues.update(admin, created.id, {
            revision: created.revision,
            statusKey,
          }),
    );
  }
  return { h, issues };
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

it('reads the board in a fixed number of queries whatever the number of issues', async () => {
  const counts: number[][] = [];
  for (const n of [8, 32]) {
    const { h, issues } = await workload(n);
    const admin = h.viewer('admin', 'admin');
    const member = h.viewer('alice');
    counts.push([
      await queries(h, () => h.services.issueQueries.board(admin, {})),
      await queries(h, () => h.services.issueQueries.board(member, {})),
      await queries(h, () =>
        h.services.issueQueries.board(admin, { q: 'Issue', limit: 3 }),
      ),
      await queries(h, () =>
        h.services.issueQueries.page(admin, {
          issueIds: issues.slice(0, 5).map((issue) => issue.id),
        }),
      ),
    ]);
  }
  expect(counts[1]).toEqual(counts[0]);
}, 120_000);

it('answers each board column as its own page would', async () => {
  const { h } = await workload(14);
  const admin = h.viewer('admin', 'admin');
  for (const query of [{ limit: 2 }, { limit: 2, sort: 'priority' as const }]) {
    const board = await h.services.issueQueries.board(admin, query);
    for (const column of board.columns) {
      const page = await h.services.issueQueries.page(admin, {
        ...query,
        statusKey: column.status.key,
      });
      expect(column.issues).toEqual(page.data);
      expect(column.nextCursor).toEqual(page.nextCursor);
    }
  }
}, 60_000);

it('narrows a page to the issues named, within the other filters', async () => {
  const { h, issues } = await workload(10);
  const admin = h.viewer('admin', 'admin');
  const ids = issues.slice(0, 4).map((issue) => issue.id);
  const named = await h.services.issueQueries.page(admin, { issueIds: ids });
  expect(named.data.map((issue) => issue.id).sort()).toEqual([...ids].sort());
  const backlog = await h.services.issueQueries.page(admin, {
    issueIds: ids,
    statusKey: 'backlog',
  });
  expect(backlog.data.map((issue) => issue.id)).toEqual([issues[0]!.id]);
}, 60_000);

it('checks issue visibility once when reading detail and still protects older activity pages', async () => {
  const { h, issues } = await workload(1);
  const issue = issues[0]!;
  const viewer = h.viewer('admin', 'admin');
  await h.services.issueQueries.detail(viewer, issue.id);
  const client = await h.database.connection().client<Knex>();
  const mark = Symbol('detail');
  const statements: string[] = [];
  const listener = ({ sql }: { sql: string }) => {
    if (scope.getStore() === mark) statements.push(sql);
  };
  client.on('query', listener);
  try {
    const detail = await scope.run(mark, () =>
      h.services.issueQueries.detail(viewer, issue.id),
    );
    expect(detail.activities.map((item) => item.action)).toContain(
      'issue_created',
    );
    expect(statements.length).toBeLessThanOrEqual(23);
    expect(
      statements.every(
        (sql) =>
          !/^(insert|update|delete|begin|commit)\b|\bfor\s+update\b/iu.test(
            sql,
          ),
      ),
    ).toBe(true);
    for (const idOrKey of [issue.id, issue.identifier]) {
      statements.length = 0;
      await expect(
        scope.run(mark, () =>
          h.services.issueQueries.detail(h.viewer('alice', 'none'), idOrKey),
        ),
      ).rejects.toMatchObject({ kind: 'notFound' });
      // Identifiers add one failed id lookup before the associated row read.
      expect(statements.length).toBeLessThanOrEqual(
        idOrKey === issue.id ? 4 : 5,
      );
      expect(
        statements.some((sql) =>
          /pm_activities|pm_comments|pm_attachments/iu.test(sql),
        ),
      ).toBe(false);
    }
  } finally {
    client.removeListener('query', listener);
  }
  await expect(
    h.services.issueQueries.activities(h.viewer('alice', 'none'), issue.id, {}),
  ).rejects.toMatchObject({ kind: 'notFound' });
});

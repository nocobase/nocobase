// @vitest-environment node
import { afterEach, beforeEach, expect, it } from 'vitest';

import type { Viewer } from '../../server/access/viewer.js';
import {
  canSee,
  visibleIssueIds,
} from '../../server/domains/issues/issue.access.js';
import { findIssues } from '../../server/domains/issues/issue.store.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'alice', 'bob', 'carol']) await h.addUser(id);
});
afterEach(() => h.close());

it('matches single-issue visibility for scopes, project restrictions and deleted issues', async () => {
  const admin = h.viewer('admin', 'admin');
  const open = await h.services.projects.create(admin, { name: 'Open' });
  const own = await h.services.projects.create(admin, {
    name: 'Alice only',
    visibility: 'members',
    leadUserId: 'alice',
  });
  const joined = await h.services.projects.create(admin, {
    name: 'Bob joined',
    visibility: 'members',
  });
  await h.services.projects.addMember(admin, joined.id, { userId: 'bob' });
  const ids: string[] = [];
  for (const projectId of [null, open.id, own.id, joined.id]) {
    const issue = await h.services.issues.create(admin, {
      title: 'Candidate',
      projectId,
    });
    ids.push(issue.id);
  }
  const removed = await h.services.issues.create(admin, {
    title: 'Removed',
    projectId: open.id,
  });
  await h.services.issues.remove(admin, removed.id);
  ids.push(removed.id);
  const alice = h.viewer('alice');
  const scoped = (
    view: Viewer,
    scope: Viewer['permissions']['scopes']['pm.issues/view'],
  ): Viewer => ({
    ...view,
    permissions: {
      ...view.permissions,
      scopes: { ...view.permissions.scopes, 'pm.issues/view': scope },
    },
  });
  const viewers: Viewer[] = [
    admin,
    alice,
    h.viewer('bob'),
    h.viewer('carol'),
    scoped(alice, 'none'),
    scoped(alice, { users: ['alice', 'bob'] }),
    { ...alice, projectIds: [] },
    { ...alice, projectIds: [open.id] },
    { ...admin, projectIds: [joined.id] },
    {
      ...alice,
      permissions: {
        ...alice.permissions,
        scopes: { ...alice.permissions.scopes, 'pm.projects/view': 'none' },
      },
    },
  ];
  const conn = h.services.tx.read();
  const issues = await findIssues(conn, ids);
  const client = await h.database.connection().client();
  for (const viewer of viewers) {
    const expected = new Set<string>();
    for (const issue of issues)
      if (await canSee(conn, viewer, issue)) expected.add(issue.id);
    const sql: string[] = [];
    const listener = (query: { sql: string }) => sql.push(query.sql);
    client.on('query', listener);
    let actual: Set<string>;
    try {
      actual = await visibleIssueIds(conn, viewer, [...ids, ...ids, 'missing']);
    } finally {
      client.off('query', listener);
    }
    expect(actual).toEqual(expected);
    expect(sql.filter((query) => /^select/i.test(query))).toHaveLength(1);
    expect(
      sql.filter((query) =>
        /^(insert|update|delete|begin)|for update/i.test(query),
      ),
    ).toEqual([]);
  }
  expect(await visibleIssueIds(conn, alice, [])).toEqual(new Set());
});

it('does not retain a visible relation after membership or the viewer changes', async () => {
  const admin = h.viewer('admin', 'admin');
  const project = await h.services.projects.create(admin, { name: 'Source' });
  const secret = await h.services.projects.create(admin, {
    name: 'Secret',
    visibility: 'members',
  });
  await h.services.projects.addMember(admin, secret.id, { userId: 'alice' });
  const source = await h.services.issues.create(admin, {
    title: 'Source',
    projectId: project.id,
  });
  const target = await h.services.issues.create(admin, {
    title: 'Hidden title',
    projectId: secret.id,
  });
  await h.services.subtasks.addDependency(admin, source.id, {
    dependsOnIssueId: target.id,
    type: 'blockedBy',
  });
  const child = await h.services.issues.create(admin, {
    title: 'Child',
    projectId: project.id,
    parentIssueId: source.id,
  });
  await h.services.subtasks.addDependency(admin, child.id, {
    dependsOnIssueId: target.id,
    type: 'blockedBy',
  });
  const read = (user: string) =>
    h.services.issueQueries.detail(h.viewer(user), source.id);
  expect(
    (await read('alice')).blockers.map((blocker) => blocker.title),
  ).toEqual(['Hidden title']);
  expect((await read('bob')).hiddenBlockerCount).toBe(1);
  await h.services.projects.removeMember(admin, secret.id, 'alice');
  const revoked = await read('alice');
  expect(revoked.blockers).toEqual([]);
  expect(revoked.blockedBy).toEqual([]);
  expect(revoked.hiddenBlockerCount).toBe(1);
  expect(revoked.subtasks).toEqual([
    expect.objectContaining({ id: child.id, blockedCount: 1 }),
  ]);
  expect(JSON.stringify(revoked)).not.toContain('Hidden title');
  await h.services.projects.addMember(admin, secret.id, { userId: 'bob' });
  expect((await read('bob')).blockers.map((blocker) => blocker.title)).toEqual([
    'Hidden title',
  ]);
  expect((await read('alice')).hiddenBlockerCount).toBe(1);
});

it('batches all stage blockers with a fixed read budget', async () => {
  const admin = h.viewer('admin', 'admin');
  const project = await h.services.projects.create(admin, {
    name: 'Stages',
    leadUserId: 'alice',
  });
  const parent = await h.services.issues.create(admin, {
    title: 'Parent',
    projectId: project.id,
  });
  const source = await h.services.issues.create(admin, {
    title: 'Later',
    projectId: project.id,
    parentIssueId: parent.id,
    stage: 2,
  });
  const client = await h.database.connection().client();
  const counts: number[] = [];
  for (const size of [1, 10, 100]) {
    const existing = await h.services.issueQueries.detail(admin, parent.id);
    for (let index = existing.subtasks.length - 1; index < size; index++) {
      await h.services.issues.create(admin, {
        title: `Earlier ${index}`,
        projectId: project.id,
        parentIssueId: parent.id,
        stage: 1,
      });
    }
    const sql: string[] = [];
    const listener = (query: { sql: string }) => sql.push(query.sql);
    client.on('query', listener);
    let detail;
    try {
      detail = await h.services.subtasks.extras.relations(
        h.services.tx.read(),
        h.viewer('alice'),
        source,
      );
    } finally {
      client.off('query', listener);
    }
    expect(detail.blockers).toHaveLength(size);
    expect(detail.hiddenBlockerCount).toBe(0);
    expect(
      sql.filter((query) =>
        /^(insert|update|delete|begin)|for update/i.test(query),
      ),
    ).toEqual([]);
    counts.push(sql.filter((query) => /^select/i.test(query)).length);
  }
  expect(counts).toEqual([counts[0], counts[0], counts[0]]);
  expect(counts[0]).toBeLessThanOrEqual(12);
});

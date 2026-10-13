// @vitest-environment node
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { readTaskTrees } from '../../server/issues/task-trees.js';
import type { TaskTrees, TaskTreePage } from '../../shared/task-trees.js';
import { taskAttention } from '../../server/issues/task-attention.js';
import { TreeCursorError } from '../../server/issues/tree-model.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) {
    await h.addUser(id);
    h.roles.set(id, 'admin');
  }
});
afterEach(() => h.close());
const read = async (query = {}) =>
  (await readTaskTrees(
    h.projects,
    undefined,
    h.viewer('alice'),
    query,
  )) as TaskTrees;

it('requires authentication and view permission on grouped and child reads', async () => {
  expect((await h.request('GET', '/taskTrees')).status).toBe(401);
  h.roles.set('bob', 'none');
  expect((await h.request('GET', '/taskTrees', { user: 'bob' })).status).toBe(
    403,
  );
  expect(
    (
      await h.request(
        'GET',
        '/taskTrees/children?parentId=missing&generation=x',
        { user: 'bob' },
      )
    ).status,
  ).toBe(403);
  const result = await h.request('GET', '/taskTrees', { user: 'alice' });
  expect(result.status).toBe(200);
  expect(result.body.data.groups).toHaveLength(4);
  expect(
    (await h.request('GET', '/taskTrees/children', { user: 'alice' })).status,
  ).toBe(400);
});

it('groups a matching grandchild once with authorized context and actual workflow states', async () => {
  const parent = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Parent',
    statusKey: 'in_progress',
    start: false,
  });
  const child = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Child',
    parentIssueId: parent.id,
    statusKey: 'in_progress',
    start: false,
  });
  const grandchild = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Need input',
    parentIssueId: child.id,
    statusKey: 'in_progress',
    start: false,
  });
  await h.projects.issues.update(h.viewer('alice'), grandchild.id, {
    revision: grandchild.revision,
    statusKey: 'blocked',
  });
  const result = await read({ q: 'Need input' });
  const group = result.groups[0]!;
  expect(group.totals).toEqual({
    tasks: 1,
    trees: 1,
    needsHumanAction: 1,
    waitingForViewer: 1,
  });
  expect(group.data[0]).toMatchObject({
    matchesFilter: false,
    issue: { id: parent.id, statusKey: 'in_progress' },
    explanation: { identifier: grandchild.identifier, reason: 'question' },
  });
  const children = (await readTaskTrees(
    h.projects,
    undefined,
    h.viewer('alice'),
    { q: 'Need input', parentId: parent.id, generation: result.generation },
  )) as TaskTreePage;
  expect(children.data[0]).toMatchObject({
    matchesFilter: false,
    issue: { id: child.id },
  });
  const updated = await h.projects.issueQueries.detail(
    h.viewer('alice'),
    grandchild.id,
  );
  await h.projects.issues.update(h.viewer('alice'), grandchild.id, {
    revision: updated.revision,
    statusKey: 'in_progress',
  });
  await expect(
    readTaskTrees(h.projects, undefined, h.viewer('alice'), {
      q: 'Need input',
      parentId: parent.id,
      generation: result.generation,
    }),
  ).rejects.toBeInstanceOf(TreeCursorError);
  expect((await read({ q: 'Need input' })).groups[3]!.totals.tasks).toBe(1);
});

it('retains global totals across root/child pages and direct progress under filters', async () => {
  const parent = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Pagination parent',
    start: false,
  });
  const tasks = [];
  for (let i = 0; i < 57; i++)
    tasks.push(
      await h.projects.issues.create(h.viewer('alice'), {
        title: `Task ${i}`,
        parentIssueId: parent.id,
        start: false,
      }),
    );
  await h.projects.issues.update(h.viewer('alice'), tasks[0]!.id, {
    revision: 1,
    statusKey: 'cancelled',
  });
  expect(
    (await h.projects.issueQueries.detail(h.viewer('alice'), tasks[0]!.id))
      .statusKey,
  ).toBe('cancelled');
  for (let i = 0; i < 52; i++)
    await h.projects.issues.create(h.viewer('alice'), {
      title: `Root ${i}`,
      start: false,
    });
  const first = await read({ sort: 'number', direction: 'asc' });
  expect(first.groups[3]!.totals).toMatchObject({ tasks: 110, trees: 53 });
  expect(first.groups[3]!.data).toHaveLength(50);
  const second = await read({
    sort: 'number',
    direction: 'asc',
    group: 'routine',
    generation: first.generation,
    cursor: first.groups[3]!.nextCursor!,
  });
  expect(second.groups[3]!.data).toHaveLength(3);
  const filtered = await read({ q: 'Pagination parent' });
  expect(filtered.groups[3]!.data[0]!.progress).toEqual({
    finished: 1,
    total: 57,
  });
  const children = (await readTaskTrees(
    h.projects,
    undefined,
    h.viewer('alice'),
    {
      q: 'Pagination parent',
      parentId: parent.id,
      generation: filtered.generation,
    },
  )) as TaskTreePage;
  expect(children.data).toHaveLength(50);
  expect(children.data.every((row) => !row.matchesFilter)).toBe(true);
  const next = (await readTaskTrees(h.projects, undefined, h.viewer('alice'), {
    q: 'Pagination parent',
    parentId: parent.id,
    generation: filtered.generation,
    cursor: children.nextCursor!,
  })) as TaskTreePage;
  expect(next.data).toHaveLength(7);
});

it('does not expose inaccessible ancestors or inflate visible progress, including project-scoped keys', async () => {
  const secret = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Secret',
    visibility: 'members',
  });
  const publicProject = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Visible',
  });
  const parent = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Private ancestor',
    projectId: secret.id,
    start: false,
  });
  const child = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Readable child',
    parentIssueId: parent.id,
    start: false,
  });
  // Moving a child to another project preserves its parent; every record must be authorized independently.
  await h.projects.issues.update(h.viewer('alice'), child.id, {
    revision: child.revision,
    projectId: publicProject.id,
  });
  expect(
    (await h.projects.issueQueries.detail(h.viewer('alice'), child.id))
      .parentIssueId,
  ).toBe(parent.id);
  const viewer = { ...h.viewer('bob'), projectIds: [publicProject.id] };
  const result = (await readTaskTrees(h.projects, undefined, viewer, {
    q: 'Readable child',
  })) as TaskTrees;
  const root = result.groups[3]!.data[0]!;
  expect(root).toMatchObject({
    parentId: null,
    rootId: child.id,
    issue: { parentIssueId: null },
  });
  expect(JSON.stringify(result)).not.toContain('Private ancestor');
  expect(JSON.stringify(result)).not.toContain(parent.id);
  const keyResult = await h.request('GET', '/taskTrees?q=Readable%20child', {
    user: 'bob',
    headers: {
      'x-test-key-scope': JSON.stringify({
        'projects.issues': { level: 'read' },
        'projects.projects': { level: 'read', objects: [publicProject.id] },
      }),
    },
  });
  expect(keyResult.status).toBe(200);
  expect(JSON.stringify(keyResult.body)).not.toContain(parent.id);
  expect(keyResult.body.data.groups[3].data[0].parentId).toBeNull();
  const empty = (await readTaskTrees(
    h.projects,
    undefined,
    { ...viewer, projectIds: [] },
    {},
  )) as TaskTrees;
  expect(empty.groups.every((group) => group.totals.tasks === 0)).toBe(true);
});

it('excludes dependency-only blocking and deduplicates workflow and inbox reasons', async () => {
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Question',
    start: false,
  });
  const blocked = { ...issue, statusKey: 'blocked' };
  expect(
    taskAttention(blocked, h.viewer('alice'), true, []).needsHumanAction,
  ).toBe(false);
  expect(
    taskAttention(blocked, h.viewer('alice'), false, [
      { issueId: issue.id, type: 'agent_blocked', waitingForViewer: true },
      { issueId: issue.id, type: 'run_failed_final', waitingForViewer: false },
    ]),
  ).toEqual({
    reasons: ['question', 'failedRun'],
    needsHumanAction: true,
    waitingForViewer: true,
  });
  expect(
    taskAttention(
      { ...blocked, statusKey: 'cancelled' },
      h.viewer('alice'),
      false,
      [{ issueId: issue.id, type: 'agent_blocked', waitingForViewer: true }],
    ).needsHumanAction,
  ).toBe(false);
  expect(
    taskAttention(blocked, h.viewer('bob'), false, []).waitingForViewer,
  ).toBe(false);
});

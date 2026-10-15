// @vitest-environment node
import { afterEach, beforeEach, expect, it } from 'vitest';

import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import { FOLLOWING_PREFERENCE } from '../../shared/follow-ups.js';
import type { TaskGroups } from '../../shared/task-groups.js';
import { createFollowUps } from '../../server/follow-ups/service.js';
import type { TaskDecisionSummary } from '../../server/inbox/service.js';
import { TaskGroupsChangedError } from '../../server/issues/task-group-model.js';
import { createTaskGroups } from '../../server/issues/task-groups.js';
import { taskWait } from '../../server/issues/task-waits.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
let decisions: TaskDecisionSummary[];
beforeEach(async () => {
  h = await createBridgeHarness();
  decisions = [];
  for (const id of ['alice', 'bob']) {
    await h.addUser(id);
    h.roles.set(id, 'admin');
  }
});
afterEach(() => h.close());

function service() {
  return createTaskGroups({
    projects: h.projects,
    inbox: {
      taskDecisions: (ids) =>
        Promise.resolve(decisions.filter((d) => ids.includes(d.issueId))),
    },
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

async function create(
  title: string,
  statusKey = 'backlog',
  extra: { parentIssueId?: string; owner?: string; executorId?: string } = {},
) {
  const as = h.viewer(extra.owner ?? 'alice');
  const created = await h.projects.issues.create(as, {
    title,
    start: false,
    ...(extra.parentIssueId ? { parentIssueId: extra.parentIssueId } : {}),
    ...(extra.executorId
      ? { executor: { type: 'user', id: extra.executorId } }
      : {}),
  });
  if (statusKey === 'backlog') return created;
  return h.projects.issues.update(as, created.id, {
    revision: created.revision,
    statusKey,
  });
}

const groupIds = (result: TaskGroups) =>
  result.groups.map((group) => group.group);
const titles = (result: TaskGroups, group: string) =>
  result.groups
    .find((entry) => entry.group === group)
    ?.data.map((item) => item.issue.title) ?? [];

it('requires authentication and the issue view permission, and documents itself', async () => {
  expect((await h.request('GET', '/taskGroups')).status).toBe(401);
  expect((await h.request('GET', '/taskGroups/summary')).status).toBe(401);
  h.roles.set('bob', 'none');
  for (const path of [
    '/taskGroups',
    '/taskGroups/summary',
    '/taskGroups/children?parentId=x&generation=y',
  ])
    expect((await h.request('GET', path, { user: 'bob' })).status).toBe(403);
  const ok = await h.request('GET', '/taskGroups', { user: 'alice' });
  expect(ok.status).toBe(200);
  expect(ok.body.data).toMatchObject({ mode: 'split', waiting: 0 });
  expect(
    (await h.request('GET', '/taskGroups/children', { user: 'alice' })).status,
  ).toBe(400);
  expect(
    (await h.request('GET', '/taskGroups?cursor=abc', { user: 'alice' }))
      .status,
  ).toBe(400);
});

it('groups My tasks by what waits for the owner, then by status', async () => {
  await create('Accept me', 'in_review');
  await create('Answer me', 'blocked');
  await create('Working', 'in_progress');
  await create('Planned');
  await create('Shipped', 'done');
  await create('Dropped', 'cancelled');
  const result = await service().read(h.viewer('alice'), {
    ownerUserId: 'alice',
    follow: 'all',
  });
  expect(groupIds(result)).toEqual([
    'follow',
    'wait',
    'doing',
    'backlog',
    'done',
  ]);
  expect(titles(result, 'wait').sort()).toEqual(['Accept me', 'Answer me']);
  const accept = result.groups[1]!.data.find(
    (item) => item.issue.title === 'Accept me',
  )!;
  expect(accept.waits).toEqual(['accept']);
  expect(result.waiting).toBe(2);
  // Bob does not own them: in review is waiting for someone else.
  const bob = await service().read(h.viewer('bob'), {});
  expect(titles(bob, 'review')).toEqual(['Accept me']);
  expect(titles(bob, 'blocked')).toEqual(['Answer me']);
  expect(bob.waiting).toBe(0);
});

it('lists sub-tasks apart only when they wait for the viewer, naming their parent', async () => {
  const parent = await create('Parent', 'in_progress');
  await create('Quiet child', 'in_progress', { parentIssueId: parent.id });
  await create('Asking child', 'blocked', { parentIssueId: parent.id });
  const result = await service().read(h.viewer('alice'), {
    ownerUserId: 'alice',
  });
  expect(titles(result, 'doing')).toEqual(['Parent']);
  const asking = result.groups.find((group) => group.group === 'wait')!
    .data[0]!;
  expect(asking.issue.title).toBe('Asking child');
  expect(asking.parent).toEqual({
    id: parent.id,
    identifier: parent.identifier,
  });
  expect(
    result.groups.find((g) => g.group === 'doing')!.data[0]!.progress,
  ).toEqual({ finished: 0, total: 2 });
});

it('takes the inbox decisions, handoffs and plans as wait reasons', async () => {
  const failed = await create('Run failed', 'in_progress');
  decisions.push({
    issueId: failed.id,
    type: 'run_failed_final',
    waitingForViewer: true,
  });
  const result = await service().read(h.viewer('alice'), {});
  expect(result.groups.find((g) => g.group === 'wait')!.data[0]!.waits).toEqual(
    ['failed'],
  );
  // The pure evaluator: dependency waits do not ask the owner, and a finished task waits for nobody.
  const viewer: Viewer = h.viewer('alice');
  const blocked = { ...failed, statusKey: 'blocked' };
  expect(
    taskWait(blocked, viewer, { dependencyWait: true, decisions: [] }),
  ).toBeNull();
  expect(
    taskWait({ ...failed, statusKey: 'done' }, viewer, {
      dependencyWait: false,
      decisions: [
        {
          issueId: failed.id,
          type: 'run_failed_final',
          waitingForViewer: true,
        },
      ],
    }),
  ).toBeNull();
  expect(
    taskWait(blocked, viewer, {
      dependencyWait: false,
      decisions: [],
      handoff: {
        issueId: failed.id,
        waiting: true,
        ownerUserId: 'alice',
        previousOwnerUserId: 'bob',
        transferredByUserId: 'bob',
        notificationKey: 'k',
        transferredAt: '2026-01-01T00:00:00.000Z',
        rejectedAt: null,
      },
    })?.reasons,
  ).toEqual(['takeOver', 'answer']);
});

it('keeps the follow group first, in order, beyond the role filter when asked', async () => {
  const mine = await create('Mine', 'in_progress');
  const theirs = await create('Theirs', 'blocked', { owner: 'bob' });
  h.preferences.set(`alice:${FOLLOWING_PREFERENCE}`, [theirs.id, mine.id]);
  const all = await service().read(h.viewer('alice'), {
    ownerUserId: 'alice',
    follow: 'all',
  });
  expect(titles(all, 'follow')).toEqual(['Theirs', 'Mine']);
  expect(groupIds(all)).toEqual(['follow']);
  expect(all.following).toEqual([theirs.id, mine.id]);
  const scoped = await service().read(h.viewer('alice'), {
    ownerUserId: 'alice',
  });
  expect(titles(scoped, 'follow')).toEqual(['Mine']);
  const searched = await service().read(h.viewer('alice'), {
    ownerUserId: 'alice',
    follow: 'all',
    q: 'theirs',
  });
  expect(titles(searched, 'follow')).toEqual(['Theirs']);
});

it('reads table trees with context rows, children pages and a changed generation', async () => {
  const root = await create('Tree root', 'in_progress', { owner: 'bob' });
  const child = await create('My child', 'blocked', {
    parentIssueId: root.id,
  });
  await create('Their child', 'backlog', {
    parentIssueId: root.id,
    owner: 'bob',
  });
  const tasks = service();
  const result = await tasks.read(h.viewer('alice'), {
    mode: 'table',
    ownerUserId: 'alice',
  });
  const wait = result.groups.find((group) => group.group === 'wait')!;
  expect(wait.count).toBe(1);
  expect(wait.data[0]).toMatchObject({
    issue: { id: root.id },
    context: true,
    hasChildren: true,
    expand: [root.id],
  });
  const children = await tasks.children(h.viewer('alice'), {
    ownerUserId: 'alice',
    parentId: root.id,
    generation: result.generation,
  });
  expect(
    children.data.map((item) => [item.issue.title, item.context]).sort(),
  ).toEqual([
    ['My child', false],
    ['Their child', true],
  ]);
  await h.projects.issues.update(h.viewer('alice'), child.id, {
    revision: child.revision,
    statusKey: 'in_progress',
  });
  await expect(
    tasks.children(h.viewer('alice'), {
      ownerUserId: 'alice',
      parentId: root.id,
      generation: result.generation,
    }),
  ).rejects.toBeInstanceOf(TaskGroupsChangedError);
  const stale = await h.request(
    'GET',
    `/taskGroups/children?ownerUserId=alice&parentId=${root.id}&generation=${encodeURIComponent(result.generation)}`,
    { user: 'alice' },
  );
  expect(stale.status).toBe(409);
  expect(stale.body.error.details?.[0]?.reason ?? stale.body.error.reason).toBe(
    'TASK_GROUPS_CHANGED',
  );
});

it('pages a group and continues it with its generation', async () => {
  for (let n = 0; n < 7; n += 1) await create(`Backlog ${n}`);
  const tasks = service();
  const first = await tasks.read(h.viewer('alice'), { limit: 5 });
  const backlog = first.groups.find((group) => group.group === 'backlog')!;
  expect(backlog).toMatchObject({ count: 7 });
  expect(backlog.data).toHaveLength(5);
  const next = await tasks.read(h.viewer('alice'), {
    limit: 5,
    group: 'backlog',
    cursor: backlog.nextCursor!,
    generation: first.generation,
  });
  const rest = next.groups.find((group) => group.group === 'backlog')!;
  expect(rest.data).toHaveLength(2);
  expect(next.groups.find((group) => group.group === 'follow')!.data).toEqual(
    [],
  );
});

it('never reaches past a parent the viewer cannot see, also for a project-scoped key', async () => {
  const secret = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Secret',
    visibility: 'members',
  });
  const open = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Open',
  });
  const parent = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Hidden parent',
    projectId: secret.id,
    start: false,
  });
  const child = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Visible child',
    parentIssueId: parent.id,
    start: false,
  });
  await h.projects.issues.update(h.viewer('alice'), child.id, {
    revision: child.revision,
    projectId: open.id,
  });
  const viewer = { ...h.viewer('bob'), projectIds: [open.id] };
  const result = await service().read(viewer, { mode: 'table' });
  const text = JSON.stringify(result);
  expect(text).toContain('Visible child');
  expect(text).not.toContain(parent.id);
  expect(text).not.toContain('Hidden parent');
  const keyed = await h.request('GET', '/taskGroups?mode=split', {
    user: 'bob',
    headers: {
      'x-test-key-scope': JSON.stringify({
        'projects.issues': { level: 'read' },
        'projects.projects': { level: 'read', objects: [open.id] },
      }),
    },
  });
  expect(keyed.status).toBe(200);
  expect(JSON.stringify(keyed.body)).not.toContain(parent.id);
});

it('counts owned or executed tasks once for My tasks', async () => {
  await create('Owned review', 'in_review');
  await create('Owned work', 'in_progress');
  await create('Executed', 'in_progress', {
    owner: 'bob',
    executorId: 'alice',
  });
  await create('Closed', 'done');
  const summary = await service().summary(h.viewer('alice'));
  expect(summary.mine).toEqual({ open: 3, waiting: 1 });
  expect(summary.waiting).toBe(1);
  const routed = await h.request('GET', '/taskGroups/summary', {
    user: 'alice',
  });
  expect(routed.status).toBe(200);
  expect(routed.body.data.mine.open).toBe(3);
});

it('merges ownership and human execution with scoped filters, follows and waits', async () => {
  const own = await create('Union owned', 'in_review');
  const both = await create('Union both', 'in_progress', {
    executorId: 'alice',
  });
  const executed = await create('Union executed', 'in_progress', {
    owner: 'bob',
    executorId: 'alice',
  });
  const outside = await create('Union outside', 'blocked', { owner: 'bob' });
  const followed = await create('Union followed', 'in_progress', {
    owner: 'bob',
  });
  h.preferences.set(`alice:${FOLLOWING_PREFERENCE}`, [followed.id]);
  for (const mode of ['split', 'table'] as const) {
    const result = await service().read(h.viewer('alice'), {
      involvesUserId: 'alice',
      follow: 'all',
      mode,
      q: 'Union',
    });
    const ids = result.groups.flatMap((group) =>
      group.data.map((row) => row.issue.id),
    );
    expect(new Set(ids)).toEqual(
      new Set([own.id, both.id, executed.id, followed.id]),
    );
    expect(ids.length).toBe(4);
    expect(ids).not.toContain(outside.id);
    expect(result.waiting).toBe(1);
    expect(titles(result, 'follow')).toEqual(['Union followed']);
  }
  const narrowed = await service().read(h.viewer('alice'), {
    involvesUserId: 'alice',
    q: 'executed',
  });
  expect(
    narrowed.groups.flatMap((group) => group.data.map((row) => row.issue.id)),
  ).toEqual([executed.id]);
  expect((await service().summary(h.viewer('alice'))).mine).toEqual({
    open: 3,
    waiting: 1,
  });
  const routed = await h.request(
    'GET',
    '/taskGroups?involvesUserId=alice&follow=all',
    { user: 'alice' },
  );
  expect(routed.status).toBe(200);
  expect(JSON.stringify(routed.body)).toContain(executed.id);
  expect(JSON.stringify(routed.body)).not.toContain(outside.id);
});

it('keeps executed sub-tasks in the merged split list even when their parent is also mine', async () => {
  const parent = await create('My parent', 'in_progress');
  const child = await create('I execute the child', 'in_progress', {
    parentIssueId: parent.id,
    owner: 'bob',
    executorId: 'alice',
  });
  const result = await service().read(h.viewer('alice'), {
    involvesUserId: 'alice',
  });
  const ids = result.groups.flatMap((group) =>
    group.data.map((row) => row.issue.id),
  );
  expect(new Set(ids)).toEqual(new Set([parent.id, child.id]));
});

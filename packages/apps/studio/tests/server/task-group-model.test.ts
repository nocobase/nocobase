// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  createTaskGroupModel,
  TaskGroupsChangedError,
  type GroupIssue,
  type TaskGroupModelInput,
  type TaskWait,
} from '../../server/issues/task-group-model.js';

const NOW = Date.parse('2026-10-14T12:00:00.000Z');
const hoursAgo = (hours: number) =>
  new Date(NOW - hours * 3_600_000).toISOString();

let counter = 0;
function issue(
  id: string,
  statusKey: string,
  extra: Partial<GroupIssue> = {},
): GroupIssue {
  counter += 1;
  return {
    id,
    parentIssueId: null,
    number: counter,
    statusKey,
    priority: 'medium',
    createdAt: hoursAgo(100),
    updatedAt: hoursAgo(counter),
    revision: 1,
    ...extra,
  };
}

function model(
  issues: readonly GroupIssue[],
  options: Partial<TaskGroupModelInput> = {},
) {
  return createTaskGroupModel({
    issues,
    matchingIds: new Set(issues.map((item) => item.id)),
    waits: new Map(),
    followIds: [],
    mode: 'split',
    queryIdentity: 'viewer',
    now: NOW,
    ...options,
  });
}

const ids = (
  m: ReturnType<typeof model>,
  group: Parameters<ReturnType<typeof model>['group']>[0],
) => m.group(group).data.map((node) => node.id);

const wait = (reasons: TaskWait['reasons'], since: string): TaskWait => ({
  reasons,
  since,
});

describe('the split view', () => {
  it('groups by follow, waiting and status in a fixed order, leaving empty status groups out', () => {
    const m = model(
      [
        issue('a', 'in_progress'),
        issue('b', 'in_review'),
        issue('c', 'blocked'),
        issue('d', 'backlog'),
        issue('e', 'in_progress'),
      ],
      {
        followIds: ['e'],
        waits: new Map([['b', wait(['accept'], hoursAgo(5))]]),
      },
    );
    expect(m.groups).toEqual([
      { group: 'follow', count: 1 },
      { group: 'wait', count: 1 },
      { group: 'doing', count: 1 },
      { group: 'blocked', count: 1 },
      { group: 'backlog', count: 1 },
    ]);
    expect(ids(m, 'follow')).toEqual(['e']);
    // A followed task is listed in the follow group only.
    expect(ids(m, 'doing')).toEqual(['a']);
    expect(m.group('wait').data[0]).toMatchObject({
      waits: ['accept'],
      waitingSince: hoursAgo(5),
    });
  });

  it('lists the follow group in the viewer order, and leaves it out when empty', () => {
    const m = model([issue('a', 'backlog'), issue('b', 'backlog')], {
      followIds: ['b', 'a', 'gone'],
    });
    expect(m.groups[0]).toEqual({ group: 'follow', count: 2 });
    expect(ids(m, 'follow')).toEqual(['b', 'a']);
    expect(model([issue('x', 'backlog')]).groups[0]).toEqual({
      group: 'backlog',
      count: 1,
    });
  });

  it('lists the longest waiting first and the other groups by latest update', () => {
    const m = model(
      [
        issue('new', 'in_review'),
        issue('old', 'blocked'),
        issue('fresh', 'in_progress', { updatedAt: hoursAgo(0) }),
        issue('stale', 'in_progress', { updatedAt: hoursAgo(50) }),
      ],
      {
        waits: new Map([
          ['new', wait(['accept'], hoursAgo(1))],
          ['old', wait(['answer'], hoursAgo(30))],
        ]),
      },
    );
    expect(ids(m, 'wait')).toEqual(['old', 'new']);
    expect(ids(m, 'doing')).toEqual(['fresh', 'stale']);
  });

  it('lists done for the last seven days only and never cancelled, unless the status filter names them', () => {
    const issues = [
      issue('recent', 'done', { updatedAt: hoursAgo(24) }),
      issue('old', 'done', { updatedAt: hoursAgo(24 * 8) }),
      issue('dropped', 'cancelled'),
    ];
    const m = model(issues);
    expect(m.groups.map((group) => group.group)).toEqual(['done']);
    expect(ids(m, 'done')).toEqual(['recent']);
    expect(ids(model(issues, { statusFilter: 'done' }), 'done')).toEqual([
      'recent',
      'old',
    ]);
    expect(
      ids(model(issues, { statusFilter: 'cancelled' }), 'cancelled'),
    ).toEqual(['dropped']);
  });

  it('lists top-level tasks, sub-tasks waiting for the viewer and those whose parent is outside the scope', () => {
    const issues = [
      issue('parent', 'in_progress'),
      issue('child', 'in_progress', { parentIssueId: 'parent' }),
      issue('asks', 'blocked', { parentIssueId: 'parent' }),
      issue('other', 'backlog'),
      issue('orphan', 'backlog', { parentIssueId: 'other' }),
    ];
    const m = model(issues, {
      matchingIds: new Set(['parent', 'child', 'asks', 'orphan']),
      waits: new Map([['asks', wait(['answer'], hoursAgo(2))]]),
    });
    expect(ids(m, 'doing')).toEqual(['parent']);
    expect(ids(m, 'wait')).toEqual(['asks']);
    expect(ids(m, 'backlog')).toEqual(['orphan']);
    expect(m.group('wait').data[0]!.parentId).toBe('parent');
    // "I execute" lists every task of the viewer, sub-tasks included.
    expect(
      ids(
        model(issues, {
          matchingIds: new Set(['parent', 'child']),
          flat: true,
        }),
        'doing',
      ).sort(),
    ).toEqual(['child', 'parent']);
  });

  it('counts the wait group and the followed tasks waiting for the viewer', () => {
    const m = model(
      [issue('a', 'in_review'), issue('b', 'blocked'), issue('c', 'backlog')],
      {
        followIds: ['b'],
        waits: new Map([
          ['a', wait(['accept'], hoursAgo(1))],
          ['b', wait(['answer'], hoursAgo(1))],
        ]),
      },
    );
    expect(m.waiting).toBe(2);
    expect(m.groups.find((group) => group.group === 'wait')!.count).toBe(1);
  });

  it('reports sub-task progress over readable direct children, cancelled counting as finished', () => {
    const m = model([
      issue('p', 'in_progress'),
      issue('c1', 'done', { parentIssueId: 'p' }),
      issue('c2', 'cancelled', { parentIssueId: 'p' }),
      issue('c3', 'in_progress', { parentIssueId: 'p' }),
    ]);
    expect(m.group('doing').data[0]!.progress).toEqual({
      finished: 2,
      total: 3,
    });
  });
});

describe('the table', () => {
  const tree = () => [
    issue('root', 'in_progress'),
    issue('mid', 'in_progress', { parentIssueId: 'root' }),
    issue('leaf', 'blocked', { parentIssueId: 'mid' }),
    issue('sibling', 'backlog', { parentIssueId: 'root' }),
    issue('alone', 'backlog'),
  ];

  it('puts a whole tree in the wait group, counting its waiting tasks, and expands down to them', () => {
    const m = model(tree(), {
      mode: 'table',
      waits: new Map([['leaf', wait(['answer'], hoursAgo(3))]]),
    });
    expect(m.groups).toEqual([
      { group: 'wait', count: 1 },
      { group: 'backlog', count: 1 },
    ]);
    const root = m.group('wait').data[0]!;
    expect(root.id).toBe('root');
    expect([...root.expand].sort()).toEqual(['mid', 'root']);
  });

  it('groups a tree by its root status, counting the tasks in scope and not the context', () => {
    const m = model(tree(), {
      mode: 'table',
      matchingIds: new Set(['leaf', 'sibling']),
    });
    // The root is outside the scope: the tree goes by its first task in scope.
    expect(m.groups.map((group) => group.group)).toEqual(['blocked']);
    expect(m.groups[0]!.count).toBe(2);
    const root = m.group('blocked').data[0]!;
    expect(root).toMatchObject({ id: 'root', context: true });
    const children = m.children('root').data;
    expect(children.map((child) => [child.id, child.context])).toEqual([
      ['mid', true],
      ['sibling', false],
    ]);
    expect(m.children('mid').data.map((child) => child.id)).toEqual(['leaf']);
  });

  it('expands only trees in the result, and a followed task beyond them', () => {
    const issues = tree();
    const m = model(issues, {
      mode: 'table',
      matchingIds: new Set(['alone']),
      followIds: ['mid'],
    });
    expect(m.children('root').data).toEqual([]);
    expect(m.children('mid').data.map((child) => child.id)).toEqual(['leaf']);
  });

  it('lists a tree whose root is followed in the follow group only', () => {
    const m = model(tree(), { mode: 'table', followIds: ['root'] });
    expect(ids(m, 'follow')).toEqual(['root']);
    expect(m.groups.map((group) => group.group)).toEqual(['follow', 'backlog']);
  });
});

describe('continuations', () => {
  it('pages a group and refuses a cursor from another generation or group', () => {
    const issues = Array.from({ length: 7 }, (_, n) =>
      issue(`t${n}`, 'backlog'),
    );
    const m = model(issues);
    const first = m.group('backlog', 5);
    expect(first.data).toHaveLength(5);
    const second = m.group('backlog', 5, first.nextCursor!);
    expect(second.data).toHaveLength(2);
    expect(second.nextCursor).toBeNull();
    expect(() => m.group('doing', 5, first.nextCursor!)).toThrow(
      TaskGroupsChangedError,
    );
    const changed = model(
      issues.map((item, n) => (n === 0 ? { ...item, revision: 2 } : item)),
    );
    expect(changed.generation).not.toBe(m.generation);
    expect(() => changed.group('backlog', 5, first.nextCursor!)).toThrow(
      TaskGroupsChangedError,
    );
    expect(() => m.group('backlog', 5, 'garbage')).toThrow(
      TaskGroupsChangedError,
    );
  });

  it('refuses duplicate ids and parent cycles', () => {
    expect(() => model([issue('a', 'backlog'), issue('a', 'backlog')])).toThrow(
      /duplicate/u,
    );
    expect(() =>
      model([
        issue('a', 'backlog', { parentIssueId: 'b' }),
        issue('b', 'backlog', { parentIssueId: 'a' }),
      ]),
    ).toThrow(/cycle/u);
  });
});

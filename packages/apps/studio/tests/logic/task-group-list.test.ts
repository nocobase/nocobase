// @vitest-environment node
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { describe, expect, it } from 'vitest';

import { statusShape } from '../../client/components/status-shapes.js';
import {
  findItem,
  keepPlacement,
  nextWaiting,
  placementOf,
  visibleOrder,
  type ListGroup,
} from '../../client/issues/groups/model.js';
import { clampWidth, LIST_WIDTH } from '../../client/issues/groups/prefs.js';
import type {
  TaskGroupId,
  TaskGroupItem,
  WaitReason,
} from '../../shared/task-groups.js';

function item(id: string, waits: readonly WaitReason[] = []): TaskGroupItem {
  return {
    issue: { id, identifier: `PM-${id}` } as IssueListItem,
    parent: null,
    waits,
    waitingSince: null,
    followed: false,
    unread: 0,
    progress: { finished: 0, total: 0 },
    hasChildren: false,
    context: false,
    expand: [],
  };
}

function group(id: TaskGroupId, items: readonly TaskGroupItem[]): ListGroup {
  return { group: id, count: items.length, items, nextCursor: null };
}

describe('the split list', () => {
  const groups = [
    group('follow', [item('1')]),
    group('wait', [item('2', ['accept']), item('3', ['answer'])]),
    group('doing', [item('4'), item('5')]),
    group('done', [item('6')]),
  ];

  it('steps through the visible groups only, each task once', () => {
    const folded = (g: TaskGroupId) => g === 'done';
    expect(visibleOrder(groups, folded)).toEqual(['1', '2', '3', '4', '5']);
    const twice = [...groups, group('backlog', [item('4')])];
    expect(visibleOrder(twice, () => false)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
  });

  it('finds a task by id or key', () => {
    expect(findItem(groups, 'PM-4')?.issue.id).toBe('4');
    expect(findItem(groups, '5')?.issue.id).toBe('5');
    expect(findItem(groups, 'missing')).toBeNull();
    expect(findItem(groups, null)).toBeNull();
  });

  it('keeps a task just handled where it was until the person moves on', () => {
    const sticky = placementOf(groups, '2')!;
    expect(sticky).toEqual({
      id: '2',
      group: 'wait',
      index: 0,
      followed: false,
    });
    // Accepted: the next read lists it as done.
    const after = [
      group('follow', [item('1')]),
      group('wait', [item('3', ['answer'])]),
      group('doing', [item('4'), item('5')]),
      group('done', [item('2'), item('6')]),
    ];
    const shown = keepPlacement(after, sticky);
    expect(
      shown.find((g) => g.group === 'wait')!.items.map((i) => i.issue.id),
    ).toEqual(['2', '3']);
    expect(
      shown.find((g) => g.group === 'done')!.items.map((i) => i.issue.id),
    ).toEqual(['6']);
    expect(keepPlacement(after, null)).toEqual(after);
  });

  it('keeps the selected followed task at its index when an update reorders the group', () => {
    const before = [group('follow', [item('1'), item('2'), item('3')])];
    const sticky = placementOf(before, '2')!;
    const after = [group('follow', [item('2'), item('1'), item('3')])];
    expect(
      keepPlacement(after, sticky)[0]!.items.map((row) => row.issue.id),
    ).toEqual(['1', '2', '3']);
  });

  it('moves a task into or out of the follow group at once', () => {
    const sticky = placementOf(groups, '2')!;
    const followed = [
      group('follow', [
        item('1'),
        { ...item('2', ['accept']), followed: true },
      ]),
      group('wait', [item('3', ['answer'])]),
    ];
    expect(keepPlacement(followed, sticky)).toEqual(followed);
  });

  it('keeps a followed task in its old group when status changes do not change following', () => {
    const before = [group('follow', [{ ...item('2'), followed: true }])];
    const sticky = placementOf(before, '2')!;
    const after = [
      group('follow', []),
      group('done', [{ ...item('2'), followed: true }]),
    ];
    expect(
      keepPlacement(after, sticky)
        .find((row) => row.group === 'follow')!
        .items.map((row) => row.issue.id),
    ).toEqual(['2']);
    expect(keepPlacement(after, null)).toEqual(after);
  });

  it('brings back the group a handled task was the last of', () => {
    const sticky = placementOf([group('wait', [item('2', ['accept'])])], '2')!;
    const after = [group('follow', []), group('done', [item('2')])];
    expect(keepPlacement(after, sticky).map((g) => g.group)).toEqual([
      'follow',
      'wait',
      'done',
    ]);
  });

  it('offers the next task waiting after the current one, wrapping around', () => {
    expect(nextWaiting(groups, '2')?.issue.id).toBe('3');
    expect(nextWaiting(groups, '3')?.issue.id).toBe('2');
    expect(nextWaiting(groups, null)?.issue.id).toBe('2');
    expect(nextWaiting([group('doing', [item('4')])], '4')).toBeNull();
  });
});

describe('status shapes and preferences', () => {
  it('gives each fixed status its own shape', () => {
    expect(
      [
        'backlog',
        'in_progress',
        'blocked',
        'in_review',
        'done',
        'cancelled',
      ].map(statusShape),
    ).toEqual(['backlog', 'started', 'blocked', 'review', 'done', 'closed']);
    expect(statusShape('unknown')).toBe('backlog');
  });

  it('keeps the list width between its bounds', () => {
    expect(clampWidth(100)).toBe(LIST_WIDTH.min);
    expect(clampWidth(9999)).toBe(LIST_WIDTH.max);
    expect(clampWidth(400.4)).toBe(400);
  });
});

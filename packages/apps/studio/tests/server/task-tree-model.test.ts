// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  createTaskTreeModel,
  TreeCursorError,
  type TreeAttention,
  type TreeIssue,
  type TreeModelInput,
} from '../../server/issues/tree-model.js';

function issue(
  id: string,
  parentIssueId: string | null = null,
  extra: Partial<TreeIssue> = {},
): TreeIssue {
  return {
    id,
    parentIssueId,
    number: Number(id),
    priority: 'none',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    revision: 1,
    ...extra,
  };
}

function input(
  issues: readonly TreeIssue[],
  extra: Partial<TreeModelInput> = {},
): TreeModelInput {
  return {
    issues,
    matchingIds: new Set(issues.map((row) => row.id)),
    attention: new Map(),
    finishedIds: new Set(),
    queryIdentity: 'viewer:1;scope:all',
    ...extra,
  };
}

const inputReason: TreeAttention = { group: 'input', waitingForViewer: false };
const reviewReason: TreeAttention = { group: 'review', waitingForViewer: true };

describe('complete-scope task tree aggregation', () => {
  it('prioritizes one tree once across multiple actionable descendants without mutating records', () => {
    const rows = [
      issue('1'),
      issue('2', '1'),
      issue('3', '2'),
      issue('4', '1'),
      issue('5'),
    ];
    const before = structuredClone(rows);
    const model = createTaskTreeModel(
      input(rows, {
        attention: new Map([
          ['2', reviewReason],
          ['3', inputReason],
          ['4', inputReason],
        ]),
      }),
    );
    expect(model.groups.map((group) => group.group)).toEqual([
      'input',
      'review',
      'decision',
      'routine',
    ]);
    expect(model.groups[0].totals).toEqual({
      tasks: 4,
      trees: 1,
      needsHumanAction: 3,
      waitingForViewer: 1,
    });
    expect(model.roots('input').data[0]).toMatchObject({
      id: '1',
      attentionTaskId: '3',
    });
    expect(model.roots('review').data).toEqual([]);
    expect(model.roots('routine').data.map((row) => row.id)).toEqual(['5']);
    expect(
      model
        .children('1')
        .data.map((row) => row.id)
        .sort(),
    ).toEqual(['2', '4']);
    expect(model.children('2').data[0]).toMatchObject({ id: '3', rootId: '1' });
    expect(rows).toEqual(before);
  });

  it('uses matching descendants for grouping and labels readable ancestors and siblings as context', () => {
    const model = createTaskTreeModel(
      input([issue('1'), issue('2', '1'), issue('3', '1'), issue('4')], {
        matchingIds: new Set(['2']),
        attention: new Map([
          ['2', reviewReason],
          ['1', inputReason],
          ['3', inputReason],
        ]),
      }),
    );
    expect(model.roots('review').data[0]).toMatchObject({
      id: '1',
      matchesFilter: false,
      attentionTaskId: '2',
    });
    expect(model.groups[1].totals).toEqual({
      tasks: 1,
      trees: 1,
      needsHumanAction: 1,
      waitingForViewer: 1,
    });
    expect(model.children('1').data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '2', matchesFilter: true }),
        expect.objectContaining({ id: '3', matchesFilter: false }),
      ]),
    );
    expect(model.children('4').data).toEqual([]);
    expect(model.roots('input').data).toEqual([]);
  });

  it('stops at every absent ancestor and excludes inaccessible IDs from rows, reasons and totals', () => {
    // The caller's authorized input excludes 2; it must not bridge 3 to readable ancestor 1.
    const model = createTaskTreeModel(
      input([issue('1'), issue('3', '2'), issue('4', '3')], {
        matchingIds: new Set(['3', '4', '2']),
        attention: new Map([
          ['2', inputReason],
          ['4', reviewReason],
        ]),
      }),
    );
    const root = model.roots('review').data[0];
    expect(root).toMatchObject({
      id: '3',
      rootId: '3',
      parentId: null,
      totals: { tasks: 2 },
    });
    expect(model.children('2').data).toEqual([]);
    expect(model.children('1').data).toEqual([]);
    expect(
      model.groups.reduce((total, group) => total + group.totals.tasks, 0),
    ).toBe(2);
  });

  it('computes visible direct-subtask progress independently of filters and child pagination', () => {
    const rows = [
      issue('1'),
      ...Array.from({ length: 125 }, (_, i) => issue(String(i + 2), '1')),
      issue('200', '2'),
    ];
    const model = createTaskTreeModel(
      input(rows, {
        matchingIds: new Set(['1']),
        finishedIds: new Set(['2', '3', '200', 'hidden']),
      }),
    );
    expect(model.roots('routine').data[0].progress).toEqual({
      total: 125,
      finished: 2,
    });
    expect(model.children('1').data).toHaveLength(50);
    expect(model.children('2').data[0]).toMatchObject({
      id: '200',
      matchesFilter: false,
    });
    expect(model.groups[3].totals.tasks).toBe(1);
  });

  it('counts and orders more than 50 roots and 200 attention-bearing tasks before pagination', () => {
    const rows = Array.from({ length: 260 }, (_, i) => issue(String(i + 1)));
    const attention = new Map(rows.map((row) => [row.id, reviewReason]));
    const model = createTaskTreeModel(
      input(rows, { attention, sort: 'number', direction: 'asc' }),
    );
    expect(model.groups[1].totals).toEqual({
      tasks: 260,
      trees: 260,
      needsHumanAction: 260,
      waitingForViewer: 260,
    });
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const page = model.roots('review', 50, cursor);
      ids.push(...page.data.map((row) => row.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    expect(ids).toEqual(rows.map((row) => row.id));
    expect(new Set(ids).size).toBe(260);
  });

  it('paginates direct children separately without repeating actionable rows', () => {
    const rows = [
      issue('1'),
      ...Array.from({ length: 123 }, (_, i) => issue(String(i + 2), '1')),
    ];
    const model = createTaskTreeModel(
      input(rows, {
        attention: new Map([['124', inputReason]]),
        sort: 'number',
        direction: 'asc',
      }),
    );
    expect(model.roots('input').data[0]).toMatchObject({
      attentionTaskId: '124',
      totals: { tasks: 124 },
    });
    const a = model.children('1');
    const b = model.children('1', 50, a.nextCursor!);
    const c = model.children('1', 50, b.nextCursor!);
    expect([...a.data, ...b.data, ...c.data].map((row) => row.id)).toEqual(
      rows.slice(1).map((row) => row.id),
    );
    expect(c.nextCursor).toBeNull();
  });

  it.each(['updated', 'created', 'number'] as const)(
    'applies %s sort to both roots and siblings',
    (sort) => {
      const rows = [
        issue('1'),
        issue('2', null, {
          number: 20,
          createdAt: '2026-10-02T00:00:00Z',
          updatedAt: '2026-10-02T00:00:00Z',
        }),
        issue('3', '1'),
        issue('4', '1', {
          number: 40,
          createdAt: '2026-10-02T00:00:00Z',
          updatedAt: '2026-10-02T00:00:00Z',
        }),
      ];
      for (const direction of ['asc', 'desc'] as const) {
        const model = createTaskTreeModel(input(rows, { sort, direction }));
        expect(model.roots('routine').data.map((row) => row.id)).toEqual(
          direction === 'asc' ? ['1', '2'] : ['2', '1'],
        );
        expect(model.children('1').data.map((row) => row.id)).toEqual(
          direction === 'asc' ? ['3', '4'] : ['4', '3'],
        );
      }
    },
  );

  it('preserves the Projects descending-priority convention and uses IDs for ties', () => {
    const rows = [
      issue('1', null, { priority: 'urgent' }),
      issue('2', null, { priority: 'low' }),
      issue('3', null, { priority: 'urgent' }),
    ];
    expect(
      createTaskTreeModel(input(rows, { sort: 'priority' }))
        .roots('routine')
        .data.map((row) => row.id),
    ).toEqual(['1', '3', '2']);
    expect(
      createTaskTreeModel(input(rows, { sort: 'priority', direction: 'asc' }))
        .roots('routine')
        .data.map((row) => row.id),
    ).toEqual(['2', '3', '1']);
  });

  it('invalidates continuation on live regrouping, query, visibility, membership, progress or revision changes', () => {
    const rows = [issue('1'), issue('2'), issue('3', '1')];
    const original = input(rows);
    const model = createTaskTreeModel(original);
    const cursor = model.roots('routine', 1).nextCursor!;
    const changes: Partial<TreeModelInput>[] = [
      { attention: new Map([['3', inputReason]]) },
      { queryIdentity: 'viewer:2;scope:mine' },
      { issues: rows.slice(0, 2) },
      { matchingIds: new Set(['1']) },
      { finishedIds: new Set(['3']) },
      { issues: [issue('1', null, { revision: 2 }), ...rows.slice(1)] },
      { direction: 'asc' },
    ];
    for (const change of changes) {
      const changed = createTaskTreeModel({ ...original, ...change });
      expect(() => changed.roots('routine', 1, cursor)).toThrow(
        TreeCursorError,
      );
    }
    expect(
      createTaskTreeModel({ ...original, issues: [...rows].reverse() })
        .generation,
    ).toBe(model.generation);
    expect(
      createTaskTreeModel({
        ...original,
        attention: new Map([['3', inputReason]]),
      }).roots('input').data[0].id,
    ).toBe('1');
  });

  it('rejects malformed cursors and cursors from a different group or parent', () => {
    const model = createTaskTreeModel(
      input([
        issue('1'),
        issue('2'),
        issue('3', '1'),
        issue('4', '1'),
        issue('5', '2'),
        issue('6', '2'),
      ]),
    );
    const rootCursor = model.roots('routine', 1).nextCursor!;
    const childCursor = model.children('1', 1).nextCursor!;
    expect(() => model.roots('input', 1, rootCursor)).toThrow(TreeCursorError);
    expect(() => model.children('2', 1, childCursor)).toThrow(TreeCursorError);
    expect(() => model.roots('routine', 1, 'broken')).toThrow(TreeCursorError);
    expect(() => model.roots('routine', 0)).toThrow();
  });

  it('handles empty results honestly', () => {
    const model = createTaskTreeModel(
      input([issue('1')], { matchingIds: new Set() }),
    );
    expect(
      model.groups.every((group) =>
        Object.values(group.totals).every((value) => value === 0),
      ),
    ).toBe(true);
    expect(model.roots('routine').data).toEqual([]);
    expect(model.children('1').data).toEqual([]);
  });

  it('handles deep hierarchies without recursive stack overflow and rejects invalid cycles', () => {
    const rows = Array.from({ length: 12000 }, (_, i) =>
      issue(String(i + 1), i === 11999 ? null : String(i + 2)),
    );
    const model = createTaskTreeModel(
      input(rows, {
        matchingIds: new Set(['1']),
        attention: new Map([['1', inputReason]]),
      }),
    );
    expect(model.roots('input').data[0]).toMatchObject({
      id: '12000',
      attentionTaskId: '1',
      totals: { tasks: 1 },
    });
    expect(() =>
      createTaskTreeModel(input([issue('1', '2'), issue('2', '1')])),
    ).toThrow('parent cycle');
    expect(() => createTaskTreeModel(input([issue('1'), issue('1')]))).toThrow(
      'duplicate IDs',
    );
  });
});

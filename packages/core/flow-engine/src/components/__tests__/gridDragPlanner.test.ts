/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  GridLayoutData,
  LayoutSlot,
  simulateLayoutForSlot,
  getSlotKey,
  resolveDropIntent,
  Point,
  buildLayoutSnapshot,
  normalizeGridLayout,
  projectLayoutToLegacyRows,
  replaceUidInGridLayout,
} from '../dnd/gridDragPlanner';

const rect = { top: 0, left: 0, width: 100, height: 100 };

const createLayout = (
  rows: Record<string, string[][]>,
  sizes: Record<string, number[]>,
  rowOrder?: string[],
): GridLayoutData => ({
  rows,
  sizes,
  rowOrder,
});

const createDomRect = ({ top, left, width, height }: { top: number; left: number; width: number; height: number }) => {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
};

const mockRect = (
  element: Element,
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  },
) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => createDomRect(rect),
  });
};

describe('buildLayoutSnapshot', () => {
  it('should ignore nested grid columns/items even when rowId is duplicated', () => {
    const container = document.createElement('div');
    const row = document.createElement('div');
    row.setAttribute('data-grid-row-id', 'row-1');
    container.appendChild(row);

    const column = document.createElement('div');
    column.setAttribute('data-grid-column-row-id', 'row-1');
    column.setAttribute('data-grid-column-index', '0');
    row.appendChild(column);

    const item = document.createElement('div');
    item.setAttribute('data-grid-item-row-id', 'row-1');
    item.setAttribute('data-grid-column-index', '0');
    item.setAttribute('data-grid-item-index', '0');
    column.appendChild(item);

    // 在外层 item 内构建一个嵌套 grid，并复用相同 rowId/columnIndex
    const nestedRow = document.createElement('div');
    nestedRow.setAttribute('data-grid-row-id', 'row-1');
    item.appendChild(nestedRow);

    const nestedColumn = document.createElement('div');
    nestedColumn.setAttribute('data-grid-column-row-id', 'row-1');
    nestedColumn.setAttribute('data-grid-column-index', '0');
    nestedRow.appendChild(nestedColumn);

    const nestedItem = document.createElement('div');
    nestedItem.setAttribute('data-grid-item-row-id', 'row-1');
    nestedItem.setAttribute('data-grid-column-index', '0');
    nestedItem.setAttribute('data-grid-item-index', '0');
    nestedColumn.appendChild(nestedItem);

    mockRect(container, { top: 0, left: 0, width: 600, height: 600 });
    mockRect(row, { top: 10, left: 10, width: 320, height: 120 });
    mockRect(column, { top: 10, left: 10, width: 320, height: 120 });
    mockRect(item, { top: 20, left: 20, width: 300, height: 80 });

    // 嵌套 grid 给一个明显偏离的位置，用于判断是否被错误命中
    mockRect(nestedRow, { top: 360, left: 360, width: 200, height: 120 });
    mockRect(nestedColumn, { top: 360, left: 360, width: 200, height: 120 });
    mockRect(nestedItem, { top: 370, left: 370, width: 180, height: 90 });

    const snapshot = buildLayoutSnapshot({ container });
    const columnEdgeSlots = snapshot.slots.filter((slot) => slot.type === 'column-edge');
    const columnSlots = snapshot.slots.filter((slot) => slot.type === 'column');
    const itemEdgeSlots = snapshot.slots.filter((slot) => slot.type === 'item-edge');

    // 外层单行单列单项应只有 8 个 slot：上/下 row-gap + 左/右 column-edge + before/after column + 左/右 item-edge
    expect(snapshot.slots).toHaveLength(8);
    expect(columnEdgeSlots).toHaveLength(2);
    expect(columnSlots).toHaveLength(2);
    expect(itemEdgeSlots).toHaveLength(2);

    // 不应混入嵌套 grid（其 top >= 360）
    expect(snapshot.slots.every((slot) => slot.rect.top < 300)).toBe(true);
  });

  it('does not create an empty-column slot for a cell that contains nested rows', () => {
    const container = document.createElement('div');
    container.setAttribute('data-grid-root', '');
    const row = document.createElement('div');
    row.setAttribute('data-grid-row-id', 'outer');
    row.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'outer' }]));
    container.appendChild(row);

    const leftColumn = document.createElement('div');
    leftColumn.setAttribute('data-grid-column-row-id', 'outer');
    leftColumn.setAttribute('data-grid-column-index', '0');
    leftColumn.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'outer', cellId: 'outer-left' }]));
    row.appendChild(leftColumn);

    const leftItem = document.createElement('div');
    leftItem.setAttribute('data-grid-item-row-id', 'outer');
    leftItem.setAttribute('data-grid-column-index', '0');
    leftItem.setAttribute('data-grid-item-index', '0');
    leftItem.setAttribute('data-grid-item-uid', 'left');
    leftColumn.appendChild(leftItem);

    const rightColumn = document.createElement('div');
    rightColumn.setAttribute('data-grid-column-row-id', 'outer');
    rightColumn.setAttribute('data-grid-column-index', '1');
    rightColumn.setAttribute('data-grid-path', JSON.stringify([{ rowId: 'outer', cellId: 'outer-right' }]));
    row.appendChild(rightColumn);

    const nestedRow = document.createElement('div');
    nestedRow.setAttribute('data-grid-row-id', 'nested');
    nestedRow.setAttribute(
      'data-grid-path',
      JSON.stringify([{ rowId: 'outer', cellId: 'outer-right' }, { rowId: 'nested' }]),
    );
    rightColumn.appendChild(nestedRow);

    const nestedColumn = document.createElement('div');
    nestedColumn.setAttribute('data-grid-column-row-id', 'nested');
    nestedColumn.setAttribute('data-grid-column-index', '0');
    nestedColumn.setAttribute(
      'data-grid-path',
      JSON.stringify([
        { rowId: 'outer', cellId: 'outer-right' },
        { rowId: 'nested', cellId: 'nested-cell' },
      ]),
    );
    nestedRow.appendChild(nestedColumn);

    const nestedItem = document.createElement('div');
    nestedItem.setAttribute('data-grid-item-row-id', 'nested');
    nestedItem.setAttribute('data-grid-column-index', '0');
    nestedItem.setAttribute('data-grid-item-index', '0');
    nestedItem.setAttribute('data-grid-item-uid', 'nested-item');
    nestedColumn.appendChild(nestedItem);

    mockRect(container, { top: 0, left: 0, width: 1200, height: 500 });
    mockRect(row, { top: 10, left: 10, width: 1180, height: 420 });
    mockRect(leftColumn, { top: 10, left: 10, width: 480, height: 420 });
    mockRect(leftItem, { top: 20, left: 20, width: 460, height: 380 });
    mockRect(rightColumn, { top: 10, left: 500, width: 690, height: 420 });
    mockRect(nestedRow, { top: 20, left: 510, width: 670, height: 120 });
    mockRect(nestedColumn, { top: 20, left: 510, width: 670, height: 120 });
    mockRect(nestedItem, { top: 30, left: 520, width: 650, height: 90 });

    const snapshot = buildLayoutSnapshot({ container });

    expect(
      snapshot.slots.some(
        (slot) =>
          slot.type === 'empty-column' &&
          slot.rowId === 'outer' &&
          slot.columnIndex === 1 &&
          slot.rect.left === 500 &&
          slot.rect.width === 690,
      ),
    ).toBe(false);
    expect(snapshot.slots.some((slot) => slot.type === 'column' && slot.rowId === 'nested')).toBe(true);

    const nestedBelowGap = snapshot.slots.find(
      (slot) => slot.type === 'row-gap' && slot.targetRowId === 'nested' && slot.position === 'below',
    );
    expect(nestedBelowGap?.rect).toEqual({
      top: 140,
      left: 500,
      width: 690,
      height: 48,
    });
  });
});

describe('getSlotKey', () => {
  it('should generate unique key for column slot', () => {
    const slot: LayoutSlot = {
      type: 'column',
      rowId: 'row1',
      columnIndex: 0,
      insertIndex: 1,
      position: 'before',
      rect,
    };

    const key = getSlotKey(slot);
    expect(key).toBe('column:row1:0:1:before');
  });

  it('should generate unique key for column-edge slot', () => {
    const slot: LayoutSlot = {
      type: 'column-edge',
      rowId: 'row1',
      columnIndex: 2,
      direction: 'left',
      rect,
    };

    const key = getSlotKey(slot);
    expect(key).toBe('column-edge:row1:2:left');
  });

  it('should generate unique key for row-gap slot', () => {
    const slot: LayoutSlot = {
      type: 'row-gap',
      targetRowId: 'row2',
      position: 'above',
      rect,
    };

    const key = getSlotKey(slot);
    expect(key).toBe('row-gap:row2:above');
  });

  it('should generate unique key for empty-row slot', () => {
    const slot: LayoutSlot = {
      type: 'empty-row',
      rect,
    };

    const key = getSlotKey(slot);
    expect(key).toBe('empty-row');
  });

  it('should generate unique key for empty-column slot', () => {
    const slot: LayoutSlot = {
      type: 'empty-column',
      rowId: 'row1',
      columnIndex: 0,
      rect,
    };

    const key = getSlotKey(slot);
    expect(key).toBe('empty-column:row1:0');
  });

  it('should generate unique key for item-edge slot', () => {
    const slot: LayoutSlot = {
      type: 'item-edge',
      rowId: 'row1',
      columnIndex: 0,
      itemIndex: 1,
      itemUid: 'block-2',
      direction: 'right',
      rect,
    };

    const key = getSlotKey(slot);
    expect(key).toBe('item-edge:row1:0:block-2:right');
  });
});

describe('GridLayoutV2 helpers', () => {
  it('converts legacy rows to stable v2 layout and legacy projection', () => {
    const layout = normalizeGridLayout({
      rows: {
        rowA: [['a'], ['b', 'c']],
      },
      sizes: {
        rowA: [8, 16],
      },
      rowOrder: ['rowA'],
      itemUids: ['a', 'b', 'c'],
    });

    expect(layout).toMatchObject({
      version: 2,
      rows: [
        {
          id: 'rowA',
          cells: [
            { id: 'rowA:cell:0', items: ['a'] },
            { id: 'rowA:cell:1', items: ['b', 'c'] },
          ],
          sizes: [8, 16],
        },
      ],
    });

    const projected = projectLayoutToLegacyRows(layout);
    expect(projected.rows.rowA).toEqual([['a'], ['b', 'c']]);
    expect(projected.sizes.rowA).toEqual([8, 16]);
  });

  it('deduplicates items, removes invalid uids, appends missing items, and fixes sizes', () => {
    const layout = normalizeGridLayout({
      layout: {
        version: 2,
        rows: [
          {
            id: 'rowA',
            cells: [
              { id: 'cellA', items: ['a', 'b', 'a', 'ghost'] },
              { id: 'cellB', items: ['c'] },
            ],
            sizes: [5],
          },
        ],
      },
      itemUids: ['a', 'b', 'c', 'd'],
      generateId: () => 'row-missing',
    });

    expect(layout.rows[0].cells[0]).toMatchObject({ id: 'cellA', items: ['a', 'b'] });
    expect(layout.rows[0].cells[1]).toMatchObject({ id: 'cellB', items: ['c'] });
    expect(layout.rows[0].sizes).toHaveLength(2);
    expect(layout.rows[0].sizes.reduce((sum, value) => sum + value, 0)).toBe(24);
    expect(layout.rows[1]).toMatchObject({
      id: 'row-missing',
      cells: [{ id: 'row-missing:cell:0', items: ['d'] }],
      sizes: [24],
    });
  });

  it('preserves explicit empty v2 cells while removing invalid-only cells', () => {
    const layout = normalizeGridLayout({
      layout: {
        version: 2,
        rows: [
          {
            id: 'rowA',
            cells: [
              { id: 'empty-cell', items: [] },
              { id: 'invalid-cell', items: ['ghost'] },
              { id: 'valid-cell', items: ['a'] },
            ],
            sizes: [8, 8, 8],
          },
        ],
      },
      itemUids: ['a'],
    });

    expect(layout.rows[0].cells).toEqual([
      { id: 'empty-cell', items: [] },
      { id: 'valid-cell', items: ['a'] },
    ]);
    expect(layout.rows[0].sizes).toEqual([12, 12]);
  });

  it('replaces uid in nested layout', () => {
    const layout = normalizeGridLayout({
      layout: {
        version: 2,
        rows: [
          {
            id: 'rowA',
            cells: [
              {
                id: 'cellA',
                rows: [
                  {
                    id: 'nested',
                    cells: [{ id: 'nested-cell', items: ['old'] }],
                    sizes: [24],
                  },
                ],
              },
            ],
            sizes: [24],
          },
        ],
      },
      itemUids: ['old'],
    });

    const replaced = replaceUidInGridLayout(layout, 'old', 'new');
    expect(projectLayoutToLegacyRows(replaced).rows.rowA).toEqual([['new']]);
  });

  it('projects nested layout without duplicating nested items', () => {
    const layout = normalizeGridLayout({
      layout: {
        version: 2,
        rows: [
          {
            id: 'rowA',
            cells: [
              {
                id: 'cellA',
                rows: [
                  {
                    id: 'nestedA',
                    cells: [{ id: 'nestedA:cell:0', items: ['a'] }],
                    sizes: [24],
                  },
                  {
                    id: 'nestedB',
                    cells: [
                      { id: 'nestedB:cell:0', items: ['two'] },
                      { id: 'nestedB:cell:1', items: ['four'] },
                    ],
                    sizes: [12, 12],
                  },
                  {
                    id: 'nestedC',
                    cells: [{ id: 'nestedC:cell:0', items: ['three'] }],
                    sizes: [24],
                  },
                ],
              },
            ],
            sizes: [24],
          },
        ],
      },
      itemUids: ['a', 'two', 'four', 'three'],
    });

    const projected = projectLayoutToLegacyRows(layout);
    expect(Object.keys(projected.rows)).toEqual(['rowA']);
    expect(projected.rows.rowA).toEqual([['a', 'two', 'four', 'three']]);
  });
});

describe('resolveDropIntent', () => {
  it('should return closest slot when point is outside all slots', () => {
    const slots: LayoutSlot[] = [
      {
        type: 'column',
        rowId: 'row1',
        columnIndex: 0,
        insertIndex: 0,
        position: 'before',
        rect: { top: 100, left: 100, width: 50, height: 50 },
      },
    ];

    const point: Point = { x: 0, y: 0 };
    const result = resolveDropIntent(point, slots);
    // Should return the closest slot, not null
    expect(result).toEqual(slots[0]);
  });

  it('should return the slot that contains the point', () => {
    const targetSlot: LayoutSlot = {
      type: 'column',
      rowId: 'row1',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect: { top: 100, left: 100, width: 50, height: 50 },
    };

    const slots: LayoutSlot[] = [
      {
        type: 'row-gap',
        targetRowId: 'row0',
        position: 'above',
        rect: { top: 50, left: 100, width: 50, height: 20 },
      },
      targetSlot,
      {
        type: 'column-edge',
        rowId: 'row1',
        columnIndex: 1,
        direction: 'right',
        rect: { top: 100, left: 200, width: 20, height: 50 },
      },
    ];

    const point: Point = { x: 125, y: 125 };
    const result = resolveDropIntent(point, slots);
    expect(result).toEqual(targetSlot);
  });

  it('should return highest-priority matching slot when multiple slots contain the point', () => {
    const firstSlot: LayoutSlot = {
      type: 'empty-row',
      rect: { top: 0, left: 0, width: 500, height: 500 },
    };

    const secondSlot: LayoutSlot = {
      type: 'column',
      rowId: 'row1',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect: { top: 100, left: 100, width: 50, height: 30 },
    };

    const slots: LayoutSlot[] = [firstSlot, secondSlot];

    const point: Point = { x: 125, y: 110 };
    const result = resolveDropIntent(point, slots);
    expect(result).toEqual(secondSlot);
  });

  it('should handle empty-column slot correctly', () => {
    const emptyColumnSlot: LayoutSlot = {
      type: 'empty-column',
      rowId: 'row1',
      columnIndex: 0,
      rect: { top: 100, left: 100, width: 100, height: 200 },
    };

    const slots: LayoutSlot[] = [emptyColumnSlot];

    const point: Point = { x: 150, y: 150 };
    const result = resolveDropIntent(point, slots);
    expect(result).toEqual(emptyColumnSlot);
  });

  it('should return null when slots array is empty', () => {
    const slots: LayoutSlot[] = [];
    const point: Point = { x: 100, y: 100 };
    const result = resolveDropIntent(point, slots);
    expect(result).toBeNull();
  });

  it('should find closest slot when point is outside', () => {
    const slot1: LayoutSlot = {
      type: 'column',
      rowId: 'row1',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect: { top: 100, left: 100, width: 50, height: 50 },
    };

    const slot2: LayoutSlot = {
      type: 'column',
      rowId: 'row2',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect: { top: 200, left: 200, width: 50, height: 50 },
    };

    const slots: LayoutSlot[] = [slot1, slot2];

    // Point closer to slot1
    const point: Point = { x: 90, y: 90 };
    const result = resolveDropIntent(point, slots);
    expect(result).toEqual(slot1);
  });
});

describe('simulateLayoutForSlot', () => {
  it('removes source from original position before inserting into column slot', () => {
    const layout = createLayout(
      {
        rowA: [['block-1', 'block-2']],
      },
      {
        rowA: [24],
      },
    );

    const slot: LayoutSlot = {
      type: 'column',
      rowId: 'rowA',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'block-2', layout });

    expect(result.rows.rowA).toEqual([['block-2', 'block-1']]);
    expect(layout.rows.rowA).toEqual([['block-1', 'block-2']]);
  });

  it('inserts new column when dropping on column edge and redistributes sizes', () => {
    const layout = createLayout(
      {
        rowA: [['a'], ['b']],
      },
      {
        rowA: [12, 12],
      },
    );

    const slot: LayoutSlot = {
      type: 'column-edge',
      rowId: 'rowA',
      columnIndex: 0,
      direction: 'left',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'c', layout });

    expect(result.rows.rowA.length).toBe(3);
    expect(result.rows.rowA[0]).toEqual(['c']);
    expect(result.rows.rowA[1]).toEqual(['a']);
    expect(result.rows.rowA[2]).toEqual(['b']);
    expect(result.sizes.rowA.length).toBe(3);
    expect(result.sizes.rowA.reduce((sum, value) => sum + value, 0)).toBe(24);
  });

  it('creates a new row above target row when dropping on row-gap slot', () => {
    const layout = createLayout(
      {
        rowA: [['a']],
        rowB: [['b']],
      },
      {
        rowA: [24],
        rowB: [24],
      },
      ['rowA', 'rowB'],
    );

    const slot: LayoutSlot = {
      type: 'row-gap',
      targetRowId: 'rowB',
      position: 'above',
      rect,
    };

    const result = simulateLayoutForSlot({
      slot,
      sourceUid: 'c',
      layout,
      generateRowId: () => 'row-inserted',
    });

    expect(Object.keys(result.rows)).toEqual(['rowA', 'row-inserted', 'rowB']);
    expect(result.rows['row-inserted']).toEqual([['c']]);
    expect(result.sizes['row-inserted']).toEqual([24]);
  });

  it('creates a new row when dropping into empty container slot', () => {
    const layout = createLayout({}, {});

    const slot: LayoutSlot = {
      type: 'empty-row',
      rect,
    };

    const result = simulateLayoutForSlot({
      slot,
      sourceUid: 'block-x',
      layout,
      generateRowId: () => 'row-new',
    });

    expect(result.rows['row-new']).toEqual([['block-x']]);
    expect(result.sizes['row-new']).toEqual([24]);
  });

  it('removes empty source row when moving item into empty container slot', () => {
    const layout = createLayout(
      {
        rowA: [['block-x']],
      },
      {
        rowA: [24],
      },
    );

    const slot: LayoutSlot = {
      type: 'empty-row',
      rect,
    };

    const result = simulateLayoutForSlot({
      slot,
      sourceUid: 'block-x',
      layout,
      generateRowId: () => 'row-new',
    });

    expect(result.rows['row-new']).toEqual([['block-x']]);
    expect(result.rows.rowA).toBeUndefined();
    expect(result.sizes.rowA).toBeUndefined();
  });

  it('handles column slot with after position', () => {
    const layout = createLayout(
      {
        rowA: [['block-1', 'block-2']],
      },
      {
        rowA: [24],
      },
    );

    const slot: LayoutSlot = {
      type: 'column',
      rowId: 'rowA',
      columnIndex: 0,
      insertIndex: 1,
      position: 'after',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'block-3', layout });

    expect(result.rows.rowA).toEqual([['block-1', 'block-3', 'block-2']]);
  });

  it('handles column-edge slot on the right', () => {
    const layout = createLayout(
      {
        rowA: [['a'], ['b']],
      },
      {
        rowA: [12, 12],
      },
    );

    const slot: LayoutSlot = {
      type: 'column-edge',
      rowId: 'rowA',
      columnIndex: 1,
      direction: 'right',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'c', layout });

    expect(result.rows.rowA.length).toBe(3);
    expect(result.rows.rowA[2]).toEqual(['c']);
  });

  it('preserves remaining cell size ratios after removing a non-last source cell in v2 layout', () => {
    const layout = createLayout(
      {
        rowA: [['a'], ['b'], ['c']],
      },
      {
        rowA: [4, 8, 12],
      },
    );
    layout.layout = normalizeGridLayout({
      rows: layout.rows,
      sizes: layout.sizes,
      rowOrder: ['rowA'],
      itemUids: ['a', 'b', 'c'],
    });

    const slot: LayoutSlot = {
      type: 'column',
      rowId: 'rowA',
      columnIndex: 2,
      insertIndex: 1,
      position: 'after',
      path: [{ rowId: 'rowA', cellId: 'rowA:cell:2' }],
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'a', layout });

    expect(result.layout!.rows[0].cells.map((cell) => cell.items)).toEqual([['b'], ['c', 'a']]);
    expect(result.layout!.rows[0].sizes).toEqual([10, 14]);
  });

  it('splits a stacked cell around item-edge right with stable generated ids', () => {
    const layout = createLayout(
      {
        rowA: [['a', 'two', 'three', 'd']],
      },
      {
        rowA: [24],
      },
    );
    layout.layout = normalizeGridLayout({
      rows: layout.rows,
      sizes: layout.sizes,
      rowOrder: ['rowA'],
      itemUids: ['a', 'two', 'three', 'd', 'four'],
    });

    const slot: LayoutSlot = {
      type: 'item-edge',
      rowId: 'rowA',
      columnIndex: 0,
      itemIndex: 1,
      itemUid: 'two',
      direction: 'right',
      path: [{ rowId: 'rowA', cellId: 'rowA:cell:0' }],
      rect,
    };

    const generatedIds = new Map<string, string>();
    const generateId = (key: string) => `id:${key}`;
    const first = simulateLayoutForSlot({ slot, sourceUid: 'four', layout, generatedIds, generateId });
    const second = simulateLayoutForSlot({ slot, sourceUid: 'four', layout, generatedIds, generateId });

    expect(first.layout).toEqual(second.layout);
    const nestedRows = first.layout!.rows[0].cells[0].rows!;
    expect(nestedRows.map((row) => row.cells.map((cell) => cell.items))).toEqual([
      [['a']],
      [['two'], ['four']],
      [['three']],
      [['d']],
    ]);
    expect(nestedRows[1].sizes).toEqual([12, 12]);
  });

  it('treats dragging an item to its own item-edge as no-op', () => {
    const layout = createLayout(
      {
        rowA: [['two']],
      },
      {
        rowA: [24],
      },
    );
    layout.layout = normalizeGridLayout({
      rows: layout.rows,
      sizes: layout.sizes,
      rowOrder: ['rowA'],
      itemUids: ['two'],
    });

    const slot: LayoutSlot = {
      type: 'item-edge',
      rowId: 'rowA',
      columnIndex: 0,
      itemIndex: 0,
      itemUid: 'two',
      direction: 'right',
      path: [{ rowId: 'rowA', cellId: 'rowA:cell:0' }],
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'two', layout });
    expect(result.layout).toEqual(layout.layout);
  });

  it('handles row-gap slot below position', () => {
    const layout = createLayout(
      {
        rowA: [['a']],
        rowB: [['b']],
      },
      {
        rowA: [24],
        rowB: [24],
      },
      ['rowA', 'rowB'],
    );

    const slot: LayoutSlot = {
      type: 'row-gap',
      targetRowId: 'rowA',
      position: 'below',
      rect,
    };

    const result = simulateLayoutForSlot({
      slot,
      sourceUid: 'c',
      layout,
      generateRowId: () => 'row-inserted',
    });

    expect(Object.keys(result.rows)).toEqual(['rowA', 'row-inserted', 'rowB']);
  });

  it('inserts row into rowOrder when dropping below target row', () => {
    const layout = createLayout(
      {
        rowA: [['a']],
        rowB: [['b']],
      },
      {
        rowA: [24],
        rowB: [24],
      },
      ['rowA', 'rowB'],
    );

    const slot: LayoutSlot = {
      type: 'row-gap',
      targetRowId: 'rowA',
      position: 'below',
      rect,
    };

    const result = simulateLayoutForSlot({
      slot,
      sourceUid: 'c',
      layout,
      generateRowId: () => 'row-new',
    });

    expect(result.rowOrder).toEqual(['rowA', 'row-new', 'rowB']);
  });

  it('maintains rowOrder and inserts new row before target when provided', () => {
    const layout = createLayout(
      {
        rowA: [['a']],
        rowB: [['b']],
      },
      {
        rowA: [24],
        rowB: [24],
      },
      ['rowA', 'rowB'],
    );

    const slot: LayoutSlot = {
      type: 'row-gap',
      targetRowId: 'rowB',
      position: 'above',
      rect,
    };

    const result = simulateLayoutForSlot({
      slot,
      sourceUid: 'c',
      layout,
      generateRowId: () => 'row-new',
    });

    expect(result.rowOrder).toEqual(['rowA', 'row-new', 'rowB']);
    expect(result.rows).toEqual({
      rowA: [['a']],
      'row-new': [['c']],
      rowB: [['b']],
    });
    expect(result.sizes).toEqual({
      rowA: [24],
      'row-new': [24],
      rowB: [24],
    });
  });

  it('derives rowOrder from rows when missing and removes empty rows from order', () => {
    const layout = createLayout(
      {
        row1: [['a']],
        row2: [['b']],
        row3: [['c']],
      },
      {
        row1: [24],
        row2: [24],
        row3: [24],
      },
    );

    const slot: LayoutSlot = {
      type: 'column',
      rowId: 'row1',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'b', layout });

    expect(result.rowOrder).toEqual(['row1', 'row3']);
    expect(result.rows).toEqual({
      row1: [['b', 'a']],
      row3: [['c']],
    });
    expect(result.sizes).toEqual({
      row1: [24],
      row3: [24],
    });
  });

  it('handles empty-column slot by replacing empty column', () => {
    const layout = createLayout(
      {
        rowA: [['EMPTY_COLUMN'], ['block-b']],
      },
      {
        rowA: [12, 12],
      },
    );

    const slot: LayoutSlot = {
      type: 'empty-column',
      rowId: 'rowA',
      columnIndex: 0,
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'new-block', layout });

    expect(result.rows.rowA[0]).toEqual(['new-block']);
    expect(result.rows.rowA[1]).toEqual(['block-b']);
  });

  it('removes source from multiple locations', () => {
    const layout = createLayout(
      {
        rowA: [['block-1', 'block-2']],
        rowB: [['block-3', 'block-4']],
      },
      {
        rowA: [24],
        rowB: [24],
      },
    );

    const slot: LayoutSlot = {
      type: 'column',
      rowId: 'rowA',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'block-3', layout });

    expect(result.rows.rowA[0]).toContain('block-3');
    expect(result.rows.rowB[0]).not.toContain('block-3');
  });

  it('preserves column sizes when inserting into existing column', () => {
    const layout = createLayout(
      {
        rowA: [['a'], ['b'], ['c']],
      },
      {
        rowA: [8, 8, 8],
      },
    );

    const slot: LayoutSlot = {
      type: 'column',
      rowId: 'rowA',
      columnIndex: 1,
      insertIndex: 0,
      position: 'before',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'd', layout });

    expect(result.sizes.rowA).toEqual([8, 8, 8]);
  });

  it('redistributes sizes proportionally when adding new column via edge', () => {
    const layout = createLayout(
      {
        rowA: [['a'], ['b'], ['c']],
      },
      {
        rowA: [6, 12, 6],
      },
    );

    const slot: LayoutSlot = {
      type: 'column-edge',
      rowId: 'rowA',
      columnIndex: 1,
      direction: 'right',
      rect,
    };

    const result = simulateLayoutForSlot({ slot, sourceUid: 'd', layout });

    expect(result.rows.rowA.length).toBe(4);
    expect(result.sizes.rowA.length).toBe(4);
    const total = result.sizes.rowA.reduce((sum, size) => sum + size, 0);
    expect(total).toBe(24);
  });

  it('preserves explicit empty v2 cells when moving another item', () => {
    const layout: GridLayoutData = {
      rows: {},
      sizes: {},
      layout: {
        version: 2,
        rows: [
          {
            id: 'rowA',
            cells: [
              { id: 'empty-cell', items: [] },
              { id: 'source-cell', items: ['source'] },
              { id: 'target-cell', items: ['target'] },
            ],
            sizes: [8, 8, 8],
          },
        ],
      },
    };

    const slot: LayoutSlot = {
      type: 'column-edge',
      rowId: 'rowA',
      columnIndex: 2,
      direction: 'right',
      rect,
      path: [{ rowId: 'rowA', cellId: 'target-cell' }],
    };

    const result = simulateLayoutForSlot({
      slot,
      sourceUid: 'source',
      layout,
      generateId: (key) => key,
    });

    expect(result.layout?.rows[0].cells).toEqual([
      { id: 'empty-cell', items: [] },
      { id: 'target-cell', items: ['target'] },
      { id: 'column-edge:rowA:2:right:cell', items: ['source'] },
    ]);
    expect(result.layout?.rows[0].sizes).toHaveLength(3);
    expect(result.layout?.rows[0].sizes.reduce((sum, size) => sum + size, 0)).toBe(24);
  });
});

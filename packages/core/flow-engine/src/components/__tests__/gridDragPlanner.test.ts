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

  it('should return first matching slot when multiple slots contain the point', () => {
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
    // Returns first slot that contains the point
    expect(result).toEqual(firstSlot);
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
});

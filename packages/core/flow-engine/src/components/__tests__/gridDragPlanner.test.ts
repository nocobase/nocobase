/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { GridLayoutData, LayoutSlot, simulateLayoutForSlot } from '../dnd/gridDragPlanner';

const rect = { top: 0, left: 0, width: 100, height: 100 };

const createLayout = (rows: Record<string, string[][]>, sizes: Record<string, number[]>): GridLayoutData => ({
  rows,
  sizes,
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
});

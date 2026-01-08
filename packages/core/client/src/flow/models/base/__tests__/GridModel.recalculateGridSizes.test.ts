/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { recalculateGridSizes } from '../GridModel';

const basePosition = { rowId: 'row1', itemIndex: 0 } as const;

describe('recalculateGridSizes', () => {
  it('caps edge expansion so row width never exceeds columnCount', () => {
    const { newSizes, moveDistance } = recalculateGridSizes({
      position: { ...basePosition, columnIndex: 1 },
      direction: 'right',
      resizeDistance: 60,
      prevMoveDistance: 0,
      oldSizes: { row1: [10, 10] },
      oldRows: { row1: [['a'], ['b']] },
      gridContainerWidth: 240,
      gutter: 0,
      columnCount: 24,
    });

    expect(moveDistance).toBe(4);
    expect(newSizes.row1).toEqual([10, 14]);
  });

  it('stops expanding when there is no remaining width', () => {
    const { newSizes, moveDistance } = recalculateGridSizes({
      position: { ...basePosition, columnIndex: 0 },
      direction: 'left',
      resizeDistance: 30,
      prevMoveDistance: 0,
      oldSizes: { row1: [24] },
      oldRows: { row1: [['a']] },
      gridContainerWidth: 240,
      gutter: 0,
      columnCount: 24,
    });

    expect(moveDistance).toBe(0);
    expect(newSizes.row1).toEqual([24]);
  });
});

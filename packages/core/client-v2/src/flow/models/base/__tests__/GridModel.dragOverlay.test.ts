/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { DragOverlayConfig, ColumnInsertConfig, ColumnEdgeConfig, RowGapConfig } from '@nocobase/flow-engine';

describe('DragOverlayConfig', () => {
  it('should define ColumnInsertConfig with height and offsetTop', () => {
    const config: ColumnInsertConfig = {
      height: 20,
      offsetTop: -2,
    };

    expect(config.height).toBe(20);
    expect(config.offsetTop).toBe(-2);
  });

  it('should define ColumnEdgeConfig with width and offsetLeft', () => {
    const config: ColumnEdgeConfig = {
      width: 16,
      offsetLeft: -4,
    };

    expect(config.width).toBe(16);
    expect(config.offsetLeft).toBe(-4);
  });

  it('should define RowGapConfig with height and offsetTop', () => {
    const config: RowGapConfig = {
      height: 32,
      offsetTop: -8,
    };

    expect(config.height).toBe(32);
    expect(config.offsetTop).toBe(-8);
  });

  it('should define DragOverlayConfig with columnInsert', () => {
    const config: DragOverlayConfig = {
      columnInsert: {
        before: { height: 20, offsetTop: -2 },
        after: { height: 20, offsetTop: -2 },
      },
    };

    expect(config.columnInsert?.before?.height).toBe(20);
    expect(config.columnInsert?.before?.offsetTop).toBe(-2);
    expect(config.columnInsert?.after?.height).toBe(20);
    expect(config.columnInsert?.after?.offsetTop).toBe(-2);
  });

  it('should define DragOverlayConfig with columnEdge', () => {
    const config: DragOverlayConfig = {
      columnEdge: {
        left: { width: 16, offsetLeft: -4 },
        right: { width: 16, offsetLeft: 4 },
      },
    };

    expect(config.columnEdge?.left?.width).toBe(16);
    expect(config.columnEdge?.left?.offsetLeft).toBe(-4);
    expect(config.columnEdge?.right?.width).toBe(16);
    expect(config.columnEdge?.right?.offsetLeft).toBe(4);
  });

  it('should define DragOverlayConfig with rowGap', () => {
    const config: DragOverlayConfig = {
      rowGap: {
        above: { height: 32, offsetTop: -8 },
        below: { height: 32, offsetTop: 8 },
      },
    };

    expect(config.rowGap?.above?.height).toBe(32);
    expect(config.rowGap?.above?.offsetTop).toBe(-8);
    expect(config.rowGap?.below?.height).toBe(32);
    expect(config.rowGap?.below?.offsetTop).toBe(8);
  });

  it('should allow partial config', () => {
    const config: DragOverlayConfig = {
      columnInsert: {
        before: { height: 20 }, // only height
      },
      columnEdge: {
        left: { width: 16 }, // only width
      },
    };

    expect(config.columnInsert?.before?.height).toBe(20);
    expect(config.columnInsert?.before?.offsetTop).toBeUndefined();
    expect(config.columnEdge?.left?.width).toBe(16);
    expect(config.columnEdge?.left?.offsetLeft).toBeUndefined();
  });

  it('should allow empty DragOverlayConfig', () => {
    const config: DragOverlayConfig = {};

    expect(config.columnInsert).toBeUndefined();
    expect(config.columnEdge).toBeUndefined();
    expect(config.rowGap).toBeUndefined();
  });

  it('should support full configuration example', () => {
    const config: DragOverlayConfig = {
      columnInsert: {
        before: { height: 20, offsetTop: -2 },
        after: { height: 20, offsetTop: -2 },
      },
      columnEdge: {
        left: { width: 16, offsetLeft: -4 },
        right: { width: 16, offsetLeft: 4 },
      },
      rowGap: {
        above: { height: 32, offsetTop: -8 },
        below: { height: 32, offsetTop: 8 },
      },
    };

    expect(config).toBeDefined();
    expect(Object.keys(config)).toHaveLength(3);
  });
});

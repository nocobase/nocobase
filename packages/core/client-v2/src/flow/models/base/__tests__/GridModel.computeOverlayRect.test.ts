/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { GridModel } from '../GridModel';
import { LayoutSlot, DragOverlayConfig, FlowEngine } from '@nocobase/flow-engine';

describe('GridModel computeOverlayRect', () => {
  let model: GridModel;
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ GridModel });
    model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'test-grid',
      props: {},
      structure: { rows: {}, sizes: {} },
    });
  });

  describe('Column slot', () => {
    it('should use default rect when no config provided', () => {
      const slot: LayoutSlot = {
        type: 'column',
        rowId: 'row1',
        columnIndex: 0,
        insertIndex: 0,
        position: 'before',
        rect: { top: 100, left: 50, width: 200, height: 30 },
      };

      // Access private method via type assertion
      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100,
        left: 50,
        width: 200,
        height: 30,
      });
    });

    it('should apply before position config', () => {
      const config: DragOverlayConfig = {
        columnInsert: {
          before: { height: 20, offsetTop: -2 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'column',
        rowId: 'row1',
        columnIndex: 0,
        insertIndex: 0,
        position: 'before',
        rect: { top: 100, left: 50, width: 200, height: 30 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 98, // 100 - 2
        left: 50,
        width: 200,
        height: 20,
      });
    });

    it('should apply after position config', () => {
      const config: DragOverlayConfig = {
        columnInsert: {
          after: { height: 25, offsetTop: 3 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'column',
        rowId: 'row1',
        columnIndex: 0,
        insertIndex: 1,
        position: 'after',
        rect: { top: 100, left: 50, width: 200, height: 30 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 103, // 100 + 3
        left: 50,
        width: 200,
        height: 25,
      });
    });

    it('should apply only height without offset', () => {
      const config: DragOverlayConfig = {
        columnInsert: {
          before: { height: 40 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'column',
        rowId: 'row1',
        columnIndex: 0,
        insertIndex: 0,
        position: 'before',
        rect: { top: 100, left: 50, width: 200, height: 30 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100, // no offset
        left: 50,
        width: 200,
        height: 40,
      });
    });
  });

  describe('Column-edge slot', () => {
    it('should use default rect when no config provided', () => {
      const slot: LayoutSlot = {
        type: 'column-edge',
        rowId: 'row1',
        columnIndex: 0,
        direction: 'left',
        rect: { top: 100, left: 50, width: 16, height: 200 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100,
        left: 50,
        width: 16,
        height: 200,
      });
    });

    it('should apply left direction config', () => {
      const config: DragOverlayConfig = {
        columnEdge: {
          left: { width: 20, offsetLeft: -5 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'column-edge',
        rowId: 'row1',
        columnIndex: 0,
        direction: 'left',
        rect: { top: 100, left: 50, width: 16, height: 200 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100,
        left: 45, // 50 - 5
        width: 20,
        height: 200,
      });
    });

    it('should apply right direction config', () => {
      const config: DragOverlayConfig = {
        columnEdge: {
          right: { width: 24, offsetLeft: 4 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'column-edge',
        rowId: 'row1',
        columnIndex: 1,
        direction: 'right',
        rect: { top: 100, left: 250, width: 16, height: 200 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100,
        left: 254, // 250 + 4
        width: 24,
        height: 200,
      });
    });
  });

  describe('Row-gap slot', () => {
    it('should use default rect when no config provided', () => {
      const slot: LayoutSlot = {
        type: 'row-gap',
        targetRowId: 'row2',
        position: 'above',
        rect: { top: 100, left: 50, width: 500, height: 32 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100,
        left: 50,
        width: 500,
        height: 32,
      });
    });

    it('should apply above position config', () => {
      const config: DragOverlayConfig = {
        rowGap: {
          above: { height: 40, offsetTop: -10 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'row-gap',
        targetRowId: 'row2',
        position: 'above',
        rect: { top: 100, left: 50, width: 500, height: 32 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 90, // 100 - 10
        left: 50,
        width: 500,
        height: 40,
      });
    });

    it('should apply below position config', () => {
      const config: DragOverlayConfig = {
        rowGap: {
          below: { height: 36, offsetTop: 8 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'row-gap',
        targetRowId: 'row1',
        position: 'below',
        rect: { top: 200, left: 50, width: 500, height: 32 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 208, // 200 + 8
        left: 50,
        width: 500,
        height: 36,
      });
    });
  });

  describe('Empty-row slot', () => {
    it('should always use default rect regardless of config', () => {
      const config: DragOverlayConfig = {
        columnInsert: {
          before: { height: 100, offsetTop: 50 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'empty-row',
        rect: { top: 0, left: 0, width: 800, height: 100 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 0,
        left: 0,
        width: 800,
        height: 100,
      });
    });
  });

  describe('Empty-column slot', () => {
    it('should always use default rect regardless of config', () => {
      const config: DragOverlayConfig = {
        columnEdge: {
          left: { width: 100, offsetLeft: 50 },
        },
      };
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'empty-column',
        rowId: 'row1',
        columnIndex: 0,
        rect: { top: 100, left: 50, width: 200, height: 300 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100,
        left: 50,
        width: 200,
        height: 300,
      });
    });

    it('should not be affected by any config', () => {
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
      model.dragOverlayConfig = config;

      const slot: LayoutSlot = {
        type: 'empty-column',
        rowId: 'row1',
        columnIndex: 0,
        rect: { top: 100, left: 50, width: 200, height: 300 },
      };

      const result = (model as any).computeOverlayRect(slot);

      // Should still use original rect
      expect(result).toEqual({
        top: 100,
        left: 50,
        width: 200,
        height: 300,
      });
    });
  });

  describe('Mixed configurations', () => {
    it('should handle partial config correctly', () => {
      const config: DragOverlayConfig = {
        columnInsert: {
          before: { height: 20 }, // no offsetTop
        },
        columnEdge: {
          left: { offsetLeft: -4 }, // no width
        },
      };
      model.dragOverlayConfig = config;

      const columnSlot: LayoutSlot = {
        type: 'column',
        rowId: 'row1',
        columnIndex: 0,
        insertIndex: 0,
        position: 'before',
        rect: { top: 100, left: 50, width: 200, height: 30 },
      };

      const result1 = (model as any).computeOverlayRect(columnSlot);
      expect(result1.height).toBe(20);
      expect(result1.top).toBe(100); // no offset applied

      const edgeSlot: LayoutSlot = {
        type: 'column-edge',
        rowId: 'row1',
        columnIndex: 0,
        direction: 'left',
        rect: { top: 100, left: 50, width: 16, height: 200 },
      };

      const result2 = (model as any).computeOverlayRect(edgeSlot);
      expect(result2.width).toBe(16); // default width
      expect(result2.left).toBe(46); // 50 - 4
    });

    it('should handle undefined config gracefully', () => {
      model.dragOverlayConfig = undefined;

      const slot: LayoutSlot = {
        type: 'column',
        rowId: 'row1',
        columnIndex: 0,
        insertIndex: 0,
        position: 'before',
        rect: { top: 100, left: 50, width: 200, height: 30 },
      };

      const result = (model as any).computeOverlayRect(slot);

      expect(result).toEqual({
        top: 100,
        left: 50,
        width: 200,
        height: 30,
      });
    });
  });
});

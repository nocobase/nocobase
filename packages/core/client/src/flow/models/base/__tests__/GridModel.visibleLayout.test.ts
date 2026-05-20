/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EMPTY_COLUMN_UID, FlowEngine } from '@nocobase/flow-engine';
import { GRID_FLOW_KEY, GRID_STEP, GridModel } from '../GridModel';

describe('GridModel.getVisibleLayout (hidden items filtering)', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ GridModel });
  });

  it('keeps all rows/cols when config mode enabled, even if items are hidden', () => {
    engine.flowSettings.enable();

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-1',
      props: {
        rows: {
          row1: [['a'], ['b']],
        },
        sizes: {
          row1: [12, 12],
        },
      },
      structure: {} as any,
    });

    // 模拟运行时已挂载的子模型集合
    const a = engine.createModel({ use: 'FlowModel', uid: 'a' });
    const b = engine.createModel({ use: 'FlowModel', uid: 'b' });
    (model as any).subModels = { items: [a, b] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    expect(Object.keys(rows)).toEqual(['row1']);
    expect(rows.row1).toEqual([['a'], ['b']]);
    expect(sizes.row1).toEqual([12, 12]);
  });

  it('filters out columns whose all items are hidden in runtime mode', () => {
    engine.flowSettings.disable();

    const itemVisible = engine.createModel({ use: 'FlowModel', uid: 'v' });
    const itemHidden = engine.createModel({ use: 'FlowModel', uid: 'h' }) as any;
    itemHidden.hidden = true;

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-2',
      props: {
        rows: {
          row1: [['h'], ['v']],
        },
        sizes: {
          row1: [8, 16],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [itemHidden, itemVisible] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    // 第一列只有 hidden，应该被过滤掉，只保留包含 v 的那一列
    expect(Object.keys(rows)).toEqual(['row1']);
    expect(rows.row1).toEqual([['v']]);
    expect(sizes.row1).toEqual([24]);
  });

  it('removes entire row when all columns are hidden-only', () => {
    engine.flowSettings.disable();

    const h1 = engine.createModel({ use: 'FlowModel', uid: 'h1' }) as any;
    const h2 = engine.createModel({ use: 'FlowModel', uid: 'h2' }) as any;
    h1.hidden = true;
    h2.hidden = true;

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-3',
      props: {
        rows: {
          row1: [['h1'], ['h2']],
        },
        sizes: {
          row1: [12, 12],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [h1, h2] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    expect(Object.keys(rows)).toEqual([]);
    expect(Object.keys(sizes)).toEqual([]);
  });

  it('uses rowOrder when provided to keep row sequence', () => {
    engine.flowSettings.disable();

    const visible1 = engine.createModel({ use: 'FlowModel', uid: 'v1' });
    const visible2 = engine.createModel({ use: 'FlowModel', uid: 'v2' });
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-4',
      props: {
        rows: {
          second: [['v2']],
          first: [['v1']],
        },
        sizes: {
          second: [24],
          first: [24],
        },
        rowOrder: ['first', 'second'],
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [visible1, visible2] };

    const { rows } = (model as any).getVisibleLayout();
    expect(Object.keys(rows)).toEqual(['first', 'second']);
  });

  it('falls back to rows key order when rowOrder is missing', () => {
    engine.flowSettings.disable();

    const visible1 = engine.createModel({ use: 'FlowModel', uid: 'v1' });
    const visible2 = engine.createModel({ use: 'FlowModel', uid: 'v2' });
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-5',
      props: {
        rows: {
          second: [['v2']],
          first: [['v1']],
        },
        sizes: {
          second: [24],
          first: [24],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [visible1, visible2] };

    const { rows } = (model as any).getVisibleLayout();
    expect(Object.keys(rows)).toEqual(['second', 'first']);
  });

  it('removes hidden items inside a mixed cell and preserves column sizes', () => {
    engine.flowSettings.disable();

    const visible = engine.createModel({ use: 'FlowModel', uid: 'v' });
    const visible2 = engine.createModel({ use: 'FlowModel', uid: 'v2' });
    const hidden = engine.createModel({ use: 'FlowModel', uid: 'h' }) as any;
    hidden.hidden = true;

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-6',
      props: {
        rows: {
          row1: [['h', 'v'], ['v2']],
        },
        sizes: {
          row1: [8, 16],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [hidden, visible, visible2] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    // 第一个单元格中的 h 应被剔除，只剩 v；列宽保持不变
    expect(rows.row1).toEqual([['v'], ['v2']]);
    expect(sizes.row1).toEqual([8, 16]);
  });

  it('preserves remaining column size ratios when filtering v2 layout columns', () => {
    engine.flowSettings.disable();

    const visible1 = engine.createModel({ use: 'FlowModel', uid: 'v1' });
    const visible2 = engine.createModel({ use: 'FlowModel', uid: 'v2' });
    const hidden = engine.createModel({ use: 'FlowModel', uid: 'h' }) as any;
    hidden.hidden = true;

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-7',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'row1',
              cells: [
                { id: 'cell1', items: ['h'] },
                { id: 'cell2', items: ['v1'] },
                { id: 'cell3', items: ['v2'] },
              ],
              sizes: [4, 8, 12],
            },
          ],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [hidden, visible1, visible2] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    expect(rows.row1).toEqual([['v1'], ['v2']]);
    expect(sizes.row1).toEqual([10, 14]);
  });

  it('preserves EMPTY_COLUMN placeholder width in runtime mode', () => {
    engine.flowSettings.disable();

    const visible = engine.createModel({ use: 'FlowModel', uid: 'v' });

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-8',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'row1',
              cells: [
                { id: 'cell1', items: ['v'] },
                { id: 'cell2', items: [EMPTY_COLUMN_UID] },
              ],
              sizes: [8, 16],
            },
          ],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [visible] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    // 空列是拖拽缩窄区块后的布局占位；运行态也要保留其宽度，避免剩余区块被拉满整行。
    expect(rows.row1).toEqual([['v'], [EMPTY_COLUMN_UID]]);
    expect(sizes.row1).toEqual([8, 16]);
  });

  it('removes rows that only contain EMPTY_COLUMN placeholders in runtime mode when there are no items', () => {
    engine.flowSettings.disable();

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-9',
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'row1',
              cells: [{ id: 'cell1', items: [EMPTY_COLUMN_UID] }],
              sizes: [24],
            },
          ],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    expect(rows).toEqual({});
    expect(sizes).toEqual({});
  });

  it('removes the placeholder-only row after the last real item in the row is deleted', () => {
    engine.flowSettings.disable();

    const visible = engine.createModel({ use: 'FlowModel', uid: 'v' });
    const layout = {
      version: 2 as const,
      rows: [
        {
          id: 'row1',
          cells: [
            { id: 'cell1', items: ['v'] },
            { id: 'cell2', items: [EMPTY_COLUMN_UID] },
          ],
          sizes: [8, 16],
        },
      ],
    };
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-10',
      props: { layout },
      structure: {} as any,
    });
    (model as any).subModels = { items: [visible] };
    model.setStepParams(GRID_FLOW_KEY, GRID_STEP, { layout });
    model.syncLayoutProps(model.getGridLayout());
    model.onMount();

    (model as any).subModels = { items: [] };
    model.emitter.emit('onSubModelDestroyed', visible);

    expect(model.props.rows).toEqual({});
    expect(model.props.sizes).toEqual({});
    expect(model.props.layout.rows).toEqual([]);
    expect(model.getStepParams(GRID_FLOW_KEY, GRID_STEP).layout.rows).toEqual([]);
  });
});

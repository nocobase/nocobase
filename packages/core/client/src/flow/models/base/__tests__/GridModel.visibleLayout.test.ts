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
import { GridModel } from '../GridModel';

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
    expect(sizes.row1).toEqual([16]);
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

    const visible = engine.createModel({ use: 'FlowModel', uid: 'v1' });
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-4',
      props: {
        rows: {
          second: [['v1']],
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

    (model as any).subModels = { items: [visible] };

    const { rows } = (model as any).getVisibleLayout();
    expect(Object.keys(rows)).toEqual(['first', 'second']);
  });

  it('falls back to rows key order when rowOrder is missing', () => {
    engine.flowSettings.disable();

    const visible = engine.createModel({ use: 'FlowModel', uid: 'v1' });
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-5',
      props: {
        rows: {
          second: [['v1']],
          first: [['v1']],
        },
        sizes: {
          second: [24],
          first: [24],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [visible] };

    const { rows } = (model as any).getVisibleLayout();
    expect(Object.keys(rows)).toEqual(['second', 'first']);
  });

  it('removes hidden items inside a mixed cell and preserves column sizes', () => {
    engine.flowSettings.disable();

    const visible = engine.createModel({ use: 'FlowModel', uid: 'v' });
    const hidden = engine.createModel({ use: 'FlowModel', uid: 'h' }) as any;
    hidden.hidden = true;

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-6',
      props: {
        rows: {
          row1: [['h', 'v'], ['v']],
        },
        sizes: {
          row1: [8, 16],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [hidden, visible] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    // 第一个单元格中的 h 应被剔除，只剩 v；列宽保持不变
    expect(rows.row1).toEqual([['v'], ['v']]);
    expect(sizes.row1).toEqual([8, 16]);
  });

  it('ignores EMPTY_COLUMN uid in runtime mode without crashing', () => {
    engine.flowSettings.disable();

    const visible = engine.createModel({ use: 'FlowModel', uid: 'v' });

    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-7',
      props: {
        rows: {
          row1: [[EMPTY_COLUMN_UID, 'ghost', 'v'], ['ghost-2']],
        },
        sizes: {
          row1: [8, 16],
        },
      },
      structure: {} as any,
    });

    (model as any).subModels = { items: [visible] };

    const { rows, sizes } = (model as any).getVisibleLayout();
    // unknown uid 视为可见（避免误删），但 EMPTY_COLUMN_UID 必须被剔除
    expect(rows.row1).toEqual([['ghost', 'v'], ['ghost-2']]);
    expect(sizes.row1).toEqual([8, 16]);
  });
});

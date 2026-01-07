/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { GridModel } from '../GridModel';

describe('GridModel.mergeRowsWithItems', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ GridModel });
  });

  it('generates rows in item order when rows is an empty array', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-1',
      props: {},
      structure: {} as any,
    });

    const items = [
      engine.createModel({ use: 'FlowModel', uid: 'a' }),
      engine.createModel({ use: 'FlowModel', uid: 'b' }),
      engine.createModel({ use: 'FlowModel', uid: 'c' }),
      engine.createModel({ use: 'FlowModel', uid: 'd' }),
      engine.createModel({ use: 'FlowModel', uid: 'e' }),
      engine.createModel({ use: 'FlowModel', uid: 'f' }),
    ];
    (model as any).subModels = { items };

    const merged = model.mergeRowsWithItems([]);

    expect(Array.isArray(merged)).toBe(true);
    expect(merged.length).toBe(6);
    expect(merged[0]).toEqual([['a']]);
    expect(merged[1]).toEqual([['b']]);
    expect(merged[2]).toEqual([['c']]);
    expect(merged[3]).toEqual([['d']]);
    expect(merged[4]).toEqual([['e']]);
    expect(merged[5]).toEqual([['f']]);
  });

  it('filters non-existent items from legacy object rows and keeps order', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-2',
      props: {},
      structure: {} as any,
    });

    const items = [engine.createModel({ use: 'FlowModel', uid: 'a' })];
    (model as any).subModels = { items };

    const existingRows = {
      r1: [['a'], ['b']],
      r2: [['c']],
    };

    const merged = model.mergeRowsWithItems(existingRows);

    expect(merged).toEqual([[['a']]]);
  });

  it('preserves existing row order even when items order differs', () => {
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-reorder',
      props: {},
      structure: {} as any,
    });

    const items = [
      engine.createModel({ use: 'FlowModel', uid: 'b' }),
      engine.createModel({ use: 'FlowModel', uid: 'a' }),
    ];
    (model as any).subModels = { items };

    // 现有 rows 是 a 在前，b 在后
    const existingRows = [[['a']], [['b']]];

    const merged = model.mergeRowsWithItems(existingRows);

    expect(merged[0]).toEqual([['a']]);
    expect(merged[1]).toEqual([['b']]);
  });
});

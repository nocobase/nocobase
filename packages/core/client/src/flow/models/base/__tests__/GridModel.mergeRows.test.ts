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

  it('generates rows in item order when rows is empty', () => {
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
    ];
    (model as any).subModels = { items };

    const merged = model.mergeRowsWithItems({});

    const rowsValues = Object.values(merged);

    expect(rowsValues.length).toBe(3);
    expect(rowsValues[0]).toEqual([['a']]);
    expect(rowsValues[1]).toEqual([['b']]);
    expect(rowsValues[2]).toEqual([['c']]);
  });

  it('correctly filters non-existent items from existing rows', () => {
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

    const keys = Object.keys(merged);
    expect(keys).toContain('r1');
    expect(keys).not.toContain('r2');

    expect(merged['r1']).toEqual([['a']]);
    expect(merged['r2']).toBeUndefined();
  });

  it('reorders rows based on items order when rows exist but are in different order', () => {
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
    const existingRows = {
      r1: [['a']],
      r2: [['b']],
    };

    const merged = model.mergeRowsWithItems(existingRows);
    const rowsValues = Object.values(merged);

    // 我们期望 merged 后的顺序应该跟随 existingRows (a, b)
    // 即便 items 顺序是 (b, a)
    expect(rowsValues[0]).toEqual([['a']]);
    expect(rowsValues[1]).toEqual([['b']]);
  });
});

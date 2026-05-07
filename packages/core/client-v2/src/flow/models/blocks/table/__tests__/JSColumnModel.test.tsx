/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { JSColumnModel } from '../JSColumnModel';

describe('JSColumnModel row refresh', () => {
  it('changes renderer key and invalidates beforeRender cache when row content changes', () => {
    const engine = new FlowEngine();
    const model = new JSColumnModel({
      uid: 'js-column-row-refresh',
      flowEngine: engine,
      props: {
        width: 200,
        title: 'JS column',
      },
    } as any);

    engine.context.dataSourceManager.getDataSource('main').addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'age', type: 'integer', interface: 'integer' },
        { name: 'workyears', type: 'float', interface: 'number' },
      ],
    });

    const collection = engine.context.dataSourceManager.getCollection('main', 'users');
    model.context.defineProperty('collection', {
      value: collection,
    });

    const column = model.getColumnProps();
    const first = column.render(null, { id: 1, age: 3, workyears: 39.2 }, 0) as any;
    const fork = model.getFork('1') as any;
    const invalidateFlowCache = vi.fn();
    fork.invalidateFlowCache = invalidateFlowCache;
    const second = column.render(null, { id: 1, age: 37, workyears: 39.2 }, 0) as any;

    expect(first.key).not.toBe(second.key);
    expect(invalidateFlowCache).toHaveBeenCalledWith('beforeRender');
  });
});

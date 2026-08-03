/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { createItemChainMetaFactory, createItemChainResolver, type ItemChain } from '../itemChain';

describe('item chain record slots', () => {
  it('builds association slots through an arbitrary parentItem chain', async () => {
    const engine = new FlowEngine();
    const dataSource = engine.dataSourceManager.getDataSource('main');
    dataSource.addCollection({
      name: 'departments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', type: 'string', interface: 'input' },
      ],
    });
    dataSource.addCollection({
      name: 'users',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'department', type: 'belongsTo', target: 'departments', interface: 'm2o' },
      ],
    });
    const collection = dataSource.getCollection('users');
    const makeMeta = (parentMeta?: ReturnType<typeof createItemChainMetaFactory>) =>
      createItemChainMetaFactory({
        t: (value) => value,
        title: 'Current item',
        collectionAccessor: () => collection,
        propertiesAccessor: (ctx) => ctx.item.value,
        parentItemMetaAccessor: parentMeta ? () => parentMeta : undefined,
      });
    const grandparentMeta = makeMeta();
    const parentMeta = makeMeta(grandparentMeta);
    const meta = await makeMeta(parentMeta)();
    const item: ItemChain = {
      value: { id: 1, department: { id: 11 } },
      parentItem: {
        value: { id: 2, department: { id: 22 } },
        parentItem: { value: { id: 3, department: { id: 33 } } },
      },
    };
    const variablesParams = await meta.buildVariablesParams({ item });

    expect(engine.context.buildServerContextParams({ item: variablesParams })).toEqual({
      'item.value.department': { collection: 'departments', dataSourceKey: 'main', filterByTk: 11 },
      'item.parentItem.value.department': { collection: 'departments', dataSourceKey: 'main', filterByTk: 22 },
      'item.parentItem.parentItem.value.department': {
        collection: 'departments',
        dataSourceKey: 'main',
        filterByTk: 33,
      },
    });

    const resolver: (path: string) => boolean = createItemChainResolver({
      collectionAccessor: () => collection,
      propertiesAccessor: () => item.value,
      parentItemResolverAccessor: () => resolver,
    });
    expect(resolver('value.department.name')).toBe(true);
    expect(resolver('parentItem.parentItem.value.department.name')).toBe(true);
    expect(resolver('parentItem.parentItem.value')).toBe(false);
  });
});

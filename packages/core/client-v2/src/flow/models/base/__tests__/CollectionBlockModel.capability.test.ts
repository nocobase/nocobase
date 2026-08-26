/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import '../../../index';
import { BlockSceneEnum } from '../BlockModel';
import { CollectionBlockModel } from '../CollectionBlockModel';

class CreateOnlyCollectionBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.new;
  static blockCapabilityActionName = 'create';
}

describe('CollectionBlockModel capability filtering', () => {
  it('filters current and other collections by block capability', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ CreateOnlyCollectionBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      availableActions: ['get'],
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });
    ds.addCollection({
      name: 'orders',
      filterTargetKey: 'id',
      availableActions: ['create'],
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });

    const ctx = {
      dataSourceManager: engine.dataSourceManager,
      view: { inputArgs: { dataSourceKey: 'main', collectionName: 'users' } },
    } as any;

    const children = (await CreateOnlyCollectionBlockModel.defineChildren(ctx)) as any[];

    expect(children.some((item) => String(item?.key).includes('current-collection'))).toBe(false);

    const others = children.find((item) => String(item?.key).includes('others-collections'));
    const otherChildren = Array.isArray(others.children) ? others.children : others.children(ctx);
    expect(otherChildren.map((item) => item.label)).toEqual(['orders']);
  });

  it('filters associated collections by block capability', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ CreateOnlyCollectionBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'orders',
      filterTargetKey: 'id',
      availableActions: ['get'],
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'user_id', type: 'integer', interface: 'number' },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      availableActions: ['create'],
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        {
          name: 'orders',
          title: 'Orders',
          type: 'hasMany',
          target: 'orders',
          interface: 'o2m',
          foreignKey: 'user_id',
        },
      ],
    });

    const ctx = {
      dataSourceManager: engine.dataSourceManager,
      view: { inputArgs: { dataSourceKey: 'main', collectionName: 'users', filterByTk: 1 } },
    } as any;

    const children = (await CreateOnlyCollectionBlockModel.defineChildren(ctx)) as any[];
    const associated = children.find((item) => String(item?.key).includes('associated'));

    expect(associated).toBeTruthy();
    expect(associated.children()).toEqual([]);
  });
});

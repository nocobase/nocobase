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
import { BlockSceneEnum, CollectionBlockModel } from '../../../../index';

class NewSceneCollectionBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.new;
}

describe('CollectionBlockModel defineChildren - new scene associated records visibility', () => {
  it('hides "Associated records" when filterByTk is missing', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ NewSceneCollectionBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'user_id', type: 'integer', interface: 'number' },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
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

    const designerCtx = {
      dataSourceManager: engine.dataSourceManager,
      view: { inputArgs: { dataSourceKey: 'main', collectionName: 'users' } },
    } as any;

    const children = (await NewSceneCollectionBlockModel.defineChildren(designerCtx)) as any[];
    const hasAssociated = children.some((item) => String(item?.key).includes('associated'));
    expect(hasAssociated).toBe(false);
  });

  it('shows "Associated records" when filterByTk exists', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ NewSceneCollectionBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'user_id', type: 'integer', interface: 'number' },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
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

    const designerCtx = {
      dataSourceManager: engine.dataSourceManager,
      view: { inputArgs: { dataSourceKey: 'main', collectionName: 'users', filterByTk: 1 } },
    } as any;

    const children = (await NewSceneCollectionBlockModel.defineChildren(designerCtx)) as any[];
    const hasAssociated = children.some((item) => String(item?.key).includes('associated'));
    expect(hasAssociated).toBe(true);
  });

  it('filters out belongsToArray fields in "Associated records" children', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ NewSceneCollectionBlockModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'user_id', type: 'integer', interface: 'number' },
      ],
    });
    ds.addCollection({
      name: 'orgs',
      filterTargetKey: 'id',
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
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
        {
          name: 'orgs',
          title: 'Orgs',
          type: 'belongsToMany',
          target: 'orgs',
          interface: 'm2m',
        },
        {
          name: 'org_m2marray',
          title: 'Org M2M Array',
          type: 'belongsToArray',
          target: 'orgs',
          interface: 'm2mArray',
        },
      ],
    });

    const designerCtx = {
      dataSourceManager: engine.dataSourceManager,
      view: { inputArgs: { dataSourceKey: 'main', collectionName: 'users', filterByTk: 1 } },
    } as any;

    const children = (await NewSceneCollectionBlockModel.defineChildren(designerCtx)) as any[];
    const associated = children.find((item) => String(item?.key).includes('associated'));
    expect(associated).toBeTruthy();

    const associatedChildren = (associated.children?.() || []) as any[];
    expect(associatedChildren.some((item) => String(item?.key).includes('associated-orders'))).toBe(true);
    expect(associatedChildren.some((item) => String(item?.key).includes('associated-orgs'))).toBe(true);
    expect(associatedChildren.some((item) => String(item?.key).includes('associated-org_m2marray'))).toBe(false);
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import '../../../index';
import { CollectionBlockModel } from '../CollectionBlockModel';

class DummyMultiRecordResource extends MultiRecordResource<any> {
  refreshCalls = 0;

  override async refresh(): Promise<void> {
    this.refreshCalls += 1;
    this.emit('refresh');
  }
}

class DummyAssociationTableBlockModel extends CollectionBlockModel {
  createResource(ctx: any, _params: any) {
    return ctx.createResource(DummyMultiRecordResource);
  }
}

function setupEngineAndModel() {
  const engine = new FlowEngine();
  engine.context.defineProperty('location', { value: { search: '' } as any });

  engine.registerModels({ DummyAssociationTableBlockModel });

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'roles',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'input' },
    ],
  });
  ds.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      {
        name: 'roles',
        title: 'Roles',
        type: 'hasMany',
        target: 'roles',
        interface: 'o2m',
        foreignKey: 'user_id',
      },
    ],
  });

  const model = engine.createModel<DummyAssociationTableBlockModel>({
    uid: 'assoc-table',
    use: 'DummyAssociationTableBlockModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'roles',
          associationName: 'users.roles',
        },
      },
    },
  });

  // Avoid early return in onActive when qs changes.
  (model as any).previousBeforeRenderHash = '';

  const resource = model.context.resource as unknown as DummyMultiRecordResource;
  return { engine, model, resource };
}

describe('CollectionBlockModel onActive dirty refresh (association blocks)', () => {
  it('refreshes when target collection becomes dirty', async () => {
    const { engine, model, resource } = setupEngineAndModel();

    expect(resource.refreshCalls).toBe(0);
    engine.markDataSourceDirty('main', 'roles');

    model.onActive();
    // Flush promise chain scheduled by onActive
    await Promise.resolve();

    expect(resource.refreshCalls).toBe(1);

    // No further refresh without new dirty writes
    model.onActive();
    await Promise.resolve();
    expect(resource.refreshCalls).toBe(1);
  });

  it('still refreshes when association resource becomes dirty', async () => {
    const { engine, model, resource } = setupEngineAndModel();

    engine.markDataSourceDirty('main', 'users.roles');
    model.onActive();
    await Promise.resolve();

    expect(resource.refreshCalls).toBe(1);
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, type FlowModelContext, MultiRecordResource, VIEW_ACTIVATED_EVENT } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { BlockGridModel } from '../BlockGridModel';
import { CollectionBlockModel } from '../CollectionBlockModel';

class TestBlockGridModel extends BlockGridModel {
  mountForTest() {
    super.onMount();
  }

  unmountForTest() {
    super.onUnmount();
  }
}

class TestMultiRecordResource extends MultiRecordResource<Record<string, unknown>> {
  refreshCalls = 0;

  override async refresh(): Promise<void> {
    this.refreshCalls += 1;
    this.emit('refresh');
  }
}

class TestCollectionBlockModel extends CollectionBlockModel {
  createResource(ctx: FlowModelContext) {
    return ctx.createResource(TestMultiRecordResource);
  }

  mountForTest() {
    super.onMount();
  }
}

describe('BlockGridModel - select scene activation', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.context.defineProperty('location', { value: { search: '' } });
    engine.registerModels({ TestBlockGridModel, TestCollectionBlockModel });

    engine.dataSourceManager.getDataSource('main').addCollection({
      name: 'roles',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', type: 'string', interface: 'input' },
      ],
    });
  });

  function createModels(scene = 'select') {
    engine.context.defineProperty('view', { value: { inputArgs: { scene } } });
    const grid = engine.createModel<TestBlockGridModel>({ use: 'TestBlockGridModel' });
    const block = grid.addSubModel<TestCollectionBlockModel>('items', {
      use: 'TestCollectionBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'roles',
          },
        },
      },
    });
    const resource = block.context.resource as TestMultiRecordResource;

    block.mountForTest();
    grid.mountForTest();
    return { grid, resource };
  }

  it('refreshes dirty collection blocks once when a nested view closes', async () => {
    const { grid, resource } = createModels();

    engine.markDataSourceDirty('main', 'roles');
    engine.emitter.emit(VIEW_ACTIVATED_EVENT);
    await Promise.resolve();

    expect(resource.refreshCalls).toBe(1);

    engine.emitter.emit(VIEW_ACTIVATED_EVENT);
    await Promise.resolve();

    expect(resource.refreshCalls).toBe(1);
    grid.unmountForTest();
  });

  it('does not refresh without dirty data or after the grid unmounts', async () => {
    const { grid, resource } = createModels();

    engine.emitter.emit(VIEW_ACTIVATED_EVENT);
    await Promise.resolve();
    expect(resource.refreshCalls).toBe(0);

    grid.unmountForTest();
    engine.markDataSourceDirty('main', 'roles');
    engine.emitter.emit(VIEW_ACTIVATED_EVENT);
    await Promise.resolve();

    expect(resource.refreshCalls).toBe(0);
  });

  it('does not handle activation outside the select scene', async () => {
    const { grid, resource } = createModels('list');

    engine.markDataSourceDirty('main', 'roles');
    engine.emitter.emit(VIEW_ACTIVATED_EVENT);
    await Promise.resolve();

    expect(resource.refreshCalls).toBe(0);
    grid.unmountForTest();
  });
});

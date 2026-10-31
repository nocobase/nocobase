/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { KanbanBlockModel } from '../models';

class MountedKanbanBlockModel extends KanbanBlockModel {
  mount() {
    this.onMount();
  }
}

function setup() {
  const engine = new FlowEngine();
  engine.context.defineProperty('location', { value: { search: '' } });
  engine.context.defineProperty('route', { value: { params: {} } });
  engine.registerModels({ MountedKanbanBlockModel });
  engine.dataSourceManager.getDataSource('main').addCollection({
    name: 'posts',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'status', type: 'string', interface: 'select', uiSchema: { enum: [] } },
    ],
  });
  const model = engine.createModel<MountedKanbanBlockModel>({
    uid: 'kanban-refresh',
    use: 'MountedKanbanBlockModel',
    stepParams: {
      resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'posts' } },
    },
  });
  model.mount();
  return { engine, model };
}

describe('KanbanBlockModel activation refresh', () => {
  test('refreshes columns after a popup creates a record without active filters', async () => {
    const { engine, model } = setup();
    const refreshColumns = vi.fn();
    model.emitter.on('refresh', refreshColumns);
    const runAction = vi.spyOn(model.resource, 'runAction');

    model.onActive();
    await new Promise((resolve) => setTimeout(resolve, 0));
    refreshColumns.mockClear();

    engine.markDataSourceDirty('main', 'posts');
    model.onActive();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(refreshColumns).toHaveBeenCalledTimes(1);
    expect(runAction).not.toHaveBeenCalled();
    expect(model.isManualRefresh).toBe(true);

    model.onActive();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(refreshColumns).toHaveBeenCalledTimes(1);
  });

  test('forwards forced activation refreshes to columns without active filters', async () => {
    const { model } = setup();
    const refreshColumns = vi.fn();
    model.emitter.on('refresh', refreshColumns);

    model.onActive(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(refreshColumns).toHaveBeenCalledTimes(1);
    expect(model.isManualRefresh).toBe(true);
  });
});

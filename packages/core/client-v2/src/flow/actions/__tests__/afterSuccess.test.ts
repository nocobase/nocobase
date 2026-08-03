/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowEngine,
  FlowModel,
  FlowRuntimeContext,
  setupRuntimeContextSteps,
  type Collection,
} from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { afterSuccess, getAfterSuccessResponseRecord, getMetaTreeWithResponseRecord } from '../afterSuccess';

describe('afterSuccess response record variable', () => {
  it('reads the submit response record from the saveResource step', () => {
    const record = { id: 1, title: 'Saved' };

    expect(
      getAfterSuccessResponseRecord({
        steps: {
          confirm: { params: {}, result: undefined },
          saveResource: { params: {}, result: record },
          afterSuccess: { params: {} },
        },
      }),
    ).toBe(record);
  });

  it('injects responseRecord into the afterSuccess runtime context', async () => {
    const record = { id: 1, title: 'Saved' };
    const sourceCtx = {
      steps: {
        saveResource: { params: {}, result: record },
      },
      t: (value: string) => value,
    };
    const properties = await afterSuccess.defineProperties(sourceCtx as FlowRuntimeContext);

    expect(properties.responseRecord.get()).toBe(record);
  });

  it('builds responseRecord at the variable root', async () => {
    const engine = new FlowEngine();
    const dataSource = engine.dataSourceManager.getDataSource('main');
    dataSource.addCollection({
      name: 'departments',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', type: 'string', interface: 'input' },
      ],
    });
    dataSource.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'department', type: 'belongsTo', target: 'departments', interface: 'm2o' },
      ],
    });
    const collection = dataSource.getCollection('users');
    const ctx = {
      collection,
      steps: { saveResource: { params: {}, result: { id: 7 } } },
      t: (value: string) => value,
    };
    const properties = await afterSuccess.defineProperties(ctx as FlowRuntimeContext);
    const meta = await properties.responseRecord.meta();
    const recordRef = await meta.buildVariablesParams(ctx);

    expect(engine.context.buildServerContextParams({ responseRecord: recordRef })).toEqual({
      responseRecord: { collection: 'users', dataSourceKey: 'main', filterByTk: 7 },
    });
    expect(properties.responseRecord.resolveOnServer('department.name')).toBe(true);
  });

  it('shows responseRecord in the variable picker for settings context', () => {
    const engine = new FlowEngine();
    class SubmitActionModel extends FlowModel {}
    engine.registerModels({ SubmitActionModel });
    const model = engine.createModel<SubmitActionModel>({ use: 'SubmitActionModel' });
    const collection = {
      name: 'users',
      dataSourceKey: 'main',
      getFilterByTK: (record: { id?: number }) => record.id,
    } as unknown as Collection;
    model.context.defineProperty('collection', { value: collection });
    const flow = model.registerFlow({
      key: 'submitSettings',
      steps: {
        saveResource: { title: 'Save record', handler: () => undefined },
        afterSuccess: { use: 'afterSuccess' },
      },
    });
    const ctx = new FlowRuntimeContext(model, 'submitSettings', 'settings');
    setupRuntimeContextSteps(ctx, flow.steps, model, 'submitSettings');

    const metaTree = getMetaTreeWithResponseRecord(ctx);

    expect(metaTree.find((node) => node.name === 'responseRecord')?.title).toBe('Response record');
  });
});

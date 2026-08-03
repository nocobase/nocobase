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
import { defineClickedRowRecordVariable, TableBlockModel } from '../TableBlockModel';

describe('TableBlockModel record slots', () => {
  it('builds clickedRowRecord at the variable root', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableBlockModel });
    const dataSource = engine.dataSourceManager.getDataSource('main');
    dataSource.addCollection({
      name: 'departments',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', type: 'string', interface: 'input' },
      ],
    });
    dataSource.addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'department', type: 'belongsTo', target: 'departments', interface: 'm2o' },
      ],
    });
    const model = engine.createModel<TableBlockModel>({
      uid: 'posts-table',
      use: 'TableBlockModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'posts' } },
      },
    });

    defineClickedRowRecordVariable(model, { id: 7 });
    const options = model.context.getPropertyOptions('clickedRowRecord');
    const meta = await options.meta();
    const recordRef = await meta.buildVariablesParams(model.context);

    expect(model.context.buildServerContextParams({ clickedRowRecord: recordRef })).toEqual({
      clickedRowRecord: { collection: 'posts', dataSourceKey: 'main', filterByTk: 7 },
    });
    expect(options.resolveOnServer('department.name')).toBe(true);
    expect(options.serverOnlyWhenContextParams).toBe(true);
  });
});

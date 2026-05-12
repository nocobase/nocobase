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
import '@nocobase/client';
import { TableBlockModel } from '../TableBlockModel';

function createTableModel() {
  const engine = new FlowEngine();
  engine.registerModels({ TableBlockModel });

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'posts',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'title', type: 'string', interface: 'input' },
    ],
  });

  return engine.createModel<TableBlockModel>({
    uid: 'posts-table',
    use: 'TableBlockModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'posts',
        },
      },
    },
  });
}

describe('TableBlockModel rowClick event', () => {
  it('highlights the clicked row when selected is true', async () => {
    const model = createTableModel();
    const record = { id: 1, title: 'first post' };
    const rowClick = model.getEvent('rowClick');

    await rowClick?.handler({ model, inputArgs: { record, selected: true } } as any, {
      condition: { logic: '$and', items: [] },
    });

    expect(model.props.highlightedRowKey).toBe(1);
  });

  it('clears the highlighted row when selected is false', async () => {
    const model = createTableModel();
    const record = { id: 1, title: 'first post' };
    const rowClick = model.getEvent('rowClick');

    model.highlightRow(record);

    await rowClick?.handler({ model, inputArgs: { record, selected: false } } as any, {
      condition: { logic: '$and', items: [] },
    });

    expect(model.props.highlightedRowKey).toBeNull();
  });
});

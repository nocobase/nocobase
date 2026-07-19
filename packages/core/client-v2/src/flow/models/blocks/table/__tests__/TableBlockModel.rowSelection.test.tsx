/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import { FlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { BulkDeleteActionModel } from '../../../actions/BulkDeleteActionModel';
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
      { name: 'sort', type: 'sort', interface: 'sort' },
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

describe('TableBlockModel row selection setting', () => {
  it('keeps row selection enabled by default', () => {
    const model = createTableModel();

    expect(model.isRowSelectionEnabled()).toBe(true);

    model.setProps('enableRowSelection', false);

    expect(model.isRowSelectionEnabled()).toBe(false);
  });

  it('builds a standalone row-number column when row selection is disabled', () => {
    const model = createTableModel();
    model.resource.setPage(2);
    model.resource.setPageSize(20);
    model.setProps('enableRowSelection', false);
    model.setProps('showIndex', true);

    const column = model.getLeftAuxiliaryColumn();

    expect(column).toMatchObject({
      key: '__rowSelectionDisabledAuxiliary__',
      width: 50,
      align: 'center',
    });

    render(<>{column?.render(null, { id: 1, title: 'first post' }, 1)}</>);

    expect(screen.getByLabelText('table-index-22').textContent).toBe('22');
  });

  it('omits the standalone column when row selection and row numbers are both disabled', () => {
    const model = createTableModel();
    model.setProps('enableRowSelection', false);
    model.setProps('showIndex', false);

    expect(model.getLeftAuxiliaryColumn()).toBeNull();
  });

  it('keeps a standalone drag handle column without row selection checkboxes', () => {
    const model = createTableModel();
    model.setProps('enableRowSelection', false);
    model.setProps('showIndex', false);
    model.setProps('dragSort', true);
    model.setProps('dragSortBy', 'sort');

    expect(model.getLeftAuxiliaryColumn()).toMatchObject({
      key: '__rowSelectionDisabledAuxiliary__',
      width: 74,
      align: 'center',
    });
  });

  it('hides bulk delete in runtime when row selection is disabled', () => {
    const model = createTableModel();
    const bulkDelete = new BulkDeleteActionModel({
      uid: 'bulk-delete',
      use: 'BulkDeleteActionModel',
      flowEngine: model.flowEngine,
    });

    expect(model.shouldRenderAction(bulkDelete, false)).toBe(true);

    model.setProps('enableRowSelection', false);

    expect(model.shouldRenderAction(bulkDelete, false)).toBe(false);
    expect(model.shouldRenderAction(bulkDelete, true)).toBe(true);
  });
});

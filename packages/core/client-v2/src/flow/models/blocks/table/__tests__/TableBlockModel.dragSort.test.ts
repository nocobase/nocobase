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
import { initDragSortParams } from '../dragSort';
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

describe('TableBlockModel drag sorting settings', () => {
  it('does not keep a deleted drag sort field in resource sort', () => {
    const model = createTableModel();

    model.setProps('dragSort', true);
    model.setProps('dragSortBy', 'sort');
    model.setProps('globalSort', ['title']);
    model.resource.setSort(['sort']);
    model.collection.fields.delete('sort');

    initDragSortParams(model);

    expect(model.getDragSortFieldName()).toBeUndefined();
    expect(model.resource.getSort()).toEqual(['title']);
  });

  it('hides the drag handle when the configured sort field was deleted', () => {
    const model = createTableModel();

    model.setProps('enableRowSelection', false);
    model.setProps('showIndex', false);
    model.setProps('dragSort', true);
    model.setProps('dragSortBy', 'sort');
    model.collection.fields.delete('sort');

    expect(model.getLeftAuxiliaryColumn()).toBeNull();
  });

  it('allows clearing the configured drag sort field and restores default sorting', () => {
    const model = createTableModel();
    const dragSortByStep = model.getFlow('tableSettings')?.steps?.dragSortBy;

    model.setProps('dragSort', true);
    model.setProps('dragSortBy', 'sort');
    model.setProps('globalSort', ['title']);
    model.resource.setSort(['sort']);

    const uiMode =
      typeof dragSortByStep?.uiMode === 'function' ? dragSortByStep.uiMode({ model, t: (key: string) => key }) : null;
    dragSortByStep?.handler({ model }, { dragSortBy: null });

    expect(uiMode).toMatchObject({
      type: 'select',
      key: 'dragSortBy',
      props: {
        allowClear: true,
      },
    });
    expect(model.props.dragSortBy).toBeNull();
    expect(model.resource.getSort()).toEqual(['title']);
  });

  it('ignores a deleted drag sort field submitted by settings', () => {
    const model = createTableModel();
    const dragSortByStep = model.getFlow('tableSettings')?.steps?.dragSortBy;

    model.setProps('dragSort', true);
    model.setProps('dragSortBy', 'sort');
    model.setProps('globalSort', ['title']);
    model.resource.setSort(['sort']);
    model.collection.fields.delete('sort');

    dragSortByStep?.handler({ model }, { dragSortBy: 'sort' });

    expect(model.props.dragSortBy).toBeNull();
    expect(model.resource.getSort()).toEqual(['title']);
  });

  it('restores default sorting when drag sorting is disabled', () => {
    const model = createTableModel();
    const dragSortStep = model.getFlow('tableSettings')?.steps?.dragSort;

    model.setProps('dragSort', true);
    model.setProps('dragSortBy', 'sort');
    model.setProps('globalSort', ['title']);
    model.resource.setSort(['sort']);

    dragSortStep?.handler({ model }, { dragSort: false });

    expect(model.props.dragSort).toBe(false);
    expect(model.resource.getSort()).toEqual(['title']);
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { FlowContextProvider, FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { TableBlockModel } from '../TableBlockModel';

vi.mock('../../../../components/ConditionBuilder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../components/ConditionBuilder')>();
  return { ...actual, ConditionBuilder: () => null };
});

describe('TableBlockModel clicked row record metadata', () => {
  it.each(['table', 'reference'] as const)('exposes record fields when editing a %s block event', async (kind) => {
    const engine = new FlowEngine();
    engine.registerModels({ TableBlockModel });
    engine.dataSourceManager.getDataSource('main').addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'title', type: 'string', interface: 'input' },
      ],
    });
    const table = engine.createModel<TableBlockModel>({
      uid: 'posts-table',
      use: 'TableBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'posts' } } },
    });
    // Reference blocks expose the target collection through context, without a model.collection getter.
    const model = kind === 'table' ? table : engine.createModel({ uid: 'reference', use: 'FlowModel' });
    if (kind === 'reference') {
      model.context.defineProperty('collection', { get: () => table.context.collection });
    }
    const Condition = table.getEvent('rowClick')?.uiSchema?.condition['x-component'] as React.ComponentType;
    const view = render(
      <FlowContextProvider context={model.context}>
        <Condition />
      </FlowContextProvider>,
    );
    try {
      const record = model.context.getPropertyMetaTree().find((node) => node.name === 'clickedRowRecord');
      const fields = typeof record?.children === 'function' ? await record.children() : record?.children;
      expect(fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'id', paths: ['clickedRowRecord', 'id'] }),
          expect.objectContaining({ name: 'title', paths: ['clickedRowRecord', 'title'] }),
        ]),
      );
    } finally {
      view.unmount();
    }
    expect(model.context.getPropertyOptions('clickedRowRecord')?.meta).toBeUndefined();
  });
});

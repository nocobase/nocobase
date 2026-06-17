/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render } from '@nocobase/test/client';
import { FlowEngine, type FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { PopupSubTableFieldModel } from '../../PopupSubTableFieldModel';
import { SubTableFieldModel } from '..';

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  useTranslation: () => ({
    t: (value: string) => value,
  }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<any>('antd');
  return {
    ...actual,
    Table: ({ dataSource = [], columns = [] }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'subtable' },
        dataSource.map((record: any, rowIdx: number) =>
          React.createElement(
            'div',
            { 'data-testid': `row-${rowIdx}`, key: record.__index__ || rowIdx },
            columns.map((column: any) =>
              React.createElement(
                'div',
                { 'data-testid': `cell-${rowIdx}-${String(column.dataIndex || column.key)}`, key: column.key },
                column.render?.(record[column.dataIndex], record, rowIdx),
              ),
            ),
          ),
        ),
      ),
  };
});

function createSubTableFieldModel(props: Record<string, unknown> = {}) {
  const engine = new FlowEngine();
  engine.registerModels({ SubTableFieldModel });
  const setFieldValue = vi.fn();

  const blockModel = engine.createModel<FlowModel>({
    use: 'FlowModel',
    uid: 'form-block',
  });
  (blockModel as FlowModel & { setFieldValue: typeof setFieldValue }).setFieldValue = setFieldValue;
  const parent = engine.createModel<FlowModel>({
    use: 'FlowModel',
    uid: 'form-item',
  });

  parent.context.defineProperty('blockModel', { value: blockModel });
  parent.context.defineProperty('collectionField', {
    value: {
      target: 'roles',
      targetCollection: {
        filterTargetKey: 'id',
      },
    },
  });
  parent.context.defineProperty('fieldPathArray', { value: ['roles'] });

  const model = engine.createModel<SubTableFieldModel>({
    use: 'SubTableFieldModel',
    uid: 'roles-subtable',
    parentId: parent.uid,
    props,
  });

  return { blockModel, model, setFieldValue };
}

async function createPopupSubTableFieldModel(props: Record<string, unknown> = {}) {
  const engine = new FlowEngine();
  engine.registerModels({ PopupSubTableFieldModel });
  const setFieldValue = vi.fn();

  const blockModel = engine.createModel<FlowModel>({
    use: 'FlowModel',
    uid: 'popup-form-block',
  });
  (blockModel as FlowModel & { setFieldValue: typeof setFieldValue }).setFieldValue = setFieldValue;
  const parent = engine.createModel<FlowModel>({
    use: 'FlowModel',
    uid: 'popup-form-item',
  });

  parent.context.defineProperty('blockModel', { value: blockModel });
  parent.context.defineProperty('collectionField', {
    value: {
      target: 'roles',
      targetCollection: {
        filterTargetKey: 'id',
      },
    },
  });
  parent.context.defineProperty('fieldPathArray', { value: ['roles'] });

  const model = engine.createModel<PopupSubTableFieldModel>({
    use: 'PopupSubTableFieldModel',
    uid: 'roles-popup-subtable',
    parentId: parent.uid,
    props,
  });
  (model.subModels as Record<string, unknown>).subTableColumns = [];
  await model.onDispatchEventStart('beforeRender');

  return { blockModel, model, setFieldValue };
}

describe('SubTable field reset', () => {
  it('resets the rendered fork through its own form field path', () => {
    const onChange = vi.fn();
    const { blockModel, model, setFieldValue } = createSubTableFieldModel({
      onChange,
      value: [{ id: 1 }],
    });
    const fork = model.createFork({ value: [{ id: 1 }] }, 'orders.0.lines');
    fork.context.defineProperty('fieldPathArray', { value: ['orders', 0, 'lines'] });

    render(React.createElement(React.Fragment, null, fork.render()));

    act(() => {
      blockModel.emitter.emit('onFieldReset');
    });

    expect(fork.props.value).toEqual([]);
    expect(setFieldValue).toHaveBeenCalledWith(['orders', 0, 'lines'], []);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('resets the non-forked model through the parent form field path', () => {
    const onChange = vi.fn();
    const { blockModel, model, setFieldValue } = createSubTableFieldModel({
      onChange,
      value: [{ id: 1 }],
    });

    render(React.createElement(React.Fragment, null, model.render()));

    act(() => {
      blockModel.emitter.emit('onFieldReset');
    });

    expect(model.props.value).toEqual([]);
    expect(setFieldValue).toHaveBeenCalledWith(['roles'], []);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('resets popup sub-table form values without relying on onChange', async () => {
    const onChange = vi.fn();
    const { blockModel, model, setFieldValue } = await createPopupSubTableFieldModel({
      onChange,
      value: [{ id: 1 }],
    });

    render(React.createElement(React.Fragment, null, model.render()));

    act(() => {
      blockModel.emitter.emit('onFieldReset');
    });

    expect(model.props.value).toEqual([]);
    expect(setFieldValue).toHaveBeenCalledWith(['roles'], []);
    expect(onChange).not.toHaveBeenCalled();
  });
});

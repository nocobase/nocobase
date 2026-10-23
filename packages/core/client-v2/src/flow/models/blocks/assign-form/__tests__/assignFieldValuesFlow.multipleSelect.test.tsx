/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App, ConfigProvider } from 'antd';
import { describe, expect, it } from 'vitest';
import { render, waitFor } from '@nocobase/test/client';
import {
  FlowEngine,
  FlowEngineProvider,
  FlowRuntimeContext,
  FlowSettingsContextProvider,
  type FlowModel,
  type IFlowModelRepository,
} from '@nocobase/flow-engine';
import { AssignFormGridModel } from '../AssignFormGridModel';
import { AssignFormItemModel } from '../AssignFormItemModel';
import { AssignFormModel } from '../AssignFormModel';
import { createAssignFieldValuesStep } from '../assignFieldValuesFlow';
import { InputFieldModel } from '../../../fields/InputFieldModel';
import { SelectFieldModel } from '../../../fields/SelectFieldModel';
import { VariableFieldFormModel } from '../../../fields/VariableFieldFormModel';

class MockFlowModelRepository implements IFlowModelRepository {
  async findOne(): Promise<Record<string, any> | null> {
    return null;
  }

  async save(model: FlowModel): Promise<Record<string, any>> {
    return { uid: model.uid };
  }

  async destroy(): Promise<boolean> {
    return true;
  }

  async move(): Promise<void> {}

  async duplicate(): Promise<Record<string, any> | null> {
    return null;
  }
}

function createEngine() {
  const engine = new FlowEngine();
  engine.setModelRepository(new MockFlowModelRepository());
  engine.registerModels({
    AssignFormModel,
    AssignFormGridModel,
    AssignFormItemModel,
    InputFieldModel,
    SelectFieldModel,
    VariableFieldFormModel,
  });
  engine.context.defineProperty('location', { value: { search: '' } });
  engine.context.defineProperty('themeToken', { value: { marginLG: 24 } });
  return engine;
}

function addMultipleSelectCollection(engine: FlowEngine) {
  const dsm = engine.context.dataSourceManager;
  const main = dsm.getDataSource('main');
  main.addCollection({
    name: 'assign_multiple_select',
    fields: [
      {
        name: 'tags',
        type: 'array',
        interface: 'multipleSelect',
        uiSchema: {
          type: 'array',
          'x-component': 'Select',
          'x-component-props': { mode: 'multiple' },
          enum: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      },
      {
        // Fields created before the interface default was persisted may miss `mode`.
        name: 'legacyTags',
        type: 'array',
        interface: 'multipleSelect',
        uiSchema: {
          type: 'array',
          'x-component': 'Select',
          enum: [{ value: 'c', label: 'C' }],
        },
      },
      {
        name: 'tagMode',
        type: 'array',
        interface: 'multipleSelect',
        uiSchema: {
          type: 'array',
          'x-component': 'Select',
          'x-component-props': { mode: 'tags' },
          enum: [{ value: 't', label: 'T' }],
        },
      },
      {
        name: 'single',
        type: 'string',
        interface: 'select',
        uiSchema: {
          type: 'string',
          'x-component': 'Select',
          enum: [{ value: 'x', label: 'X' }],
        },
      },
      { name: 'nickname', type: 'string', interface: 'input' },
    ],
  });
  return dsm.getCollection('main', 'assign_multiple_select');
}

async function renderAssignEditor(engine: FlowEngine, action: FlowModel) {
  const step = createAssignFieldValuesStep({ settingsFlowKey: 'assignSettings' });
  const Editor = step.uiSchema().editor?.['x-component'] as React.ComponentType;
  const flowSettingsCtx = new FlowRuntimeContext(action as any, 'assignSettings', 'settings');

  render(
    <FlowEngineProvider engine={engine}>
      <ConfigProvider>
        <App>
          <FlowSettingsContextProvider value={flowSettingsCtx}>
            <Editor />
          </FlowSettingsContextProvider>
        </App>
      </ConfigProvider>
    </FlowEngineProvider>,
  );
}

describe('assignFieldValuesFlow multipleSelect', () => {
  it('renders multipleSelect as multi select and normalizes historical scalar values', async () => {
    const engine = createEngine();
    const collection = addMultipleSelectCollection(engine);

    const action = engine.createModel({ use: 'FlowModel', uid: 'act-assign-multiple-select' });
    action.setStepParams('assignSettings', 'assignFieldValues', {
      assignedValues: {
        tags: 'a',
        legacyTags: 'c',
        tagMode: 't',
        single: 'x',
        nickname: 'hello',
      },
    });
    action.context.defineProperty('blockModel', { value: { collection } });

    const tempFields: any[] = [];
    const originalCreateModel = engine.createModel.bind(engine);
    (engine as any).createModel = (options: any) => {
      const model = originalCreateModel(options);
      if (options?.use === 'VariableFieldFormModel') {
        tempFields.push(model);
      }
      return model;
    };

    await renderAssignEditor(engine, action);

    await waitFor(() => {
      const form = engine.findModelByParentId<AssignFormModel>(action.uid, 'assignForm');
      expect(form?.subModels.grid.subModels.items || []).toHaveLength(5);
    });

    const form = engine.findModelByParentId<AssignFormModel>(action.uid, 'assignForm');
    await waitFor(() => {
      expect(form?.getAssignedValues()).toEqual({
        tags: ['a'],
        legacyTags: ['c'],
        tagMode: ['t'],
        single: 'x',
        nickname: 'hello',
      });
    });

    await waitFor(() => {
      // All three multipleSelect fields must render as antd multi select, including the
      // field without schema `mode`; the normal select stays single.
      expect(document.querySelectorAll('.ant-select-multiple')).toHaveLength(3);
      expect(document.querySelectorAll('.ant-select-single').length).toBeGreaterThanOrEqual(1);
    });

    const findTempField = (fieldPath: string) =>
      tempFields
        .map((root) => root?.subModels?.fields?.[0])
        .find((field) => field?.getStepParams?.('fieldSettings', 'init')?.fieldPath === fieldPath);
    await waitFor(() => {
      expect(findTempField('tags')?.props?.onChange).toBeTypeOf('function');
      expect(findTempField('tags')?.props?.mode).toBe('multiple');
      expect(findTempField('legacyTags')?.props?.mode).toBe('multiple');
      // An explicit schema mode must be preserved by the fallback.
      expect(findTempField('tagMode')?.props?.mode).toBe('tags');
    });

    findTempField('tags').props.onChange(['a', 'b']);
    await waitFor(() => {
      expect(form?.getAssignedValues()).toMatchObject({ tags: ['a', 'b'], single: 'x' });
    });

    findTempField('tags').props.onChange('');
    await waitFor(() => {
      expect(form?.getAssignedValues()).toMatchObject({ tags: [] });
    });
  });
});

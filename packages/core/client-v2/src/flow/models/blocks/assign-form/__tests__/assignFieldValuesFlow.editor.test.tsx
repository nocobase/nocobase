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
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
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

describe('assignFieldValuesFlow (editor)', () => {
  it('shows the deleted-field placeholder for a stale assigned value', async () => {
    const engine = new FlowEngine();
    engine.setModelRepository(new MockFlowModelRepository());
    engine.registerModels({
      AssignFormModel,
      AssignFormGridModel,
      AssignFormItemModel,
      InputFieldModel,
      VariableFieldFormModel,
    });
    engine.context.defineProperty('location', { value: { search: '' } });
    engine.context.defineProperty('themeToken', { value: { marginLG: 24 } });
    engine.context.defineProperty('flowSettingsEnabled', { value: true });

    const main = engine.context.dataSourceManager.getDataSource('main');
    main.addCollection({
      name: 'users',
      fields: [{ name: 'nickname', type: 'string', interface: 'input' }],
    });
    const users = engine.context.dataSourceManager.getCollection('main', 'users');

    const action = engine.createModel({
      use: 'FlowModel',
      uid: 'act-assign-deleted-field',
    });
    action.setStepParams('assignSettings', 'assignFieldValues', {
      assignedValues: { deletedField: 'stale value' },
    });
    action.context.defineProperty('blockModel', { value: { collection: users } });

    const step = createAssignFieldValuesStep({ settingsFlowKey: 'assignSettings' });
    const Editor = step.uiSchema().editor?.['x-component'] as React.ComponentType;
    const flowSettingsCtx = new FlowRuntimeContext(action, 'assignSettings', 'settings');

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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Fields/ })).toBeInTheDocument();
      expect(screen.getByText(/deletedField.*may have been deleted/)).toBeInTheDocument();
      const form = engine.findModelByParentId<AssignFormModel>(action.uid, 'assignForm');
      expect(form).toBeDefined();
      expect(form?.subModels.grid.subModels.items || []).toHaveLength(1);
      expect(form?.getAssignedValues()).toEqual({});
    });
  });

  it('shows the standard deleted-field placeholder for a persisted assigned field model', async () => {
    const engine = new FlowEngine();
    engine.setModelRepository(new MockFlowModelRepository());
    engine.registerModels({
      AssignFormModel,
      AssignFormGridModel,
      AssignFormItemModel,
      InputFieldModel,
      VariableFieldFormModel,
    });
    engine.context.defineProperty('location', { value: { search: '' } });
    engine.context.defineProperty('themeToken', { value: { marginLG: 24 } });
    engine.context.defineProperty('flowSettingsEnabled', { value: true });

    const main = engine.context.dataSourceManager.getDataSource('main');
    main.addCollection({
      name: 'users',
      fields: [{ name: 'nickname', type: 'string', interface: 'input' }],
    });
    const users = engine.context.dataSourceManager.getCollection('main', 'users');

    const action = engine.createModel({
      use: 'FlowModel',
      uid: 'act-assign-persisted-deleted-field',
    });
    action.setStepParams('assignSettings', 'assignFieldValues', {
      assignedValues: { deletedField: 'stale value' },
    });
    action.context.defineProperty('blockModel', { value: { collection: users } });

    const form = engine.createModel<AssignFormModel>({
      use: 'AssignFormModel',
      uid: 'form-assign-persisted-deleted-field',
      parentId: action.uid,
      subKey: 'assignForm',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
    });
    action.setSubModel('assignForm', form);
    form.subModels.grid.addSubModel('items', {
      use: 'AssignFormItemModel',
      uid: 'item-assign-persisted-deleted-field',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'deletedField',
          },
          assignValue: { value: 'stale value' },
        },
      },
    });
    form.subModels.grid.resetRows(true);

    const step = createAssignFieldValuesStep({ settingsFlowKey: 'assignSettings' });
    const Editor = step.uiSchema().editor?.['x-component'] as React.ComponentType;
    const flowSettingsCtx = new FlowRuntimeContext(action, 'assignSettings', 'settings');

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

    await waitFor(() => {
      expect(screen.getByText(/deletedField.*may have been deleted/)).toBeInTheDocument();
      expect(form.subModels.grid.subModels.items).toHaveLength(1);
      expect(form.getAssignedValues()).toEqual({});
    });
  });

  it('repairs AssignFormModel resource init and clears cached collection', async () => {
    const engine = new FlowEngine();
    engine.setModelRepository(new MockFlowModelRepository());
    engine.registerModels({
      AssignFormModel,
      AssignFormGridModel,
      AssignFormItemModel,
      InputFieldModel,
      VariableFieldFormModel,
    });
    engine.context.defineProperty('location', { value: { search: '' } });
    engine.context.defineProperty('themeToken', { value: { marginLG: 24 } });

    const dsm = engine.context.dataSourceManager;
    const main = dsm.getDataSource('main');
    main.addCollection({
      name: 'users',
      fields: [{ name: 'nickname', type: 'string', interface: 'input' }],
    });
    const users = dsm.getCollection('main', 'users');
    expect(users?.name).toBe('users');

    const action = engine.createModel({
      use: 'FlowModel',
      uid: 'act-assign',
    });
    action.setStepParams('assignSettings', 'assignFieldValues', { assignedValues: { nickname: '1111' } });

    const existing = engine.createModel<AssignFormModel>({
      use: 'AssignFormModel',
      uid: 'form-assign',
      parentId: action.uid,
      subKey: 'assignForm',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'missing',
          },
        },
      },
    });
    expect(existing.context.collection).toBeUndefined();

    action.context.defineProperty('blockModel', { value: { collection: users } });

    const step = createAssignFieldValuesStep({ settingsFlowKey: 'assignSettings' });
    const schema = step.uiSchema();
    const Editor = schema.editor?.['x-component'] as React.ComponentType;
    expect(Editor).toBeTypeOf('function');

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

    await waitFor(() => {
      const form = engine.findModelByParentId<AssignFormModel>(action.uid, 'assignForm');
      expect(form?.getStepParams('resourceSettings', 'init')).toEqual({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expect(form?.context.collection?.name).toBe('users');
      expect(form?.context.collection?.getFields?.().length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getByText('nickname')).toBeInTheDocument();
      const form = engine.findModelByParentId<AssignFormModel>(action.uid, 'assignForm');
      expect(form?.subModels.grid.subModels.items.length).toBe(1);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('1111')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('1111') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '2222');

    await waitFor(() => {
      const form = engine.findModelByParentId<AssignFormModel>(action.uid, 'assignForm');
      expect(form?.getAssignedValues()).toEqual({ nickname: '2222' });
    });
  });

  it('does not clear delegated parent resource cache when repairing AssignFormModel init', async () => {
    const engine = new FlowEngine();
    engine.setModelRepository(new MockFlowModelRepository());
    engine.registerModels({ AssignFormModel, AssignFormGridModel, AssignFormItemModel, InputFieldModel });
    engine.context.defineProperty('location', { value: { search: '' } });
    engine.context.defineProperty('themeToken', { value: { marginLG: 24 } });

    const dsm = engine.context.dataSourceManager;
    const main = dsm.getDataSource('main');
    main.addCollection({
      name: 'users',
      fields: [{ name: 'nickname', type: 'string', interface: 'input' }],
    });
    const users = dsm.getCollection('main', 'users');

    const action = engine.createModel({
      use: 'FlowModel',
      uid: 'act-assign-parent-resource',
    });

    let resourceCreateCount = 0;
    action.context.defineProperty('resource', {
      get: () => ({ id: ++resourceCreateCount }),
    });
    const cachedResource = action.context.resource;

    engine.createModel<AssignFormModel>({
      use: 'AssignFormModel',
      uid: 'form-assign-parent-resource',
      parentId: action.uid,
      subKey: 'assignForm',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'missing',
          },
        },
      },
    });

    action.context.defineProperty('blockModel', { value: { collection: users } });

    const step = createAssignFieldValuesStep({ settingsFlowKey: 'assignSettings' });
    const schema = step.uiSchema();
    const Editor = schema.editor?.['x-component'] as React.ComponentType;
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

    await waitFor(() => {
      const form = engine.findModelByParentId<AssignFormModel>(action.uid, 'assignForm');
      expect(form?.getStepParams('resourceSettings', 'init')).toEqual({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
    });

    expect(action.context.resource).toBe(cachedResource);
    expect(resourceCreateCount).toBe(1);
  });
});

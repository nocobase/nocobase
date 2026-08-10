/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@nocobase/test/client';
import { FlowContext } from '@nocobase/flow-engine';
import { FieldAssignValueInput } from '../FieldAssignValueInput';

const { mockUseFlowContext, mockGetDefaultBindingByField, mockVariableInput } = vi.hoisted(() => ({
  mockUseFlowContext: vi.fn(),
  mockGetDefaultBindingByField: vi.fn(),
  mockVariableInput: vi.fn(() => <div data-testid="variable-input" />),
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  class MockEditableItemModel extends actual.EditableItemModel {}
  MockEditableItemModel.getDefaultBindingByField = mockGetDefaultBindingByField;

  return {
    ...actual,
    useFlowContext: () => mockUseFlowContext(),
    VariableInput: mockVariableInput,
    FlowModelRenderer: () => <div data-testid="flow-model-renderer" />,
    EditableItemModel: MockEditableItemModel,
  };
});

describe('FieldAssignValueInput context', () => {
  it('delegates temporary field model context to the source form context', async () => {
    type MockContext = {
      dataSourceManager: { getDataSource: ReturnType<typeof vi.fn> };
      t: (key: string) => string;
      engine?: { createModel: ReturnType<typeof vi.fn> };
      collection?: MockCollection;
      blockModel?: MockFormModel;
    };
    type MockFieldModel = {
      props: Record<string, unknown>;
      setProps: ReturnType<typeof vi.fn>;
      dispatchEvent: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    };
    type MockCollectionField = {
      name: string;
      interface: string;
      uiSchema: { enum: Array<{ label: string; value: string }> };
      isAssociationField: () => boolean;
      getComponentProps: () => Record<string, unknown>;
    };
    type MockCollection = {
      dataSourceKey: string;
      name: string;
      getField: (name: string) => MockCollectionField | null;
      getFields: () => MockCollectionField[];
    };
    type MockFormModel = {
      context: MockContext;
      collection: MockCollection;
      subModels: Record<string, unknown>;
    };

    const sourceContext: MockContext = {
      dataSourceManager: {
        getDataSource: vi.fn(() => ({})),
      },
      t: (key: string) => key,
    };
    const fieldModel: MockFieldModel = {
      props: {},
      setProps: vi.fn((props: Record<string, unknown>) => {
        fieldModel.props = { ...fieldModel.props, ...props };
      }),
      dispatchEvent: vi.fn(),
      remove: vi.fn(),
    };
    const tempRoot = {
      context: {
        defineProperty: vi.fn(),
      },
      subModels: {
        fields: [fieldModel],
      },
      setProps: vi.fn(),
      remove: vi.fn(),
    };
    const engine = {
      createModel: vi.fn((_options: unknown, _extra?: { delegate?: unknown }) => tempRoot),
    };
    sourceContext.engine = engine;

    const collectionField: MockCollectionField = {
      name: 'status',
      interface: 'select',
      uiSchema: {
        enum: [{ label: 'Open', value: 'open' }],
      },
      isAssociationField: () => false,
      getComponentProps: () => ({}),
    };
    const collection: MockCollection = {
      dataSourceKey: 'main',
      name: 'tasks',
      getField: (name: string) => (name === 'status' ? collectionField : null),
      getFields: () => [collectionField],
    };
    const formModel: MockFormModel = {
      context: sourceContext,
      collection,
      subModels: {},
    };
    sourceContext.collection = collection;
    sourceContext.blockModel = formModel;

    mockGetDefaultBindingByField.mockReturnValue({ modelName: 'SelectFieldModel' });
    mockUseFlowContext.mockReturnValue({
      model: formModel,
      t: (key: string) => key,
      getPropertyMetaTree: vi.fn(async () => []),
    });

    render(<FieldAssignValueInput targetPath="status" value="" onChange={vi.fn()} />);

    await waitFor(() => {
      expect(engine.createModel).toHaveBeenCalled();
    });
    expect(engine.createModel).toHaveBeenCalledWith(expect.any(Object), { delegate: sourceContext });
  });

  it('uses the flow model context when a configured item model has no context', async () => {
    mockGetDefaultBindingByField.mockClear();
    mockVariableInput.mockClear();

    const collectionField = {
      name: 'status',
      interface: 'input',
      uiSchema: { 'x-component': 'Input' },
      isAssociationField: () => false,
      getComponentProps: () => ({}),
    };
    const flowCollection = {
      dataSourceKey: 'flow-main',
      name: 'flow_tasks',
      getField: (name: string) => (name === 'status' ? collectionField : null),
      getFields: () => [collectionField],
    };
    const rootFallbackCollection = {
      dataSourceKey: 'root-main',
      name: 'root_tasks',
      getField: vi.fn(() => null),
      getFields: () => [],
    };
    const flowDataSource = { key: 'flow-data-source' };
    const flowBlockModel = { resource: { name: 'flow-resource' } };
    const flowDataSourceManager = {
      getCollection: vi.fn(),
      getDataSource: vi.fn(() => ({ key: 'manager-data-source' })),
    };
    const fieldModel = {
      props: {},
      setProps: vi.fn(),
      dispatchEvent: vi.fn(),
      remove: vi.fn(),
    };
    const tempRoot = {
      context: {
        defineProperty: vi.fn(),
      },
      subModels: {
        fields: [fieldModel],
      },
      setProps: vi.fn(),
      remove: vi.fn(),
    };
    const engine = {
      createModel: vi.fn((_options: unknown, _extra?: { delegate?: unknown }) => tempRoot),
    };
    const itemModel = {
      context: undefined,
      subModels: {},
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'status' };
        }
        return undefined;
      }),
    };
    const flowSourceContext = {
      collection: flowCollection,
      dataSource: flowDataSource,
      blockModel: flowBlockModel,
      dataSourceManager: flowDataSourceManager,
      engine,
      t: (key: string) => key,
    };
    const formModel = {
      context: flowSourceContext,
      collection: rootFallbackCollection,
      subModels: {
        grid: {
          subModels: {
            items: [itemModel],
          },
        },
      },
    };

    mockGetDefaultBindingByField.mockReturnValue({ modelName: 'InputFieldModel' });
    mockUseFlowContext.mockReturnValue({
      model: formModel,
      t: (key: string) => key,
      getPropertyMetaTree: vi.fn(async () => []),
    });

    render(<FieldAssignValueInput targetPath="status" value="" onChange={vi.fn()} />);

    await waitFor(() => {
      expect(engine.createModel).toHaveBeenCalled();
    });
    expect(engine.createModel.mock.calls[0][1]).toEqual({ delegate: flowSourceContext });
    expect(mockGetDefaultBindingByField).toHaveBeenLastCalledWith(flowSourceContext, collectionField);
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('collection', { value: flowCollection });
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('dataSource', { value: flowDataSource });
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('collectionField', { value: collectionField });
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('blockModel', { value: flowBlockModel });
    expect(rootFallbackCollection.getField).not.toHaveBeenCalled();
    expect(mockVariableInput).toHaveBeenCalled();
  });

  it('preserves item context values and fills each missing value from the flow model context', async () => {
    mockGetDefaultBindingByField.mockClear();
    mockVariableInput.mockClear();

    const itemCollectionField = {
      name: 'status',
      interface: 'input',
      uiSchema: { 'x-component': 'Input' },
      isAssociationField: () => false,
      getComponentProps: () => ({}),
    };
    const flowCollectionField = {
      ...itemCollectionField,
      name: 'flowStatus',
    };
    const itemCollection = {
      dataSourceKey: 'item-main',
      name: 'item_tasks',
      getField: (name: string) => (name === 'status' ? itemCollectionField : null),
      getFields: () => [itemCollectionField],
    };
    const flowCollection = {
      dataSourceKey: 'flow-main',
      name: 'flow_tasks',
      getField: (name: string) => (name === 'status' ? flowCollectionField : null),
      getFields: () => [flowCollectionField],
    };
    const flowDataSource = { key: 'flow-data-source' };
    const flowBlockModel = { resource: { name: 'flow-resource' } };
    const itemDataSourceManager = {
      getCollection: vi.fn(),
      getDataSource: vi.fn(),
    };
    const flowDataSourceManager = {
      getCollection: vi.fn(),
      getDataSource: vi.fn(),
    };
    const fieldModel = {
      props: {},
      setProps: vi.fn(),
      dispatchEvent: vi.fn(),
      remove: vi.fn(),
    };
    const tempRoot = {
      context: {
        defineProperty: vi.fn(),
      },
      subModels: {
        fields: [fieldModel],
      },
      setProps: vi.fn(),
      remove: vi.fn(),
    };
    const engine = {
      createModel: vi.fn((_options: unknown, _extra?: { delegate?: unknown }) => tempRoot),
    };
    const flowSourceContext = new FlowContext();
    flowSourceContext.defineProperty('collection', { value: flowCollection });
    flowSourceContext.defineProperty('dataSource', { value: flowDataSource });
    flowSourceContext.defineProperty('blockModel', { value: flowBlockModel });
    flowSourceContext.defineProperty('dataSourceManager', { value: flowDataSourceManager });
    flowSourceContext.defineProperty('engine', { value: engine });
    const itemSourceContext = new FlowContext();
    itemSourceContext.defineProperty('collection', { value: itemCollection });
    itemSourceContext.defineProperty('dataSourceManager', { value: itemDataSourceManager });
    const itemModel = {
      context: itemSourceContext,
      subModels: {},
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'status' };
        }
        return undefined;
      }),
    };
    const formModel = {
      context: flowSourceContext,
      collection: flowCollection,
      subModels: {
        grid: {
          subModels: {
            items: [itemModel],
          },
        },
      },
    };

    mockGetDefaultBindingByField.mockReturnValue({ modelName: 'InputFieldModel' });
    mockUseFlowContext.mockReturnValue({
      model: formModel,
      t: (key: string) => key,
      getPropertyMetaTree: vi.fn(async () => []),
    });

    render(<FieldAssignValueInput targetPath="status" value="" onChange={vi.fn()} />);

    await waitFor(() => {
      expect(engine.createModel).toHaveBeenCalled();
    });
    const sourceContext = engine.createModel.mock.calls[0][1]?.delegate;
    expect(sourceContext).toBeInstanceOf(FlowContext);
    expect(sourceContext.collection).toBe(itemCollection);
    expect(sourceContext.dataSource).toBe(flowDataSource);
    expect(sourceContext.blockModel).toBe(flowBlockModel);
    expect(sourceContext.dataSourceManager).toBe(itemDataSourceManager);
    expect(mockGetDefaultBindingByField).toHaveBeenLastCalledWith(sourceContext, itemCollectionField);
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('collection', { value: itemCollection });
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('dataSource', { value: flowDataSource });
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('collectionField', { value: itemCollectionField });
    expect(tempRoot.context.defineProperty).toHaveBeenCalledWith('blockModel', { value: flowBlockModel });
    expect(mockVariableInput).toHaveBeenCalled();
  });

  it('lets callers override variable path parsing for domain-specific stored formats', async () => {
    mockVariableInput.mockClear();
    const sourceContext = {
      dataSourceManager: {
        getDataSource: vi.fn(() => ({})),
      },
      t: (key: string) => key,
    };
    const fieldModel = {
      props: {},
      setProps: vi.fn(),
      dispatchEvent: vi.fn(),
      remove: vi.fn(),
    };
    const tempRoot = {
      context: {
        defineProperty: vi.fn(),
      },
      subModels: {
        fields: [fieldModel],
      },
      setProps: vi.fn(),
      remove: vi.fn(),
    };
    const engine = {
      createModel: vi.fn((_options: unknown, _extra?: { delegate?: unknown }) => tempRoot),
    };
    const collectionField = {
      name: 'status',
      interface: 'input',
      uiSchema: { 'x-component': 'Input' },
      isAssociationField: () => false,
      getComponentProps: () => ({}),
    };
    const collection = {
      dataSourceKey: 'main',
      name: 'tasks',
      getField: (name: string) => (name === 'status' ? collectionField : null),
      getFields: () => [collectionField],
    };
    const formModel = {
      context: { ...sourceContext, engine, collection, blockModel: null as any },
      collection,
      subModels: {},
    };
    formModel.context.blockModel = formModel;

    mockGetDefaultBindingByField.mockReturnValue({ modelName: 'InputFieldModel' });
    mockUseFlowContext.mockReturnValue({
      model: formModel,
      t: (key: string) => key,
      getPropertyMetaTree: vi.fn(async () => []),
    });

    const variableConverters = {
      resolvePathFromValue: vi.fn((value: string) =>
        value === '{{$context.data.updatedAt}}' ? ['$context', 'data', 'updatedAt'] : undefined,
      ),
      resolveValueFromPath: vi.fn(() => undefined),
    };

    render(
      <FieldAssignValueInput
        targetPath="status"
        value="{{$context.data.updatedAt}}"
        onChange={vi.fn()}
        variableConverters={variableConverters}
      />,
    );

    await waitFor(() => {
      expect(engine.createModel).toHaveBeenCalled();
    });
    const latestVariableInputCall = mockVariableInput.mock.calls.at(-1)?.[0];
    expect(latestVariableInputCall.converters.resolvePathFromValue('{{$context.data.updatedAt}}')).toEqual([
      '$context',
      'data',
      'updatedAt',
    ]);
  });
});

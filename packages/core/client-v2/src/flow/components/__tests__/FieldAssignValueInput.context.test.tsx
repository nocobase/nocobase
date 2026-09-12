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
      createModel: vi.fn(() => tempRoot),
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
      createModel: vi.fn(() => tempRoot),
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

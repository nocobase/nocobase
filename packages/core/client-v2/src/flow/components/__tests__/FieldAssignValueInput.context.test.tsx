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

describe('FieldAssignValueInput RunJS', () => {
  it('shows inline RunJS by default, saves its value without sourceRef, and hides it when disabled', async () => {
    mockVariableInput.mockClear();

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
      interface: 'select',
      uiSchema: {
        enum: [{ label: 'Open', value: 'open' }],
      },
      isAssociationField: () => false,
      getComponentProps: () => ({}),
    };
    const collection = {
      dataSourceKey: 'main',
      name: 'tasks',
      getField: (name: string) => (name === 'status' ? collectionField : null),
      getFields: () => [collectionField],
    };
    const sourceContext: Record<string, unknown> = {
      collection,
      dataSourceManager: {
        getDataSource: vi.fn(() => ({})),
      },
      engine,
      t: (key: string) => key,
    };
    const formModel = {
      context: sourceContext,
      collection,
      subModels: {},
    };
    sourceContext.blockModel = formModel;

    mockGetDefaultBindingByField.mockReturnValue({ modelName: 'SelectFieldModel' });
    mockUseFlowContext.mockReturnValue({
      model: formModel,
      t: (key: string) => key,
      getPropertyMetaTree: vi.fn(async () => []),
    });

    const onChange = vi.fn();
    const view = render(<FieldAssignValueInput targetPath="status" value="" onChange={onChange} />);

    await waitFor(() => {
      expect(engine.createModel).toHaveBeenCalled();
    });

    const enabledProps = mockVariableInput.mock.calls.at(-1)?.[0];
    const enabledTree =
      typeof enabledProps.metaTree === 'function' ? await enabledProps.metaTree() : enabledProps.metaTree;
    expect(enabledTree.map((node: { name?: string }) => node.name)).toContain('runjs');

    const initialValue = enabledProps.converters.resolveValueFromPath({ paths: ['runjs'] });
    expect(initialValue).toEqual({ code: '', version: 'v2' });
    expect(initialValue).not.toHaveProperty('sourceRef');

    const savedValue = { code: 'return 42;', version: 'v2' };
    enabledProps.onChange(savedValue);
    expect(onChange).toHaveBeenLastCalledWith(savedValue);
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('sourceRef');

    view.rerender(<FieldAssignValueInput targetPath="status" value="" onChange={onChange} allowRunJS={false} />);

    const disabledProps = mockVariableInput.mock.calls.at(-1)?.[0];
    const disabledTree =
      typeof disabledProps.metaTree === 'function' ? await disabledProps.metaTree() : disabledProps.metaTree;
    expect(disabledTree.map((node: { name?: string }) => node.name)).not.toContain('runjs');
  });
});

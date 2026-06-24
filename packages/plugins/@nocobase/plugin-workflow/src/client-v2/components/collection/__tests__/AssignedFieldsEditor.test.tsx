/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssignedFieldsEditor } from '../AssignedFieldsEditor';

const { collection, createModel, mockFieldAssignValueInput, mockFlowEngine, workflowVariableTree } = vi.hoisted(() => {
  const workflowVariableTree = [{ name: '$jobsMapByNodeKey', title: 'Node result', paths: ['$jobsMapByNodeKey'] }];
  const collection = {
    name: 'posts',
    dataSourceKey: 'main',
    getField: vi.fn((name: string) => collection.getFields().find((field) => field.name === name)),
    getFields: vi.fn(() => [
      { name: 'title', uiSchema: { title: 'Title' }, interface: 'input' },
      { name: 'status', uiSchema: { title: 'Status' }, interface: 'select' },
    ]),
  };
  const createModel = vi.fn((options) => ({
    options,
    context: {
      defineProperty: vi.fn(),
      defineMethod: vi.fn(),
    },
    remove: vi.fn(),
  }));

  return {
    collection,
    createModel,
    workflowVariableTree,
    mockFieldAssignValueInput: vi.fn(
      ({
        targetPath,
        value,
        onChange,
      }: {
        targetPath: string;
        value?: unknown;
        onChange?: (value: unknown) => void;
      }) => (
        <input
          aria-label={`value-${targetPath}`}
          value={value == null ? '' : String(value)}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ),
    ),
    mockFlowEngine: {
      context: {
        dataSourceManager: {
          getDataSource: vi.fn(() => ({
            collectionManager: {
              getCollection: vi.fn(() => collection),
            },
          })),
        },
      },
      createModel,
    },
  };
});

vi.mock('@nocobase/client-v2', () => ({
  FieldAssignValueInput: mockFieldAssignValueInput,
}));

vi.mock('../../../canvas/useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: () => workflowVariableTree,
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    FlowModelProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useFlowEngine: () => mockFlowEngine,
  };
});

vi.mock('../../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('AssignedFieldsEditor', () => {
  it('edits assigned values without creating an assign form model', async () => {
    const onChange = vi.fn();

    render(<AssignedFieldsEditor collection="posts" value={{ title: 'old' }} onChange={onChange} />);

    await waitFor(() => {
      expect(createModel).toHaveBeenCalledWith({ use: 'FlowModel' });
    });
    expect(createModel).not.toHaveBeenCalledWith(expect.objectContaining({ use: 'AssignFormModel' }));
    const model = createModel.mock.results[0].value;
    expect(model.context.defineMethod).toHaveBeenCalledWith('getPropertyMetaTree', expect.any(Function));
    expect(model.context.defineMethod.mock.calls[0][1]()).toBe(workflowVariableTree);
    expect(mockFieldAssignValueInput).toHaveBeenCalledWith(
      expect.objectContaining({
        targetPath: 'title',
        allowRunJS: false,
      }),
      expect.anything(),
    );

    fireEvent.change(screen.getByLabelText('value-title'), { target: { value: 'new' } });
    expect(onChange).toHaveBeenLastCalledWith({ title: 'new' });

    fireEvent.click(screen.getByRole('button', { name: 'Remove field' }));
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it('adds unassigned collection fields with constant empty values', async () => {
    const onChange = vi.fn();

    render(<AssignedFieldsEditor collection="posts" value={{ title: 'old' }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));
    fireEvent.click(await screen.findByText('Status'));

    expect(onChange).toHaveBeenLastCalledWith({ title: 'old', status: '' });
    expect(collection.getFields).toHaveBeenCalled();
  });
});

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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignedFieldsEditor } from '../AssignedFieldsEditor';

const {
  collection,
  createModel,
  mockFieldAssignValueInput,
  mockFlowEngine,
  mockVariableHybridInput,
  workflowVariableTree,
} = vi.hoisted(() => {
  const workflowVariableTree = [{ name: '$jobsMapByNodeKey', title: 'Node result', paths: ['$jobsMapByNodeKey'] }];
  const collection = {
    name: 'posts',
    dataSourceKey: 'main',
    getField: vi.fn((name: string) => collection.getFields().find((field) => field.name === name)),
    getFields: vi.fn(() => [
      { name: 'title', type: 'string', uiSchema: { title: 'Title' }, interface: 'input' },
      { name: 'status', type: 'string', uiSchema: { title: 'Status' }, interface: 'select' },
      { name: 'body', type: 'text', uiSchema: { title: 'Body' }, interface: 'textarea' },
      { name: 'website', type: 'text', uiSchema: { title: 'Website' }, interface: 'url' },
      { name: 'metadata', type: 'json', uiSchema: { title: 'Metadata' }, interface: 'textarea' },
      { name: 'score', type: 'integer', uiSchema: { title: 'Score' }, interface: 'integer' },
      { name: 'author', type: 'belongsTo', uiSchema: { title: 'Author' }, interface: 'm2o' },
      { name: 'comments', type: 'hasMany', uiSchema: { title: 'Comments' }, interface: 'o2m' },
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
    mockVariableHybridInput: vi.fn(
      ({ value, onChange, disabled }: { value?: string; onChange?: (value: string) => void; disabled?: boolean }) => (
        <input
          aria-label={`expression-${value ?? ''}`}
          value={value ?? ''}
          disabled={Boolean(disabled)}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ),
    ),
    mockFieldAssignValueInput: vi.fn(
      ({
        targetPath,
        value,
        onChange,
        disabled,
      }: {
        targetPath: string;
        value?: unknown;
        onChange?: (value: unknown) => void;
        disabled?: boolean;
      }) => (
        <input
          aria-label={`value-${targetPath}`}
          value={value == null ? '' : String(value)}
          disabled={Boolean(disabled)}
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
    VariableHybridInput: mockVariableHybridInput,
    useFlowEngine: () => mockFlowEngine,
  };
});

vi.mock('../../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('AssignedFieldsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(mockVariableHybridInput).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'old',
        metaTree: workflowVariableTree,
      }),
      expect.anything(),
    );

    fireEvent.change(screen.getByLabelText('expression-old'), { target: { value: 'new' } });
    expect(onChange).toHaveBeenLastCalledWith({ title: 'new' });

    fireEvent.click(screen.getByRole('button', { name: 'Remove field' }));
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it('uses expressions for string-valued field types and keeps the field-aware selector for other types', async () => {
    render(
      <AssignedFieldsEditor
        collection="posts"
        value={{ body: 'old body', website: 'https://example.com', metadata: { enabled: true }, score: 1 }}
        onChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(mockVariableHybridInput).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'old body', metaTree: workflowVariableTree }),
        expect.anything(),
      );
      expect(mockVariableHybridInput).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'https://example.com', metaTree: workflowVariableTree }),
        expect.anything(),
      );
      expect(mockFieldAssignValueInput).toHaveBeenCalledWith(
        expect.objectContaining({ targetPath: 'metadata', value: { enabled: true } }),
        expect.anything(),
      );
      expect(mockFieldAssignValueInput).toHaveBeenCalledWith(
        expect.objectContaining({ targetPath: 'score', value: 1 }),
        expect.anything(),
      );
    });
  });

  it('adds unassigned collection fields with constant empty values', async () => {
    const onChange = vi.fn();

    render(<AssignedFieldsEditor collection="posts" value={{ title: 'old' }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));
    fireEvent.click(await screen.findByText('Status'));

    expect(onChange).toHaveBeenLastCalledWith({ title: 'old', status: '' });
    expect(collection.getFields).toHaveBeenCalled();
  });

  it('filters selectable fields and prunes filtered assigned values', async () => {
    const onChange = vi.fn();

    render(
      <AssignedFieldsEditor
        collection="posts"
        value={{ title: 'old', comments: [1] }}
        onChange={onChange}
        fieldFilter={(field) => field.type !== 'hasMany'}
        pruneFilteredValues
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ title: 'old' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));
    expect(await screen.findByText('Status')).toBeTruthy();
    expect(screen.queryByText('Comments')).toBeNull();
  });

  it('disables value changes, field removal, and field addition', async () => {
    const onChange = vi.fn();

    render(<AssignedFieldsEditor collection="posts" value={{ title: 'old' }} onChange={onChange} disabled />);

    await waitFor(() => {
      expect(mockVariableHybridInput).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'old',
          disabled: true,
        }),
        expect.anything(),
      );
    });

    fireEvent.change(screen.getByLabelText('expression-old'), { target: { value: 'new' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove field' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));

    expect(screen.getByRole('button', { name: 'Remove field' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add field' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('passes stored workflow variable expressions with surrounding text to the expression editor unchanged', async () => {
    const expression = 'Updated at: {{$context.data.updatedAt}}';

    render(<AssignedFieldsEditor collection="posts" value={{ title: expression }} onChange={() => undefined} />);

    await waitFor(() => {
      expect(mockVariableHybridInput).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expression,
          converters: expect.objectContaining({
            formatPathToValue: expect.any(Function),
            parseValueToPath: expect.any(Function),
            variableRegExp: expect.any(RegExp),
          }),
        }),
        expect.anything(),
      );
    });
  });
});

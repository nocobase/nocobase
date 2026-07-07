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
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { CurrentWorkflowContext, NodeContext } from '../../canvas/contexts';
import { UpdateFieldset } from '../components/update';

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

type MockAssignedField = { name: string; type?: string };

vi.mock('../../components/collection', () => ({
  isAssociationField: (field: MockAssignedField) =>
    ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type ?? ''),
  CollectionCascader: ({
    value,
    onChange,
    disabled,
  }: {
    value?: string;
    onChange?: (value?: string) => void;
    disabled?: boolean;
  }) => (
    <select
      aria-label="collection"
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value || undefined)}
    >
      <option value="" />
      <option value="posts">Posts</option>
      <option value="comments">Comments</option>
    </select>
  ),
  AssignedFieldsEditor: ({
    collection,
    fieldFilter,
    pruneFilteredValues,
    disabled,
  }: {
    collection?: string;
    fieldFilter?: (field: MockAssignedField) => boolean;
    pruneFilteredValues?: boolean;
    disabled?: boolean;
  }) => {
    const fields: MockAssignedField[] = [
      { name: 'title', type: 'string' },
      { name: 'author', type: 'belongsTo' },
      { name: 'comments', type: 'hasMany' },
      { name: 'tags', type: 'belongsToMany' },
    ];

    return (
      <div
        data-testid="assigned-fields"
        data-collection={collection ?? ''}
        data-disabled={String(Boolean(disabled))}
        data-fields={fields
          .filter((field) => fieldFilter?.(field) ?? true)
          .map((field) => field.name)
          .join(',')}
        data-prune-filtered-values={String(Boolean(pruneFilteredValues))}
      />
    );
  },
}));

vi.mock('../../components/FilterDynamicComponent', () => ({
  FilterDynamicComponent: ({ collection }: { collection?: string }) => (
    <div data-testid="filter" data-collection={collection ?? ''} />
  ),
}));

vi.mock('../../components/RadioWithTooltip', () => ({
  RadioWithTooltip: ({
    value,
    onChange,
    options,
  }: {
    value?: boolean;
    onChange?: (value: boolean) => void;
    options: Array<{ label: string; value: boolean }>;
  }) => (
    <div>
      {options.map((option) => (
        <label key={String(option.value)}>
          <input
            type="radio"
            name="individualHooks"
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  ),
}));

function renderWithForm(node: any, initialValues: any, workflow: any = {}) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <CurrentWorkflowContext.Provider value={workflow}>
        <NodeContext.Provider value={node}>
          <Form form={form} initialValues={initialValues}>
            <UpdateFieldset />
          </Form>
        </NodeContext.Provider>
      </CurrentWorkflowContext.Provider>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('UpdateFieldset', () => {
  it('renders update filter and assigned fields for the selected collection', async () => {
    renderWithForm(
      { id: 1, config: { collection: 'posts' } },
      {
        config: {
          collection: 'posts',
          params: { individualHooks: false, filter: { title: { $eq: 'old' } }, values: { title: 'new' } },
        },
      },
    );

    expect(screen.getByLabelText('collection')).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByTestId('filter')).toHaveAttribute('data-collection', 'posts');
      expect(screen.getByTestId('assigned-fields')).toHaveAttribute('data-collection', 'posts');
    });
  });

  it('resets filter and assigned values when collection changes without clearing update mode', async () => {
    const getForm = renderWithForm(
      { id: 1, config: {} },
      {
        config: {
          collection: 'posts',
          params: {
            individualHooks: true,
            filter: { title: { $eq: 'old' } },
            values: { title: 'new' },
          },
          usingAssignFormSchema: true,
          assignFormSchema: { name: 'legacy' },
        },
      },
    );

    fireEvent.change(screen.getByLabelText('collection'), { target: { value: 'comments' } });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBe('comments');
      expect(getForm()?.getFieldValue(['config', 'params', 'individualHooks'])).toBe(true);
      expect(getForm()?.getFieldValue(['config', 'params', 'filter'])).toEqual({});
      expect(getForm()?.getFieldValue(['config', 'params', 'values'])).toEqual({});
      expect(getForm()?.getFieldValue(['config', 'usingAssignFormSchema'])).toBeUndefined();
      expect(getForm()?.getFieldValue(['config', 'assignFormSchema'])).toBeUndefined();
    });
  });

  it('limits batch update assigned fields to non-association and belongsTo fields', async () => {
    renderWithForm(
      { id: 1, config: { collection: 'posts' } },
      {
        config: {
          collection: 'posts',
          params: { individualHooks: false, values: {} },
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId('assigned-fields')).toHaveAttribute('data-fields', 'title,author');
      expect(screen.getByTestId('assigned-fields')).toHaveAttribute('data-prune-filtered-values', 'true');
    });
  });

  it('allows all assigned fields when updating one by one', async () => {
    renderWithForm(
      { id: 1, config: { collection: 'posts' } },
      {
        config: {
          collection: 'posts',
          params: { individualHooks: true, values: {} },
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId('assigned-fields')).toHaveAttribute('data-fields', 'title,author,comments,tags');
      expect(screen.getByTestId('assigned-fields')).toHaveAttribute('data-prune-filtered-values', 'false');
    });
  });

  it('disables assigned fields after the workflow has been executed', async () => {
    renderWithForm(
      { id: 1, config: { collection: 'posts' } },
      {
        config: {
          collection: 'posts',
          params: { individualHooks: false, values: { title: 'new' } },
        },
      },
      { versionStats: { executed: 1 } },
    );

    await waitFor(() => {
      expect(screen.getByTestId('assigned-fields')).toHaveAttribute('data-disabled', 'true');
    });
  });
});

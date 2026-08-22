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
import { AggregateFieldset } from '../components/AggregateFieldset';

vi.mock('../locale', () => ({
  NAMESPACE: 'workflow-aggregate',
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  CollectionCascader: ({ value, onChange }: { value?: string; onChange?: (value?: string) => void }) => (
    <select aria-label="collection" value={value ?? ''} onChange={(event) => onChange?.(event.target.value)}>
      <option value="" />
      <option value="posts">Posts</option>
      <option value="comments">Comments</option>
    </select>
  ),
  FieldsSelect: ({
    value,
    onChange,
    collection,
  }: {
    value?: string;
    onChange?: (value?: string) => void;
    collection?: string;
  }) => (
    <select
      aria-label="field"
      value={value ?? ''}
      data-collection={collection ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    >
      <option value="" />
      <option value="id">ID</option>
      <option value="amount">Amount</option>
    </select>
  ),
  FilterDynamicComponent: ({ collection }: { collection?: string }) => (
    <div data-testid="filter" data-collection={collection ?? ''} />
  ),
}));

vi.mock('../components/AssociatedConfig', () => ({
  AssociatedConfig: ({ value, onChange }: { value?: unknown; onChange?: (value: unknown) => void }) => (
    <button
      type="button"
      data-testid="associated-config"
      data-value={JSON.stringify(value ?? null)}
      onClick={() => onChange?.({ name: 'comments' })}
    >
      association
    </button>
  ),
}));

function renderWithForm(initialValues: unknown) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <AggregateFieldset />
      </Form>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('AggregateFieldset', () => {
  it('renders collection aggregate fields and reuses the selected collection', async () => {
    const getForm = renderWithForm({
      config: {
        aggregator: 'count',
        associated: false,
        collection: 'posts',
        params: {
          field: 'id',
          distinct: true,
          filter: { id: { $notNull: true } },
        },
        precision: 2,
      },
    });

    expect(screen.getByLabelText('collection')).toHaveValue('posts');

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'aggregator'])).toBe('count');
      expect(getForm()?.getFieldValue(['config', 'associated'])).toBe(false);
      expect(screen.getByLabelText('field')).toHaveValue('id');
      expect(screen.getByLabelText('field')).toHaveAttribute('data-collection', 'posts');
      expect(screen.getByRole('checkbox', { name: 'Distinct' })).toBeChecked();
      expect(screen.getByTestId('filter')).toHaveAttribute('data-collection', 'posts');
    });
  });

  it('hides distinct outside count aggregates without clearing the selected field', async () => {
    const getForm = renderWithForm({
      config: {
        aggregator: 'sum',
        associated: false,
        collection: 'posts',
        params: {
          field: 'amount',
          distinct: true,
        },
      },
    });

    expect(screen.queryByRole('checkbox', { name: 'Distinct' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'params', 'field'])).toBe('amount');
      expect(getForm()?.getFieldValue(['config', 'params', 'distinct'])).toBe(true);
    });
  });

  it('resets dependent field and filter values when collection changes', async () => {
    const getForm = renderWithForm({
      config: {
        aggregator: 'count',
        associated: false,
        collection: 'posts',
        params: {
          field: 'id',
          filter: { id: { $notNull: true } },
        },
      },
    });

    fireEvent.change(screen.getByLabelText('collection'), { target: { value: 'comments' } });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBe('comments');
      expect(getForm()?.getFieldValue(['config', 'params', 'field'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'params', 'filter'])).toBeNull();
    });
  });

  it('switches to associated collection configuration and clears collection-specific values', async () => {
    const getForm = renderWithForm({
      config: {
        aggregator: 'count',
        associated: false,
        collection: 'posts',
        association: { name: 'comments' },
        params: {
          field: 'id',
          filter: { id: { $notNull: true } },
        },
      },
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Data of associated collection' }));

    await waitFor(() => {
      expect(screen.getByTestId('associated-config')).toBeInTheDocument();
      expect(getForm()?.getFieldValue(['config', 'associated'])).toBe(true);
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'association'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'params', 'field'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'params', 'filter'])).toBeNull();
    });
  });
});

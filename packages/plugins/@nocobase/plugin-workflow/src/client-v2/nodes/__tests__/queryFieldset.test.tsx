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
import { NodeContext } from '../../canvas/contexts';
import { QueryFieldset } from '../components/query';

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

vi.mock('../../components/collection', () => ({
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
  AppendsSelect: ({ collection }: { collection?: string }) => (
    <div data-testid="appends-select" data-collection={collection ?? ''} />
  ),
  PaginationFields: ({
    pageName,
    pageSizeName,
  }: {
    pageName?: string | number | (string | number)[];
    pageSizeName?: string | number | (string | number)[];
  }) => (
    <div
      data-testid="pagination-fields"
      data-page-name={JSON.stringify(pageName)}
      data-page-size-name={JSON.stringify(pageSizeName)}
    />
  ),
  SortFieldsInput: ({ collection }: { collection?: string }) => (
    <div data-testid="sort-fields" data-collection={collection ?? ''} />
  ),
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
    options?: { value: boolean; label: string }[];
  }) => (
    <select
      aria-label="result-type"
      value={String(value ?? false)}
      onChange={(event) => onChange?.(event.target.value === 'true')}
    >
      {options?.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

function renderWithForm(node: unknown, initialValues: unknown) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <NodeContext.Provider value={node}>
        <Form form={form} initialValues={initialValues}>
          <QueryFieldset />
        </Form>
      </NodeContext.Provider>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('QueryFieldset', () => {
  it('renders query fields for the selected collection', async () => {
    renderWithForm(
      { id: 1, config: { collection: 'posts' } },
      {
        config: {
          collection: 'posts',
          multiple: false,
          failOnEmpty: true,
          params: {
            filter: { title: { $eq: 'old' } },
            sort: [{ field: 'title', direction: 'asc' }],
            page: 1,
            pageSize: 20,
            appends: ['author'],
          },
        },
      },
    );

    expect(screen.getByLabelText('collection')).toBeDisabled();
    expect(screen.getByLabelText('result-type')).toHaveValue('false');
    expect(screen.getByRole('checkbox', { name: 'Exit when query result is null' })).toBeChecked();
    await waitFor(() => {
      expect(screen.getByTestId('filter')).toHaveAttribute('data-collection', 'posts');
      expect(screen.getByTestId('sort-fields')).toHaveAttribute('data-collection', 'posts');
      expect(screen.getByTestId('appends-select')).toHaveAttribute('data-collection', 'posts');
      expect(screen.getByTestId('pagination-fields')).toHaveAttribute(
        'data-page-name',
        JSON.stringify(['config', 'params', 'page']),
      );
      expect(screen.getByTestId('pagination-fields')).toHaveAttribute(
        'data-page-size-name',
        JSON.stringify(['config', 'params', 'pageSize']),
      );
    });
  });

  it('resets query params when collection changes without clearing result options', async () => {
    const getForm = renderWithForm(
      { id: 1, config: {} },
      {
        config: {
          collection: 'posts',
          multiple: true,
          failOnEmpty: true,
          params: {
            filter: { title: { $eq: 'old' } },
            sort: [{ field: 'title', direction: 'asc' }],
            page: 1,
            pageSize: 20,
            appends: ['author'],
          },
        },
      },
    );

    fireEvent.change(screen.getByLabelText('collection'), { target: { value: 'comments' } });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBe('comments');
      expect(getForm()?.getFieldValue(['config', 'params'])).toEqual({});
      expect(getForm()?.getFieldValue(['config', 'multiple'])).toBe(true);
      expect(getForm()?.getFieldValue(['config', 'failOnEmpty'])).toBe(true);
    });
  });
});

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
import { CreateFieldset } from '../components/create';

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
  AssignedFieldsEditor: ({ collection }: { collection?: string }) => (
    <div data-testid="assigned-fields" data-collection={collection ?? ''} />
  ),
  AppendsSelect: ({ collection }: { collection?: string }) => (
    <div data-testid="appends-select" data-collection={collection ?? ''} />
  ),
}));

function renderWithForm(node: any, initialValues: any) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <NodeContext.Provider value={node}>
        <Form form={form} initialValues={initialValues}>
          <CreateFieldset />
        </Form>
      </NodeContext.Provider>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('CreateFieldset', () => {
  it('renders collection assignment fields and preloads for the selected collection', async () => {
    renderWithForm(
      { id: 1, config: { collection: 'posts' } },
      { config: { collection: 'posts', params: { values: { title: 'old' }, appends: ['author'] } } },
    );

    expect(screen.getByLabelText('collection')).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByTestId('assigned-fields')).toHaveAttribute('data-collection', 'posts');
      expect(screen.getByTestId('appends-select')).toHaveAttribute('data-collection', 'posts');
    });
  });

  it('resets assigned values and appends when collection changes', async () => {
    const getForm = renderWithForm(
      { id: 1, config: {} },
      { config: { collection: 'posts', params: { values: { title: 'old' }, appends: ['author'] } } },
    );

    fireEvent.change(screen.getByLabelText('collection'), { target: { value: 'comments' } });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBe('comments');
      expect(getForm()?.getFieldValue(['config', 'params'])).toEqual({});
      expect(getForm()?.getFieldValue(['config', 'usingAssignFormSchema'])).toBeUndefined();
      expect(getForm()?.getFieldValue(['config', 'assignFormSchema'])).toBeUndefined();
    });
  });
});

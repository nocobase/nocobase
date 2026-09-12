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
import { SQLFieldset } from '../components/SQLFieldset';

vi.mock('../locale', () => ({
  NAMESPACE: '@nocobase/plugin-workflow-sql',
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    dataSourceManager: {
      ensureLoaded: vi.fn(() => Promise.resolve()),
      getDataSources: () => [
        { key: 'main', displayName: 'Main', options: {} },
        { key: 'external', displayName: 'External', options: { isDBInstance: true } },
        { key: 'api', displayName: 'API', options: { isDBInstance: false } },
      ],
    },
  }),
}));

vi.mock('@nocobase/client-v2', () => ({
  DEFAULT_DATA_SOURCE_KEY: 'main',
  TextAreaWithContextSelector: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label="sql-variable-textarea"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  WorkflowVariableInput: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  }) => <input aria-label={placeholder} value={value ?? ''} onChange={(event) => onChange?.(event.target.value)} />,
  useWorkflowVariableOptions: () => [],
}));

function renderWithForm(initialValues: unknown) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <SQLFieldset />
      </Form>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('SQLFieldset', () => {
  it('renders safe-mode parameters and preserves the variables value shape', async () => {
    const getForm = renderWithForm({
      config: {
        dataSource: 'main',
        sql: 'select * from posts where id = :id',
        variables: [{ name: 'id', value: '{{$context.data.id}}' }],
        unsafeInjection: false,
      },
    });

    expect(screen.queryByText('Migrate to safe mode')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toHaveValue('id');
    expect(screen.getByLabelText('Value')).toHaveValue('{{$context.data.id}}');

    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '{{$jobsMapByNodeKey.n1.id}}' } });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'variables'])).toEqual([
        { name: 'id', value: '{{$jobsMapByNodeKey.n1.id}}' },
      ]);
    });
  });

  it('migrates legacy unsafe SQL into replacements config', async () => {
    const getForm = renderWithForm({
      config: {
        dataSource: 'main',
        sql: 'select * from posts where id = {{$context.data.id}} and title = {{$context.data.title}}',
        unsafeInjection: true,
      },
    });

    expect(screen.getByLabelText('sql-variable-textarea')).toHaveValue(
      'select * from posts where id = {{$context.data.id}} and title = {{$context.data.title}}',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Migrate to safe mode' }));

    await waitFor(() => {
      expect(getForm()?.getFieldValue('config')).toMatchObject({
        sql: 'select * from posts where id = :var0 and title = :var1',
        unsafeInjection: false,
        variables: [
          { name: 'var0', value: '{{$context.data.id}}' },
          { name: 'var1', value: '{{$context.data.title}}' },
        ],
      });
    });
  });
});

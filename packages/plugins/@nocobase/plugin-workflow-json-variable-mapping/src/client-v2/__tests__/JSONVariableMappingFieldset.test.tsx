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
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../locale', () => ({
  NAMESPACE: 'workflow-json-variable-mapping',
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  WorkflowTypedVariableInput: (props: { value?: string; onChange?: (value: string) => void }) => (
    <input
      aria-label="workflow-typed-variable-input"
      value={props.value ?? ''}
      onChange={(event) => props.onChange?.(event.target.value)}
    />
  ),
}));

import { JSONVariableMappingFieldset } from '../components/JSONVariableMappingFieldset';

function renderWithForm(initialValues: Record<string, unknown>) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <JSONVariableMappingFieldset />
      </Form>
    );
  }

  render(<Wrapper />);

  return () => formRef;
}

describe('JSONVariableMappingFieldset', () => {
  it('binds fields under config and parses example JSON into variables', async () => {
    const getForm = renderWithForm({
      config: {
        dataSource: '{{$jobsMapByNodeKey.source}}',
        example: {
          user: {
            name: 'NocoBase',
          },
        },
        parseArray: false,
        variables: [],
      },
    });

    expect(screen.getByText('JSON data source')).toBeInTheDocument();
    expect(screen.getByText('Input example')).toBeInTheDocument();
    expect(screen.getByText('Include array index in path')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Parse' }));

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'variables'])).toEqual([
        {
          key: expect.any(String),
          path: 'user',
          name: 'user',
          paths: ['user'],
        },
        {
          key: expect.any(String),
          path: 'user.name',
          name: 'name',
          paths: ['user', 'name'],
        },
      ]);
    });
  });
});

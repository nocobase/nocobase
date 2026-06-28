/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Form, Radio } from 'antd';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../locale', () => ({
  NAMESPACE: 'workflow-json-query',
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  RadioWithTooltip: (props: {
    options?: { value: string; label: string }[];
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <Radio.Group value={props.value} onChange={(event) => props.onChange?.(event.target.value)}>
      {props.options?.map((option) => (
        <Radio key={option.value} value={option.value}>
          {option.label}
        </Radio>
      ))}
    </Radio.Group>
  ),
  renderEngineReference: () => null,
  WorkflowVariableInput: (props: { value?: string; onChange?: (value: string) => void }) => (
    <input
      aria-label="workflow-variable-input"
      value={props.value ?? ''}
      onChange={(event) => props.onChange?.(event.target.value)}
    />
  ),
}));

import { JSONQueryFieldset } from '../components/JSONQueryFieldset';

function renderWithForm(initialValues: Record<string, unknown>) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <JSONQueryFieldset />
      </Form>
    );
  }

  render(<Wrapper />);

  return () => formRef;
}

describe('JSONQueryFieldset', () => {
  it('binds fields under config and edits property mappings', () => {
    const getForm = renderWithForm({
      config: {
        engine: 'jmespath',
        source: '{{$jobsMapByNodeKey.source}}',
        expression: 'data.items',
        model: [],
      },
    });

    expect(screen.getByText('Query engine')).toBeInTheDocument();
    expect(screen.getByText('Data source')).toBeInTheDocument();
    expect(screen.getByText('Query expression')).toBeInTheDocument();
    expect(screen.getByText('Properties mapping')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add property/ }));
    fireEvent.change(screen.getByPlaceholderText('Property key'), { target: { value: 'user.name' } });
    fireEvent.change(screen.getByPlaceholderText('Alias'), { target: { value: 'userName' } });
    fireEvent.change(screen.getByPlaceholderText('Display label'), { target: { value: 'User name' } });

    expect(getForm()?.getFieldValue(['config', 'model'])).toEqual([
      {
        path: 'user.name',
        alias: 'userName',
        label: 'User name',
      },
    ]);
  });
});

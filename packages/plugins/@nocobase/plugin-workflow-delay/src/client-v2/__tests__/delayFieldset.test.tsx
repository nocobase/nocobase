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
import { render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { DelayFieldset } from '../components/DelayFieldset';

vi.mock('../locale', () => ({
  NAMESPACE: 'workflow-delay',
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      t: (key: string) => key,
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  WorkflowTypedVariableInput: (props: {
    value?: number | string | null;
    placeholder?: string;
    nullable?: boolean;
    defaultToFirstConstantTypeWhenUndefined?: boolean;
    types?: unknown;
  }) => (
    <div
      data-testid="workflow-typed-variable-input"
      data-value={String(props.value ?? '')}
      data-placeholder={props.placeholder ?? ''}
      data-nullable={String(props.nullable)}
      data-default-to-first={String(props.defaultToFirstConstantTypeWhenUndefined)}
      data-types={JSON.stringify(props.types)}
    />
  ),
}));

function renderWithForm(initialValues?: Record<string, unknown>) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <DelayFieldset />
      </Form>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('DelayFieldset', () => {
  it('binds the duration input to config.duration and preserves the typed-variable options', () => {
    renderWithForm({
      duration: 5,
    });

    const input = screen.getByTestId('workflow-typed-variable-input');
    expect(input).toHaveAttribute('data-value', '1');
    expect(input).toHaveAttribute('data-placeholder', 'Duration');
    expect(input).toHaveAttribute('data-nullable', 'false');
    expect(input).toHaveAttribute('data-default-to-first', 'true');
    expect(input).toHaveAttribute('data-types', '[["number",{"min":1}]]');
  });

  it('applies the legacy default config values for unit and end status', async () => {
    const getForm = renderWithForm();

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'unit'])).toBe(60_000);
      expect(getForm()?.getFieldValue(['config', 'endStatus'])).toBe(1);
    });
  });
});

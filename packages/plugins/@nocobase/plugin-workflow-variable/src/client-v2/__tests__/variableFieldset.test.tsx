/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const workflowState = vi.hoisted(() => ({
  currentNode: {
    key: 'current',
  },
  upstreams: [] as Array<{
    id: number;
    key: string;
    title: string;
    type: string;
    config?: {
      target?: string | null;
    };
  }>,
}));

vi.mock('../locale', () => ({
  NAMESPACE: 'workflow-variable',
  tExpr: (key: string) => `{{t("${key}", { ns: "workflow-variable" })}}`,
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  defaultFieldNames: {
    value: 'value',
    label: 'label',
    children: 'children',
  },
  Instruction: class Instruction {},
  useNodeContext: () => workflowState.currentNode,
  useAvailableUpstreams: (_node: unknown, filter?: (node: (typeof workflowState.upstreams)[number]) => boolean) =>
    filter ? workflowState.upstreams.filter(filter) : workflowState.upstreams,
  WorkflowTypedVariableInput: (props: { value?: unknown; onChange?: (value: string) => void }) => (
    <input
      aria-label="variable-value"
      value={String(props.value ?? '')}
      onChange={(event) => props.onChange?.(event.target.value)}
    />
  ),
}));

import { VariableFieldset } from '../VariableInstruction';

function renderWithForm(initialValues?: Record<string, unknown>) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <VariableFieldset />
      </Form>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('VariableFieldset', () => {
  beforeEach(() => {
    workflowState.upstreams = [
      {
        id: 1,
        key: 'var1',
        title: 'Variable 1',
        type: 'variable',
        config: {
          target: null,
        },
      },
      {
        id: 2,
        key: 'assigned-var',
        title: 'Assigned variable',
        type: 'variable',
        config: {
          target: 'var1',
        },
      },
    ];
  });

  it('defaults to declaring a new variable and binds value to config.value', async () => {
    const getForm = renderWithForm();

    fireEvent.change(screen.getByLabelText('variable-value'), { target: { value: 'hello' } });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'target'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'value'])).toBe('hello');
    });
  });

  it('assigns to the first declaring upstream variable when switching modes', async () => {
    const getForm = renderWithForm();

    fireEvent.click(screen.getByText('Assign value to an existing variable'));

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'target'])).toBe('var1');
    });
    expect(screen.getByText('Variable 1')).toBeInTheDocument();
  });
});

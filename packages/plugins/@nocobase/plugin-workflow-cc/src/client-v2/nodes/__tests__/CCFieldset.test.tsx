/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import { Form, type FormInstance } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  flowModelConfigInput: vi.fn(),
  form: undefined as FormInstance | undefined,
  node: {
    title: 'CC',
  },
  recipientsInput: vi.fn(),
  workflowVariableInput: vi.fn(),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  WorkflowVariableInput: (props: Record<string, unknown>) => {
    holder.workflowVariableInput(props);
    return <input aria-label="cc-task-title-variable-input" />;
  },
  useCurrentWorkflowContext: () => ({
    config: {
      collection: 'main.users',
    },
  }),
  useNodeContext: () => holder.node,
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../components/RecipientsInput', () => ({
  default: (props: Record<string, unknown>) => {
    holder.recipientsInput(props);
    return <div data-testid="recipients-input" />;
  },
  RecipientsInput: (props: Record<string, unknown>) => {
    holder.recipientsInput(props);
    return <div data-testid="recipients-input" />;
  },
}));

vi.mock('../../components/FlowModelConfigInput', () => ({
  default: (props: Record<string, unknown>) => {
    holder.flowModelConfigInput(props);
    return <button type="button">Go to configure</button>;
  },
}));

import { CCFieldset } from '../components/cc';

function renderFieldset(initialValues?: Record<string, unknown>) {
  function Wrapper() {
    const [form] = Form.useForm();
    holder.form = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <CCFieldset />
      </Form>
    );
  }

  return render(<Wrapper />);
}

describe('CCFieldset', () => {
  beforeEach(() => {
    holder.flowModelConfigInput.mockClear();
    holder.form = undefined;
    holder.recipientsInput.mockClear();
    holder.workflowVariableInput.mockClear();
    holder.node.title = 'CC';
  });

  it('renders the v1-aligned drawer fields in order', () => {
    renderFieldset();

    const labels = ['Recipients', 'User interface', 'Task card', 'Task title'];
    const labelNodes = labels.map((label) => screen.getByText(label));
    expect(labelNodes.map((node) => node.textContent)).toEqual(labels);
    expect(
      screen.getByText(
        'Title of each CC item in tasks center. Could use variables in string template. Default to node title.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('recipients-input')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Go to configure' })).toHaveLength(2);
  });

  it('uses the current node title as the task title default when config title is missing', () => {
    renderFieldset();

    expect(holder.workflowVariableInput).toHaveBeenCalledWith(expect.objectContaining({ value: 'CC' }));
    expect(holder.workflowVariableInput).not.toHaveBeenCalledWith(
      expect.objectContaining({ value: '{{useNodeContext().title}}' }),
    );
  });

  it('uses workflow variable input for task title instead of a plain input or textarea', () => {
    renderFieldset({
      config: {
        title: 'Custom task title',
      },
    });

    expect(screen.getByLabelText('cc-task-title-variable-input')).toBeInTheDocument();
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
    expect(holder.workflowVariableInput).toHaveBeenCalledWith(expect.objectContaining({ value: 'Custom task title' }));
    expect(holder.workflowVariableInput).not.toHaveBeenCalledWith(expect.objectContaining({ value: 'CC' }));
  });

  it('wires CC FlowModel config inputs to their existing config keys', () => {
    renderFieldset();

    expect(holder.flowModelConfigInput).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ configKey: 'ccUid', kind: 'interface', legacyConfigKey: 'ccDetail' }),
    );
    expect(holder.flowModelConfigInput).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ configKey: 'taskCardUid', kind: 'taskCard' }),
    );
  });

  it('registers temporary association fields so parent drawer submit keeps them', async () => {
    const tempAssociationFields = [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }];
    renderFieldset({
      config: {
        taskCardUid: 'cc_task_card_existing',
        tempAssociationFields,
        users: ['1'],
      },
    });

    await expect(holder.form?.validateFields()).resolves.toMatchObject({
      config: {
        taskCardUid: 'cc_task_card_existing',
        tempAssociationFields,
      },
    });
  });
});

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
import { Button, Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import LLMInstruction from '../workflow/nodes/llm';
import { LLMFieldset, WorkflowModelSelect } from '../workflow/nodes/llm/components/LLMFieldset';
import { Messages } from '../workflow/nodes/llm/components/Messages';
import { StructuredOutput } from '../workflow/nodes/llm/components/StructuredOutput';

const getLLMServices = vi.fn();

vi.mock('../locale', () => ({
  NAMESPACE: '@nocobase/plugin-ai',
  tExpr: (key: string) => key,
  useAITranslation: () => ({ t: (key: string) => key }),
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    apiClient: {
      resource: () => ({
        get: () =>
          Promise.resolve({
            data: {
              data: {
                name: 'openai-service',
                provider: 'openai',
              },
            },
          }),
      }),
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => {
  const WorkflowVariableInput = ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
    <input
      aria-label="workflow-variable-input"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
  const WorkflowVariableTextArea = ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
    <textarea
      aria-label="workflow-variable-textarea"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
  const WorkflowVariableJsonTextArea = ({
    value,
    onChange,
  }: {
    value?: unknown;
    onChange?: (value: unknown) => void;
  }) => (
    <textarea
      aria-label="workflow-variable-json"
      value={typeof value === 'string' ? value : JSON.stringify(value ?? null)}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
  class Instruction {}

  return {
    Instruction,
    WorkflowVariableInput,
    WorkflowVariableTextArea,
    WorkflowVariableJsonTextArea,
  };
});

vi.mock('../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getLLMServices,
    llmServicesLoading: false,
    llmServices: [
      {
        llmService: 'openai-service',
        llmServiceTitle: 'OpenAI service',
        enabledModels: [
          { label: 'GPT 4o', value: 'gpt-4o' },
          { label: 'GPT 4.1 mini', value: 'gpt-4.1-mini' },
        ],
      },
      {
        llmService: 'other-service',
        llmServiceTitle: 'Other service',
        enabledModels: [{ label: 'Other model', value: 'other-model' }],
      },
    ],
  }),
}));

type FormValues = {
  config?: {
    llmService?: string;
    model?: string;
    messages?: unknown[];
    structuredOutput?: {
      schema?: unknown;
      name?: string;
      description?: string;
      strict?: boolean;
    };
  };
};

function FormHarness({
  initialValues,
  onFinish,
  children,
}: {
  initialValues: FormValues;
  onFinish: (values: FormValues) => void;
  children: React.ReactNode;
}) {
  const [form] = Form.useForm<FormValues>();

  return (
    <Form form={form} initialValues={initialValues} onFinish={onFinish}>
      {children}
      <Button htmlType="submit">Submit</Button>
    </Form>
  );
}

describe('LLM workflow fieldset', () => {
  it('loads the v2 fieldset component lazily', async () => {
    const instruction = new LLMInstruction();

    await expect(instruction.FieldsetLoader()).resolves.toEqual({ default: LLMFieldset });
  });

  it('uses enabled models from the selected workflow LLM service', async () => {
    const submitted: FormValues[] = [];

    render(
      <FormHarness
        initialValues={{
          config: {
            llmService: 'openai-service',
            model: 'gpt-4o',
          },
        }}
        onFinish={(values) => submitted.push(values)}
      >
        <Form.Item name={['config', 'llmService']} hidden>
          <input />
        </Form.Item>
        <Form.Item name={['config', 'model']} label="Model">
          <WorkflowModelSelect />
        </Form.Item>
      </FormHarness>,
    );

    const modelInput = screen.getByRole('combobox');
    fireEvent.focus(modelInput);

    await waitFor(() => expect(screen.getByText('GPT 4o')).toBeInTheDocument());
    expect(screen.queryByText('Other model')).not.toBeInTheDocument();
    expect(getLLMServices).toHaveBeenCalled();

    fireEvent.change(modelInput, {
      target: { value: 'gpt-4.1-mini' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.model).toBe('gpt-4.1-mini');
  });

  it('hides model and options before an LLM service is selected', () => {
    render(
      <FormHarness initialValues={{ config: {} }} onFinish={() => undefined}>
        <LLMFieldset />
      </FormHarness>,
    );

    expect(screen.getByLabelText(/LLM service/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Model/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Options/ })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Messages' })).toBeInTheDocument();
  });

  it('shows model and options after an LLM service is selected', async () => {
    render(
      <FormHarness initialValues={{ config: { llmService: 'openai-service' } }} onFinish={() => undefined}>
        <LLMFieldset />
      </FormHarness>,
    );

    expect(await screen.findByText('Model')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Options/ })).toBeInTheDocument();
  });

  it('initializes messages with a default user prompt when the field is missing', async () => {
    const submitted: FormValues[] = [];

    render(
      <FormHarness initialValues={{ config: {} }} onFinish={(values) => submitted.push(values)}>
        <Messages />
      </FormHarness>,
    );

    expect(await screen.findByLabelText('workflow-variable-textarea')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.messages).toEqual([
      {
        role: 'user',
        content: [{ type: 'text' }],
      },
    ]);
  });

  it('keeps messages and structured output under config when submitted', async () => {
    const submitted: FormValues[] = [];
    const schema = {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
        },
      },
    };

    render(
      <FormHarness
        initialValues={{
          config: {
            messages: [
              {
                role: 'system',
                message: 'system prompt',
                content: [{ type: 'text' }],
              },
              {
                role: 'user',
                content: [{ type: 'text', content: 'user prompt' }],
              },
            ],
            structuredOutput: {
              schema,
              name: 'followup',
              description: 'Followup analysis',
              strict: true,
            },
          },
        }}
        onFinish={(values) => submitted.push(values)}
      >
        <Messages />
        <StructuredOutput />
      </FormHarness>,
    );

    fireEvent.change(screen.getAllByLabelText('workflow-variable-textarea')[0], {
      target: { value: 'updated system prompt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.messages).toEqual([
      {
        role: 'system',
        message: 'updated system prompt',
        content: [{ type: 'text' }],
      },
      {
        role: 'user',
        content: [{ type: 'text', content: 'user prompt' }],
      },
    ]);
    expect(submitted[0].config?.structuredOutput).toEqual({
      schema,
      name: 'followup',
      description: 'Followup analysis',
      strict: true,
    });
  });
});

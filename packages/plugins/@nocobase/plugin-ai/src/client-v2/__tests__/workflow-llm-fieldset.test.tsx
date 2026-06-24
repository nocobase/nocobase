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
import { LLMFieldset } from '../workflow/nodes/llm/components/LLMFieldset';
import { Messages } from '../workflow/nodes/llm/components/Messages';
import { StructuredOutput } from '../workflow/nodes/llm/components/StructuredOutput';

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

type FormValues = {
  config?: {
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

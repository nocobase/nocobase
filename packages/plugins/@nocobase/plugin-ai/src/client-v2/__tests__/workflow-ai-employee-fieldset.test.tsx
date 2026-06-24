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
import AIEmployeeInstruction from '../workflow/nodes/employee';
import { AIEmployeeFieldset } from '../workflow/nodes/employee/components/AIEmployeeFieldset';
import { Assignees } from '../workflow/nodes/employee/components/Assignees';
import { FeedbackSettings } from '../workflow/nodes/employee/components/FeedbackSettings';
import { StructuredOutput } from '../workflow/nodes/employee/components/StructuredOutput';

vi.mock('../locale', () => ({
  NAMESPACE: '@nocobase/plugin-ai',
  tExpr: (key: string) => key,
  useAITranslation: () => ({ t: (key: string) => key }),
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/flow-engine', () => ({
  observer: <T extends React.ComponentType<unknown>>(component: T) => component,
  useFlowEngine: () => ({
    context: {
      dataSourceManager: {
        getDataSource: () => ({
          collectionManager: {
            getCollections: () => [],
          },
        }),
      },
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
  const FilterDynamicComponent = ({
    value,
    onChange,
  }: {
    value?: Record<string, unknown>;
    onChange?: (value: Record<string, unknown>) => void;
  }) => (
    <textarea
      aria-label="assignee-filter"
      value={JSON.stringify(value ?? {})}
      onChange={(event) => onChange?.(JSON.parse(event.target.value) as Record<string, unknown>)}
    />
  );
  class Instruction {}

  return {
    FilterDynamicComponent,
    Instruction,
    WorkflowVariableInput,
    WorkflowVariableTextArea,
    WorkflowVariableJsonTextArea,
  };
});

vi.mock('../components/RemoteSelect', () => ({
  RemoteSelect: ({ value, onChange }: { value?: string | number; onChange?: (value?: string) => void }) => (
    <input
      aria-label="remote-select"
      value={value == null ? '' : String(value)}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    aiEmployeesLoading: false,
    llmServices: [],
    llmServicesLoading: false,
    getAIEmployees: vi.fn(),
    getAIEmployeesMap: () => ({
      atlas: {
        username: 'atlas',
        nickname: 'Atlas',
        title: 'AI employee',
        skillSettings: {
          skills: [],
          tools: [],
        },
      },
    }),
    getLLMServices: vi.fn(),
  }),
}));

type FormValues = {
  config?: {
    requiresApproval?: unknown;
    structuredOutput?: {
      schema?: unknown;
    };
    assignees?: unknown[];
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

describe('AI employee workflow fieldset', () => {
  it('loads the v2 fieldset component lazily', async () => {
    const instruction = new AIEmployeeInstruction();

    await expect(instruction.FieldsetLoader()).resolves.toEqual({ default: AIEmployeeFieldset });
  });

  it('keeps structured output and normalized approval mode under config when submitted', async () => {
    const submitted: FormValues[] = [];
    const schema = {
      type: 'object',
      properties: {
        translation: {
          type: 'string',
        },
      },
    };

    render(
      <FormHarness
        initialValues={{
          config: {
            structuredOutput: {
              schema,
            },
            requiresApproval: true,
          },
        }}
        onFinish={(values) => submitted.push(values)}
      >
        <StructuredOutput />
        <FeedbackSettings />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.structuredOutput?.schema).toEqual(schema);
    expect(submitted[0].config?.requiresApproval).toBe('human_decision');
  });

  it('shows assignees only for approval modes and stores selected users', async () => {
    const submitted: FormValues[] = [];

    render(
      <FormHarness
        initialValues={{
          config: {
            requiresApproval: 'human_decision',
          },
        }}
        onFinish={(values) => submitted.push(values)}
      >
        <Assignees />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add assignee' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Select users' }));
    fireEvent.change(screen.getByLabelText('remote-select'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.assignees).toEqual(['7']);
  });

  it('stores query-user assignees as filter objects', async () => {
    const submitted: FormValues[] = [];
    const filter = {
      nickname: {
        $includes: 'Ada',
      },
    };

    render(
      <FormHarness
        initialValues={{
          config: {
            requiresApproval: 'ai_decision',
          },
        }}
        onFinish={(values) => submitted.push(values)}
      >
        <Assignees />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add assignee' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Query users' }));
    fireEvent.change(screen.getByLabelText('assignee-filter'), {
      target: { value: JSON.stringify(filter) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.assignees).toEqual([{ filter }]);
  });

  it('hides assignees when approval is not required', () => {
    render(
      <FormHarness
        initialValues={{
          config: {
            requiresApproval: 'no_required',
          },
        }}
        onFinish={vi.fn()}
      >
        <Assignees />
      </FormHarness>,
    );

    expect(screen.queryByText('Assignees')).toBeNull();
  });
});

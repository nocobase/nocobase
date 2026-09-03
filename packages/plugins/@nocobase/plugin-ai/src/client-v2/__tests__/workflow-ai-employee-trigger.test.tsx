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
import AIEmployeeTrigger from '../workflow/triggers/ai-employee';
import { AIEmployeeTriggerConfig } from '../workflow/triggers/ai-employee/AIEmployeeTriggerConfig';

vi.mock('../locale', () => ({
  NAMESPACE: '@nocobase/plugin-ai',
  tExpr: (key: string) => key,
  useAITranslation: () => ({ t: (key: string) => key }),
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => {
  class Trigger {}

  return {
    Trigger,
  };
});

type FormValues = {
  config?: {
    parameters?: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'enum';
      description?: string;
      enumOptions?: string[];
      required?: boolean;
    }>;
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
      <Button htmlType="submit">Save</Button>
    </Form>
  );
}

function clickModalSubmit() {
  const submitButtons = screen.getAllByRole('button', { name: 'Submit' });
  fireEvent.click(submitButtons[submitButtons.length - 1]);
}

describe('AI employee workflow trigger', () => {
  it('loads the v2 trigger fieldset lazily', async () => {
    const trigger = new AIEmployeeTrigger();

    await expect(trigger.FieldsetLoader()).resolves.toEqual({ default: AIEmployeeTriggerConfig });
  });

  it('keeps parameter variables and validation aligned with v1', () => {
    const trigger = new AIEmployeeTrigger();

    expect(
      trigger.useVariables({
        parameters: [
          {
            name: 'input_text',
            type: 'string',
          },
        ],
      }),
    ).toEqual([{ key: 'input_text', label: 'input_text', value: 'input_text' }]);
    expect(trigger.validate({ parameters: [] })).toBe(true);
    expect(trigger.validate({ parameters: [{ name: 'status', type: 'enum', enumOptions: ['draft'] }] })).toBe(true);
    expect(trigger.validate({ parameters: [{ name: 'status', type: 'enum', enumOptions: [] }] })).toBe(false);
    expect(trigger.validate({ parameters: [{ name: 'bad-name', type: 'string' }] })).toBe(false);
  });

  it('adds a string parameter through the modal and submits config.parameters', async () => {
    const submitted: FormValues[] = [];

    render(
      <FormHarness initialValues={{ config: { parameters: [] } }} onFinish={(values) => submitted.push(values)}>
        <AIEmployeeTriggerConfig />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add parameter' }));
    fireEvent.change(screen.getByLabelText('Parameter name'), {
      target: { value: 'input_text' },
    });
    fireEvent.change(screen.getByLabelText('Parameter description'), {
      target: { value: 'Text to translate' },
    });
    fireEvent.click(screen.getByLabelText('Required'));
    clickModalSubmit();
    await screen.findByText('input_text');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.parameters).toEqual([
      {
        name: 'input_text',
        type: 'string',
        description: 'Text to translate',
        enumOptions: undefined,
        required: true,
      },
    ]);
  });

  it('shows enum options and renders drag sort handles', async () => {
    const submitted: FormValues[] = [];

    render(
      <FormHarness
        initialValues={{
          config: {
            parameters: [
              {
                name: 'status',
                type: 'enum',
                enumOptions: ['draft', 'published'],
                required: true,
              },
              {
                name: 'count',
                type: 'number',
              },
            ],
          },
        }}
        onFinish={(values) => submitted.push(values)}
      >
        <AIEmployeeTriggerConfig />
      </FormHarness>,
    );

    const addButton = screen.getByRole('button', { name: 'Add parameter' });
    const parameterHelp = screen.getByText('The parameters required by the tool');
    expect(Boolean(addButton.compareDocumentPosition(parameterHelp) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(screen.getAllByLabelText('Drag to sort')).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText('Edit')[0]);
    expect(await screen.findByText('Options')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Drag to sort')).toHaveLength(4);
    clickModalSubmit();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].config?.parameters).toEqual([
      {
        name: 'status',
        type: 'enum',
        enumOptions: ['draft', 'published'],
        required: true,
      },
      {
        name: 'count',
        type: 'number',
      },
    ]);
  });
});

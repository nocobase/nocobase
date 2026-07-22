/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import type { FormInstance } from 'antd/es/form';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SequenceRulesConfigureField } from '../SequenceRulesConfigureField';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

interface TestRuleType {
  value: string;
  label: string;
  defaults: Record<string, unknown>;
  fields: Array<{
    name: string;
    label: string;
    component: string;
    componentProps?: Record<string, unknown>;
    enum?: Array<{ label: string; value: string }>;
    required?: boolean;
  }>;
}

function SequenceRulesHarness(props: {
  formRef: React.MutableRefObject<FormInstance | undefined>;
  options: Record<string, unknown>;
  ruleType: TestRuleType;
}) {
  const [form] = Form.useForm();
  props.formRef.current = form;

  return (
    <Form
      form={form}
      initialValues={{
        patterns: [{ type: props.ruleType.value, options: props.options }],
      }}
    >
      <SequenceRulesConfigureField
        name="patterns"
        namePath={['patterns']}
        schema={{ required: true, 'x-component-props': { ruleTypes: [props.ruleType] } }}
        form={form}
        context={{}}
        fieldInterface={{}}
        mode="create"
        title="Sequence rules"
      />
    </Form>
  );
}

describe('SequenceRulesConfigureField', () => {
  it('stores fixed text entered in the rule configuration form', async () => {
    const formRef = { current: undefined } as React.MutableRefObject<FormInstance | undefined>;
    const ruleType: TestRuleType = {
      value: 'string',
      label: 'Fixed text',
      defaults: { value: '' },
      fields: [{ name: 'value', label: 'Text content', component: 'Input', required: true }],
    };

    render(<SequenceRulesHarness formRef={formRef} options={{ value: '' }} ruleType={ruleType} />);

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['patterns', 0, 'options', 'value'])).toBe('11');
    });
  });

  it('loads and stores numeric rule options', async () => {
    const formRef = { current: undefined } as React.MutableRefObject<FormInstance | undefined>;
    const ruleType: TestRuleType = {
      value: 'integer',
      label: 'Autoincrement',
      defaults: { digits: 4 },
      fields: [{ name: 'digits', label: 'Digits', component: 'InputNumber', required: true }],
    };

    render(<SequenceRulesHarness formRef={formRef} options={{ digits: 4 }} ruleType={ruleType} />);

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const input = await screen.findByRole('spinbutton');
    expect(input).toHaveValue('4');

    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['patterns', 0, 'options', 'digits'])).toBe(6);
    });
  });

  it('stores selected character sets', async () => {
    const formRef = { current: undefined } as React.MutableRefObject<FormInstance | undefined>;
    const ruleType: TestRuleType = {
      value: 'randomChar',
      label: 'Random character',
      defaults: { charsets: ['number'] },
      fields: [
        {
          name: 'charsets',
          label: 'Character sets',
          component: 'Select',
          componentProps: { mode: 'multiple' },
          enum: [
            { label: 'Number', value: 'number' },
            { label: 'Uppercase letters', value: 'uppercase' },
          ],
          required: true,
        },
      ],
    };

    render(<SequenceRulesHarness formRef={formRef} options={{ charsets: ['number'] }} ruleType={ruleType} />);

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const select = await screen.findByLabelText('Character sets');
    fireEvent.mouseDown(select);
    fireEvent.click(await screen.findByText('Uppercase letters'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['patterns', 0, 'options', 'charsets'])).toEqual(['number', 'uppercase']);
    });
  });

  it('stores the selected reset cycle', async () => {
    const formRef = { current: undefined } as React.MutableRefObject<FormInstance | undefined>;
    const ruleType: TestRuleType = {
      value: 'integer',
      label: 'Autoincrement',
      defaults: { cycle: null },
      fields: [{ name: 'cycle', label: 'Reset cycle', component: 'CronCycle' }],
    };

    render(<SequenceRulesHarness formRef={formRef} options={{ cycle: null }} ruleType={ruleType} />);

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const select = await screen.findByLabelText('Reset cycle');
    fireEvent.mouseDown(select);
    fireEvent.click(await screen.findByText('Daily'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef.current?.getFieldValue(['patterns', 0, 'options', 'cycle'])).toBe('0 0 * * *');
    });
  });
});

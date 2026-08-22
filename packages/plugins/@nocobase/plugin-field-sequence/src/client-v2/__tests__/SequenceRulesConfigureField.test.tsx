/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Form } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SequenceRulesConfigureField } from '../SequenceRulesConfigureField';
import { SequenceFieldInterface } from '../interface';

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
  useT: () => (value: string) => value,
}));

const ruleTypes = new SequenceFieldInterface().configure.items.find((item) => item.name === 'patterns')?.componentProps
  ?.ruleTypes;

function SequenceRulesHarness({
  disabled,
  initialPatterns = [{ type: 'integer', options: { digits: 4, start: 1, key: 'preserved-key' } }],
  onForm,
  required = true,
  ruleTypes: currentRuleTypes = ruleTypes,
}: {
  disabled?: boolean;
  initialPatterns?: Array<Record<string, unknown>>;
  onForm?: (form: FormInstance) => void;
  required?: boolean;
  ruleTypes?: Array<Record<string, unknown>>;
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    onForm?.(form);
  }, [form, onForm]);

  return (
    <Form form={form} initialValues={{ patterns: initialPatterns }}>
      <SequenceRulesConfigureField
        disabled={disabled}
        form={form}
        namePath={['patterns']}
        schema={{
          required,
          'x-component-props': {
            ruleTypes: currentRuleTypes,
          },
        }}
        title="Sequence rules"
      />
    </Form>
  );
}

async function openSelectOption(label: string, index = 0) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  await screen.findByTitle(label);
  fireEvent.click(screen.getByTitle(label));
}

describe('SequenceRulesConfigureField', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders rule summaries, adds rules, removes rules and resets options when type changes', async () => {
    let formRef: FormInstance | undefined;
    render(<SequenceRulesHarness onForm={(form) => (formRef = form)} />);

    expect(screen.getByText('Autoincrement')).toBeInTheDocument();
    expect(screen.getByText('Digits')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Start from')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add rule/ }));
    await waitFor(() => expect(formRef?.getFieldValue('patterns')).toHaveLength(2));
    expect(formRef?.getFieldValue(['patterns', 1])).toEqual({
      type: 'integer',
      options: { digits: 4, start: 1 },
    });

    await openSelectOption('Date', 0);
    await waitFor(() =>
      expect(formRef?.getFieldValue(['patterns', 0])).toEqual({
        type: 'date',
        options: { format: 'YYYYMMDD' },
      }),
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(formRef?.getFieldValue('patterns')).toHaveLength(1));
  });

  it('opens integer rule configuration and preserves existing sequence key on submit', async () => {
    let formRef: FormInstance | undefined;
    render(<SequenceRulesHarness onForm={(form) => (formRef = form)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    await screen.findByRole('dialog');

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Digits')).toBeInTheDocument();
    expect(within(dialog).getByText('Start from')).toBeInTheDocument();
    expect(within(dialog).getByText('Reset cycle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(formRef?.getFieldValue(['patterns', 0, 'options'])).toMatchObject({
        key: 'preserved-key',
        digits: 4,
        start: 1,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('summarizes custom reset cycles for integer rules', async () => {
    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'integer', options: { digits: 4, start: 1, cycle: '*/5 * * * *' } }]}
      />,
    );

    expect(screen.getByText('Reset cycle')).toBeInTheDocument();
    expect(screen.getByText('Customize')).toBeInTheDocument();
  });

  it('summarizes multi-select random character options', async () => {
    render(
      <SequenceRulesHarness
        initialPatterns={[
          {
            type: 'randomChar',
            options: { length: 6, charsets: ['number', 'uppercase'] },
          },
        ]}
      />,
    );

    expect(screen.getByText('Random character')).toBeInTheDocument();
    expect(screen.getByText('Character sets')).toBeInTheDocument();
    expect(screen.getByText('Number, Uppercase letters')).toBeInTheDocument();
  });

  it('disables table actions and drawer controls when the field is disabled', async () => {
    render(<SequenceRulesHarness disabled />);

    expect(screen.getByRole('button', { name: /Add rule/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Configure' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('opens fixed text rule configuration and closes the drawer', async () => {
    render(<SequenceRulesHarness initialPatterns={[{ type: 'string', options: { value: 'INV-' } }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Text content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renders preset reset cycle options for integer rules', async () => {
    render(<SequenceRulesHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox'));

    expect((await screen.findAllByTitle('No reset')).length).toBeGreaterThan(0);
    expect(await screen.findByTitle('Daily')).toBeInTheDocument();
    expect(await screen.findByTitle('Customize')).toBeInTheDocument();
  });

  it('moves rules with drag and drop', async () => {
    let formRef: FormInstance | undefined;
    const { container } = render(
      <SequenceRulesHarness
        initialPatterns={[
          { type: 'string', options: { value: 'A' } },
          { type: 'date', options: { format: 'YYYY' } },
        ]}
        onForm={(form) => (formRef = form)}
      />,
    );
    const handles = screen.getAllByLabelText('Drag sort');
    const rows = Array.from(container.querySelectorAll('tbody tr'));

    fireEvent.dragStart(handles[0]);
    fireEvent.dragOver(rows[1]);
    fireEvent.drop(rows[1]);

    await waitFor(() => expect(formRef?.getFieldValue(['patterns', 0, 'type'])).toBe('date'));

    fireEvent.dragEnd(handles[0]);
    fireEvent.drop(rows[0]);
    expect(formRef?.getFieldValue('patterns')).toHaveLength(2);
  });

  it('validates required rule lists', async () => {
    let formRef: FormInstance | undefined;
    render(<SequenceRulesHarness initialPatterns={[]} onForm={(form) => (formRef = form)} />);

    await act(async () => {
      await expect(formRef?.validateFields()).rejects.toMatchObject({
        errorFields: expect.arrayContaining([
          expect.objectContaining({
            errors: ['Please add at least one rule'],
          }),
        ]),
      });
    });
  });

  it('uses field defaults when custom rule types omit top-level defaults', async () => {
    const customRuleTypes = [
      {
        value: 'custom',
        label: 'Custom',
        fields: [
          { name: 'prefix', label: 'Prefix', component: 'Input', default: 'C-' },
          { name: 'kind', label: 'Kind', component: 'Select', default: 'A' },
        ],
      },
    ];
    let formRef: FormInstance | undefined;
    render(
      <SequenceRulesHarness
        initialPatterns={[]}
        required={false}
        ruleTypes={customRuleTypes}
        onForm={(form) => (formRef = form)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Add rule/ }));

    await waitFor(() =>
      expect(formRef?.getFieldValue(['patterns', 0])).toEqual({
        type: 'custom',
        options: {
          prefix: 'C-',
          kind: 'A',
        },
      }),
    );
    expect(screen.getByText('Prefix')).toBeInTheDocument();
    expect(screen.getByText('C-')).toBeInTheDocument();
  });

  it('renders no-reset cycle summaries', () => {
    render(
      <SequenceRulesHarness initialPatterns={[{ type: 'integer', options: { digits: 4, start: 1, cycle: null } }]} />,
    );

    expect(screen.getByText('Reset cycle')).toBeInTheDocument();
    expect(screen.getByText('No reset')).toBeInTheDocument();
  });

  it('hides option summaries when custom rule fields have no values', () => {
    const customRuleTypes = [
      {
        value: 'custom',
        label: <span>Custom node</span>,
        fields: [
          { name: 'prefix', label: <span>Prefix node</span>, component: 'Input' },
          { name: 'kind', label: 'Kind', component: 'Select' },
        ],
      },
    ];

    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'custom', options: {} }]}
        required={false}
        ruleTypes={customRuleTypes}
      />,
    );

    expect(screen.getByText('Custom node')).toBeInTheDocument();
    expect(screen.queryByText('Prefix node')).not.toBeInTheDocument();
  });

  it('renders empty select options when custom schemas omit enum values', async () => {
    const customRuleTypes = [
      {
        value: 'custom',
        label: 'Custom',
        defaults: { kind: 'A' },
        fields: [{ name: 'kind', label: 'Kind', component: 'Select' }],
      },
    ];

    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'custom', options: { kind: 'A' } }]}
        required={false}
        ruleTypes={customRuleTypes}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('combobox')).toBeInTheDocument();
  });

  it('normalizes primitive enum values for custom select controls', async () => {
    const customRuleTypes = [
      {
        value: 'custom',
        label: 'Custom',
        defaults: { kind: 'A' },
        fields: [{ name: 'kind', label: 'Kind', component: 'Select', enum: ['A', 'B'] }],
      },
    ];

    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'custom', options: { kind: 'A' } }]}
        required={false}
        ruleTypes={customRuleTypes}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox'));

    expect((await screen.findAllByTitle('A')).length).toBeGreaterThan(0);
    expect(await screen.findByTitle('B')).toBeInTheDocument();
  });

  it('stores fixed text entered in the rule configuration form', async () => {
    let formRef: FormInstance | undefined;
    const customRuleTypes = [
      {
        value: 'string',
        label: 'Fixed text',
        defaults: { value: '' },
        fields: [{ name: 'value', label: 'Text content', component: 'Input', required: true }],
      },
    ];

    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'string', options: { value: '' } }]}
        onForm={(form) => (formRef = form)}
        ruleTypes={customRuleTypes}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef?.getFieldValue(['patterns', 0, 'options', 'value'])).toBe('11');
    });
  });

  it('loads and stores numeric rule options', async () => {
    let formRef: FormInstance | undefined;
    const customRuleTypes = [
      {
        value: 'integer',
        label: 'Autoincrement',
        defaults: { digits: 4 },
        fields: [{ name: 'digits', label: 'Digits', component: 'InputNumber', required: true }],
      },
    ];

    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'integer', options: { digits: 4 } }]}
        onForm={(form) => (formRef = form)}
        ruleTypes={customRuleTypes}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const input = await screen.findByRole('spinbutton');
    expect(input).toHaveValue('4');

    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef?.getFieldValue(['patterns', 0, 'options', 'digits'])).toBe(6);
    });
  });

  it('stores selected character sets', async () => {
    let formRef: FormInstance | undefined;
    const customRuleTypes = [
      {
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
      },
    ];

    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'randomChar', options: { charsets: ['number'] } }]}
        onForm={(form) => (formRef = form)}
        ruleTypes={customRuleTypes}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const select = await screen.findByLabelText('Character sets');
    fireEvent.mouseDown(select);
    fireEvent.click(await screen.findByText('Uppercase letters'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef?.getFieldValue(['patterns', 0, 'options', 'charsets'])).toEqual(['number', 'uppercase']);
    });
  });

  it('stores the selected reset cycle', async () => {
    let formRef: FormInstance | undefined;
    const customRuleTypes = [
      {
        value: 'integer',
        label: 'Autoincrement',
        defaults: { cycle: null },
        fields: [{ name: 'cycle', label: 'Reset cycle', component: 'CronCycle' }],
      },
    ];

    render(
      <SequenceRulesHarness
        initialPatterns={[{ type: 'integer', options: { cycle: null } }]}
        onForm={(form) => (formRef = form)}
        ruleTypes={customRuleTypes}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const select = await screen.findByLabelText('Reset cycle');
    fireEvent.mouseDown(select);
    fireEvent.click(await screen.findByText('Daily'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(formRef?.getFieldValue(['patterns', 0, 'options', 'cycle'])).toBe('0 0 * * *');
    });
  });
});

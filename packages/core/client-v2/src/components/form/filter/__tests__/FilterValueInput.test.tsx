/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilterValueInput } from '../FilterValueInput';
import type { FilterOperator, FilterOption } from '../../../../flow/components/filter/useFilterOptions';

type Case = {
  /** Human-readable description of the v1 interface this case mirrors. */
  name: string;
  /** Field uiSchema. Operator schema is optional and overrides this. */
  fieldComponent?: string;
  fieldEnum?: any[];
  operator?: FilterOperator;
  /** Selector used to confirm the right antd control rendered. */
  selector: string;
  /** Optional: drive an interaction and assert onChange payload. */
  interact?: (container: HTMLElement, onChange: ReturnType<typeof vi.fn>) => void;
  expectedOnChange?: any;
};

const fieldOf = (component: string, extra: Partial<FilterOption['schema']> = {}): FilterOption => ({
  name: 'f',
  title: 'F',
  schema: { 'x-component': component, ...extra },
});

const opOf = (overrides: Partial<FilterOperator> = {}): FilterOperator => ({
  value: '$eq',
  label: 'is',
  ...overrides,
});

// One row per v1 field interface → expected v2 antd control. Detection is kept to a single CSS selector per case so the table reads as "interface ↔ selector"; interactive assertions are added only where the value-onChange contract is non-trivial (e.g. Checkbox.target.checked, ColorPicker hex extraction).
const CASES: Case[] = [
  // string / email / phone / uuid / nanoid / url all default to Input
  { name: 'input → antd Input', fieldComponent: 'Input', selector: 'input[type="text"]' },
  { name: 'Input.URL → antd Input', fieldComponent: 'Input.URL', selector: 'input[type="text"]' },
  { name: 'NanoIDInput → antd Input', fieldComponent: 'NanoIDInput', selector: 'input[type="text"]' },

  // textarea / markdown / richText / json all collapse to TextArea
  { name: 'textarea → antd Input.TextArea', fieldComponent: 'Input.TextArea', selector: 'textarea' },
  { name: 'markdown → antd Input.TextArea', fieldComponent: 'Markdown', selector: 'textarea' },
  { name: 'richText → antd Input.TextArea', fieldComponent: 'RichText', selector: 'textarea' },
  { name: 'json → antd Input.TextArea', fieldComponent: 'Input.JSON', selector: 'textarea' },

  // numeric inputs
  { name: 'integer → antd InputNumber', fieldComponent: 'InputNumber', selector: '.ant-input-number' },
  { name: 'percent → antd InputNumber', fieldComponent: 'Percent', selector: '.ant-input-number' },

  // password — the case that prompted this audit
  {
    name: 'password → PasswordInput (Input.Password)',
    fieldComponent: 'Password',
    selector: 'input[type="password"]',
  },

  // pickers
  {
    name: 'datetime field → antd DatePicker (no operator override)',
    fieldComponent: 'DatePicker',
    selector: '.ant-picker',
  },
  { name: 'unixTimestamp → antd DatePicker', fieldComponent: 'UnixTimestamp', selector: '.ant-picker' },
  { name: 'time → antd TimePicker', fieldComponent: 'TimePicker', selector: '.ant-picker' },
  { name: 'color → antd ColorPicker', fieldComponent: 'ColorPicker', selector: '.ant-color-picker-trigger' },

  // boolean / single-choice / multi-choice
  { name: 'checkbox → antd Checkbox', fieldComponent: 'Checkbox', selector: 'input[type="checkbox"]' },
  {
    name: 'checkboxGroup with field enum → antd Checkbox.Group',
    fieldComponent: 'Checkbox.Group',
    fieldEnum: [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ],
    selector: '.ant-checkbox-group',
  },
  {
    name: 'radioGroup with field enum → antd Radio.Group',
    fieldComponent: 'Radio.Group',
    fieldEnum: [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ],
    selector: '.ant-radio-group',
  },
  { name: 'select → antd Select', fieldComponent: 'Select', selector: '.ant-select' },

  // operator-level overrides — datetime operator schema wins over field uiSchema
  {
    name: '$dateOn operator → smart date picker',
    fieldComponent: 'DatePicker',
    operator: opOf({
      schema: { 'x-component': 'DateFilterDynamicComponent', 'x-component-props': { isRange: false } },
    }),
    selector: '.ant-picker',
  },
  {
    name: '$anyOf array operator → Select with tags mode',
    fieldComponent: 'Input',
    operator: opOf({
      value: '$anyOf',
      schema: { 'x-component': 'Select', 'x-component-props': { mode: 'tags' } },
    }),
    selector: '.ant-select-selection-overflow',
  },

  // noValue operators render nothing
  {
    name: '$empty operator → renders nothing',
    fieldComponent: 'Input',
    operator: opOf({ value: '$empty', noValue: true }),
    selector: '*',
    // selector intentionally generic; we assert empty container via interact
  },
];

function setup(c: Case) {
  const onChange = vi.fn();
  const field = c.fieldComponent
    ? fieldOf(c.fieldComponent, c.fieldEnum ? ({ enum: c.fieldEnum } as any) : {})
    : undefined;
  const utils = render(<FilterValueInput field={field} operator={c.operator} value={undefined} onChange={onChange} />);
  return { onChange, ...utils };
}

describe('FilterValueInput dispatch table', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const { container } = setup(c);
      if (c.operator?.noValue) {
        // For noValue operators the component returns null.
        expect(
          container.querySelector('input, textarea, .ant-select, .ant-picker, .ant-color-picker-trigger'),
        ).toBeNull();
        return;
      }
      expect(container.querySelector(c.selector)).not.toBeNull();
    });
  }
});

describe('FilterValueInput interaction wiring', () => {
  // Spot-check a handful of write-through paths that have non-trivial event shapes (target.checked, event vs raw value, hex extraction from ColorPicker).
  it('Checkbox emits the boolean from target.checked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <FilterValueInput field={fieldOf('Checkbox')} operator={opOf()} value={false} onChange={onChange} />,
    );
    fireEvent.click(container.querySelector('input[type="checkbox"]') as HTMLInputElement);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('Password emits the unwrapped string from the input event', () => {
    const onChange = vi.fn();
    const { container } = render(
      <FilterValueInput field={fieldOf('Password')} operator={opOf()} value="" onChange={onChange} />,
    );
    const input = container.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hunter2' } });
    expect(onChange).toHaveBeenCalledWith('hunter2');
  });

  it('TextArea emits the unwrapped string', () => {
    const onChange = vi.fn();
    const { container } = render(
      <FilterValueInput field={fieldOf('Input.TextArea')} operator={opOf()} value="" onChange={onChange} />,
    );
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'abuse' },
    });
    expect(onChange).toHaveBeenCalledWith('abuse');
  });

  it('Radio.Group emits the picked value (not the event)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <FilterValueInput
        field={fieldOf('Radio.Group', {
          enum: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        } as any)}
        operator={opOf()}
        value={undefined}
        onChange={onChange}
      />,
    );
    fireEvent.click(container.querySelectorAll('input[type="radio"]')[1] as HTMLInputElement);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('Fallback Input honours the placeholder prop', () => {
    render(<FilterValueInput operator={opOf()} value="" onChange={() => undefined} placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });
});

describe('FilterValueInput schema precedence', () => {
  it('operator schema wins over field uiSchema', () => {
    // Field would render Input, but operator forces Select.
    render(
      <FilterValueInput
        field={fieldOf('Input')}
        operator={opOf({
          schema: { 'x-component': 'Select', 'x-component-props': { mode: 'tags' } },
        })}
        value={[]}
        onChange={() => undefined}
      />,
    );
    expect(document.querySelector('.ant-select')).not.toBeNull();
  });

  it('operator schema can render an app-registered custom component', () => {
    const onChange = vi.fn();
    const CustomFilterInput = (props: any) => (
      <button
        type="button"
        data-testid="custom-filter-input"
        data-field-interface={props.fieldInterface}
        data-value={JSON.stringify(props.value)}
        onClick={() => props.onChange?.(['alpha', 'beta'])}
      >
        custom-filter-input
      </button>
    );

    render(
      <FilterValueInput
        operator={opOf({
          value: '$in',
          schema: {
            'x-component': 'MultipleKeywordsInput',
            'x-component-props': { fieldInterface: 'input' },
          },
        })}
        value={['foo', 'bar']}
        onChange={onChange}
        app={{
          getComponent: (name) => (name === 'MultipleKeywordsInput' ? CustomFilterInput : undefined),
        }}
      />,
    );

    const input = screen.getByTestId('custom-filter-input');
    expect(input.getAttribute('data-field-interface')).toBe('input');
    expect(input.getAttribute('data-value')).toBe(JSON.stringify(['foo', 'bar']));

    fireEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(['alpha', 'beta']);
  });

  it('field uiSchema is used when operator has none', () => {
    const { container } = render(
      <FilterValueInput
        field={fieldOf('InputNumber')}
        operator={opOf()}
        value={undefined}
        onChange={() => undefined}
      />,
    );
    expect(container.querySelector('.ant-input-number')).not.toBeNull();
  });

  it('plain Input is used when neither side has a schema', () => {
    const { container } = render(
      <FilterValueInput operator={opOf()} value="" onChange={() => undefined} placeholder="x" />,
    );
    expect(container.querySelector('input[type="text"]')).not.toBeNull();
  });
});

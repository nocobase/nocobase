/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/evaluators/client', () => ({
  getOptions: () => [
    { value: 'formula.js', label: 'Formula.js' },
    { value: 'math.js', label: 'Math.js' },
  ],
  evaluators: {
    get(key: string) {
      return {
        evaluate(value: string) {
          if (value === 'BAD') {
            throw new Error('bad expression');
          }
          return value;
        },
        label: key,
        link: key === 'formula.js' ? 'https://formula.example' : undefined,
      };
    },
  },
}));

vi.mock('../../components/RadioWithTooltip', () => ({
  RadioWithTooltip: ({
    options = [] as Array<{ value: string; label: string }>,
    value,
    onChange,
  }: {
    options?: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <fieldset>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name="engine"
            value={option.value}
            checked={value === option.value}
            onChange={(event) => {
              if (event.target.checked) {
                onChange?.(option.value);
              }
            }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  ),
}));

vi.mock('../../canvas/WorkflowVariableInput', () => ({
  WorkflowVariableInput: (props: { value?: string; onChange?: (value: string) => void }) => (
    <input
      aria-label="calculation-expression"
      value={props.value ?? ''}
      onChange={(event) => props.onChange?.(event.target.value)}
    />
  ),
}));

import { CalculationFieldset } from '../components/calculation';

function renderFieldset(initialValues?: Record<string, unknown>) {
  function Wrapper() {
    const [form] = Form.useForm();

    return (
      <Form form={form} initialValues={initialValues}>
        <CalculationFieldset />
      </Form>
    );
  }

  return render(<Wrapper />);
}

describe('CalculationFieldset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows expression syntax errors from the selected engine validator', async () => {
    renderFieldset({
      config: {
        expression: '',
      },
    });

    fireEvent.change(screen.getByLabelText('calculation-expression'), { target: { value: 'BAD' } });
    fireEvent.blur(screen.getByLabelText('calculation-expression'));

    await waitFor(() => {
      expect(screen.getByText('Expression syntax error')).toBeInTheDocument();
    });
  });

  it('renders the syntax reference link for engines that provide one', () => {
    renderFieldset({
      config: {},
    });

    expect(screen.getByText('Syntax references')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://formula.example');
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DateCalculationFieldset } from '../components/dateCalculation';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();

  return {
    ...actual,
    Dropdown: ({
      children,
      menu,
    }: {
      children: React.ReactNode;
      menu?: {
        items?: Array<{ key?: React.Key; children?: Array<{ key?: React.Key; label?: React.ReactNode }> }>;
        onClick?: (info: { key: React.Key }) => void;
      };
    }) => (
      <div>
        {children}
        {menu?.items?.map(
          (group) =>
            group.children?.map((item) => (
              <button key={String(item.key)} type="button" onClick={() => menu.onClick?.({ key: item.key ?? '' })}>
                {item.label}
              </button>
            )),
        )}
      </div>
    ),
  };
});

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  RadioWithTooltip: ({
    options = [] as Array<{ value: string | boolean; label: React.ReactNode }>,
    value,
    onChange,
  }: {
    options?: Array<{ value: string | boolean; label: React.ReactNode }>;
    value?: string | boolean;
    onChange?: (value: string | boolean) => void;
  }) => (
    <fieldset>
      {options.map((option) => (
        <label key={String(option.value)}>
          <input
            type="radio"
            name="radio-group"
            value={String(option.value)}
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
  WorkflowTypedVariableInput: ({
    value,
    onChange,
  }: {
    value?: string | number | Date | null;
    onChange?: (value: string) => void;
  }) => (
    <input
      aria-label="typed-variable-input"
      value={String(value ?? '')}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

function renderFieldset(initialValues?: Record<string, unknown>) {
  let form: FormInstance | undefined;

  function Wrapper() {
    const [instance] = Form.useForm();
    form = instance;

    return (
      <Form form={instance} initialValues={initialValues}>
        <DateCalculationFieldset />
      </Form>
    );
  }

  const result = render(<Wrapper />);

  return {
    ...result,
    getValues: () => form?.getFieldsValue(true),
    getForm: () => form,
  };
}

describe('DateCalculationFieldset', () => {
  it('shows the default input type selection after the form initializes defaults', async () => {
    renderFieldset({
      config: {},
    });

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Date type/i })).toBeChecked();
      expect(screen.getByLabelText('typed-variable-input')).toHaveValue('{{$system.now}}');
    });
  });

  it('clears configured steps when the input type changes', async () => {
    const { getForm, getValues } = renderFieldset({
      config: {
        steps: [
          {
            function: 'add',
            arguments: {
              number: 1,
              unit: 'day',
            },
          },
        ],
      },
    });

    await act(async () => {
      getForm()?.setFieldValue(['config', 'inputType'], 'number');
    });

    await waitFor(() => {
      expect(getValues()?.config.steps).toEqual([]);
    });
  });

  it('adds a new step with the selected function defaults', async () => {
    const { getValues } = renderFieldset({
      config: {
        steps: [],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Add step/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Add a range/ }));

    await waitFor(() => {
      expect(getValues()?.config.steps).toEqual([
        {
          function: 'add',
          arguments: {
            number: 1,
            unit: 'day',
          },
        },
      ]);
    });
  });

  it('renders the remove button only for the last step', async () => {
    const { container } = renderFieldset({
      config: {
        steps: [
          {
            function: 'add',
            arguments: {
              number: 1,
              unit: 'day',
            },
          },
          {
            function: 'subtract',
            arguments: {
              number: 1,
              unit: 'day',
            },
          },
        ],
      },
    });

    await waitFor(() => {
      expect(container.querySelectorAll('button[aria-label="Remove"]')).toHaveLength(1);
    });
  });
});

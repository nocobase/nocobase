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
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ScriptFieldset } from '../components/script';
import { SCRIPT_DEFAULT_CONFIG, type ScriptNodeConfig } from '../shared';

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  useWorkflowVariableOptions: () => [],
}));

type MockTypedVariableInputProps = {
  disabled?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  value?: unknown;
};

vi.mock('@nocobase/client-v2', () => ({
  TypedVariableInput: ({ disabled = false, onChange, placeholder, value }: MockTypedVariableInputProps) => (
    <input
      aria-label="typed-variable-input"
      data-disabled={String(disabled)}
      disabled={disabled}
      value={typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value)}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

type MockCodeEditorProps = {
  disabled?: boolean;
  onChange?: (value: string) => void;
  value?: string;
};

vi.mock('../../components/CodeEditor', () => ({
  default: ({ disabled = false, onChange, value = '' }: MockCodeEditorProps) => (
    <textarea
      aria-label="code-editor"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

function renderFieldset({
  disabled = false,
  initialValues,
}: {
  disabled?: boolean;
  initialValues?: { config?: Partial<ScriptNodeConfig> };
} = {}) {
  return render(
    <Form layout="vertical" disabled={disabled} initialValues={initialValues}>
      <ScriptFieldset />
    </Form>,
  );
}

function FormValueProbe() {
  const form = Form.useFormInstance();
  const argumentsValue = Form.useWatch(['config', 'arguments'], form);
  return <pre data-testid="arguments-value">{JSON.stringify(argumentsValue ?? null)}</pre>;
}

describe('ScriptFieldset', () => {
  it('backfills the v1-equivalent defaults for partial configs', async () => {
    renderFieldset({ initialValues: { config: {} } });

    expect(await screen.findByLabelText('code-editor')).toHaveValue(SCRIPT_DEFAULT_CONFIG.content);
    expect(screen.getByRole('spinbutton')).toHaveDisplayValue(String(SCRIPT_DEFAULT_CONFIG.timeout));
    expect(screen.getByRole('checkbox', { name: 'Continue when exception thrown' })).not.toBeChecked();
  });

  it('validates argument names against the JavaScript identifier rule', async () => {
    renderFieldset({
      initialValues: {
        config: {
          arguments: [{ name: 'validName', value: '1' }],
        },
      },
    });

    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: '1-invalid' } });
    fireEvent.blur(screen.getByPlaceholderText('Name'));

    await waitFor(() => {
      expect(screen.getByText('Argument name is invalid')).toBeInTheDocument();
    });
  });

  it('validates argument names as unique within the list', async () => {
    renderFieldset({
      initialValues: {
        config: {
          arguments: [
            { name: 'duplicated', value: '1' },
            { name: 'another', value: '2' },
          ],
        },
      },
    });

    const nameInputs = screen.getAllByPlaceholderText('Name');
    fireEvent.change(nameInputs[1], { target: { value: 'duplicated' } });
    fireEvent.blur(nameInputs[1]);

    await waitFor(() => {
      expect(screen.getByText('Argument name duplicated')).toBeInTheDocument();
    });
  });

  it('propagates the executed read-only state to custom controls and list actions', async () => {
    renderFieldset({
      disabled: true,
      initialValues: {
        config: {
          arguments: [{ name: 'arg1', value: 'value1' }],
        },
      },
    });

    expect(await screen.findByLabelText('code-editor')).toBeDisabled();
    expect(screen.getByLabelText('typed-variable-input')).toBeDisabled();
    expect(screen.getByLabelText('typed-variable-input')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: /Add argument/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('adds a new argument with constant-string as the default value type', async () => {
    render(
      <Form layout="vertical">
        <ScriptFieldset />
        <FormValueProbe />
      </Form>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Add argument/ }));

    await waitFor(() => {
      expect(screen.getByTestId('arguments-value')).toHaveTextContent('[{"value":""}]');
    });
  });
});

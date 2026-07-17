/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockClient } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import React, { useState } from 'react';
import { vi } from 'vitest';

import LightExtensionCredentialInput, {
  formatLightExtensionSecretAuthRef,
  validateLightExtensionCredential,
  type LightExtensionCredentialValidation,
  type LightExtensionEnvironmentVariableRecord,
} from '../components/LightExtensionSecretVariableInput';

const variables = [
  { name: 'SYNC_SECRET', type: 'secret' },
  { name: 'PUBLIC_SETTING', type: 'default' },
];
const loadVariables = async () => variables;

function renderWithEngine(node: React.ReactNode) {
  const app = createMockClient();
  return render(<FlowEngineProvider engine={app.flowEngine}>{node}</FlowEngineProvider>);
}

function ControlledCredentialInput(props: {
  onValidationChange?: (value: LightExtensionCredentialValidation) => void;
  loadEnvironmentVariables?: () => Promise<LightExtensionEnvironmentVariableRecord[]>;
}) {
  const [value, setValue] = useState('');
  return (
    <LightExtensionCredentialInput
      loadEnvironmentVariables={props.loadEnvironmentVariables || loadVariables}
      onChange={setValue}
      onValidationChange={props.onValidationChange}
      value={value}
    />
  );
}

describe('LightExtensionCredentialInput', () => {
  it('uses one input to show only secret candidates and emit an environment expression', async () => {
    const user = userEvent.setup();
    renderWithEngine(<ControlledCredentialInput />);

    const input = screen.getByRole('combobox', { name: 'GitHub token' });
    expect(input).toHaveAttribute('type', 'password');
    await user.click(input);

    expect(await screen.findByText('SYNC_SECRET')).toBeInTheDocument();
    expect(screen.queryByText('PUBLIC_SETTING')).not.toBeInTheDocument();

    await user.click(screen.getByText('SYNC_SECRET'));
    const selectedInput = screen.getByRole('combobox', { name: 'GitHub token' });
    expect(selectedInput).toHaveValue('{{ $env.SYNC_SECRET }}');
    expect(selectedInput).not.toHaveAttribute('type', 'password');
  });

  it('accepts a directly entered token from the same password input', async () => {
    const user = userEvent.setup();
    const onValidationChange = vi.fn();
    renderWithEngine(<ControlledCredentialInput onValidationChange={onValidationChange} />);

    const input = screen.getByRole('combobox', { name: 'GitHub token' });
    await user.type(input, 'github_pat_test_direct_123');

    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({
        valid: true,
        authRef: 'github_pat_test_direct_123',
      }),
    );
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects ordinary variables, missing secrets, and mixed expressions', async () => {
    const onValidationChange = vi.fn();
    renderWithEngine(<ControlledCredentialInput onValidationChange={onValidationChange} />);

    let input = screen.getByRole('combobox', { name: 'GitHub token' });
    fireEvent.change(input, { target: { value: '{{ $env.PUBLIC_SETTING }}' } });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Select an existing secret variable or enter a GitHub token',
    );

    input = screen.getByRole('combobox', { name: 'GitHub token' });
    fireEvent.change(input, { target: { value: '{{ $env.MISSING_SECRET }}' } });
    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({ valid: false, reason: 'secret-not-found' }),
    );

    input = screen.getByRole('combobox', { name: 'GitHub token' });
    fireEvent.change(input, { target: { value: 'Bearer {{ $env.SYNC_SECRET }}' } });
    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({ valid: false, reason: 'invalid-expression' }),
    );
  });

  it('keeps direct token input available when secret variables fail to load', async () => {
    const user = userEvent.setup();
    const onValidationChange = vi.fn();
    const loadEnvironmentVariables = vi.fn(async (): Promise<LightExtensionEnvironmentVariableRecord[]> => {
      throw new Error('load failed');
    });
    renderWithEngine(
      <ControlledCredentialInput
        loadEnvironmentVariables={loadEnvironmentVariables}
        onValidationChange={onValidationChange}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'GitHub token' });
    await user.type(input, 'github_pat_test_direct_123');
    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({
        valid: true,
        authRef: 'github_pat_test_direct_123',
      }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '{{ $env.SYNC_SECRET }}' } });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load secret variables');
    const expressionInput = screen.getByRole('combobox', { name: 'GitHub token' });
    expect(expressionInput).toHaveAttribute('aria-invalid', 'true');
    expect(expressionInput).toHaveAttribute('aria-describedby', alert.id);
  });

  it('validates empty values, exact secret references, and literal tokens independently of secret loading', () => {
    const candidates = [{ name: 'SYNC_SECRET', authRef: formatLightExtensionSecretAuthRef('SYNC_SECRET') }];

    expect(validateLightExtensionCredential('', candidates)).toEqual({ valid: true });
    expect(validateLightExtensionCredential('{{ $env.SYNC_SECRET }}', candidates)).toEqual({
      valid: true,
      authRef: '{{ $env.SYNC_SECRET }}',
    });
    expect(validateLightExtensionCredential(' github_pat_test_direct_123 ', candidates, 'failed')).toEqual({
      valid: true,
      authRef: 'github_pat_test_direct_123',
    });
    expect(validateLightExtensionCredential('{{ $env.SYNC_SECRET }}', candidates, 'failed')).toEqual({
      valid: false,
      reason: 'load-failed',
    });
    expect(validateLightExtensionCredential('prefix {{ $env.SYNC_SECRET }}', candidates)).toEqual({
      valid: false,
      reason: 'invalid-expression',
    });
    expect(validateLightExtensionCredential('x'.repeat(256), candidates)).toEqual({
      valid: false,
      reason: 'invalid-token',
    });
    expect(validateLightExtensionCredential('unsafe\nvalue', candidates)).toEqual({
      valid: false,
      reason: 'invalid-token',
    });
  });
});

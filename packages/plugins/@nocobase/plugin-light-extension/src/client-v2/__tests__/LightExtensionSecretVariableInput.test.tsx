/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
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
  initialValue?: string;
  onValidationChange?: (value: LightExtensionCredentialValidation) => void;
  loadEnvironmentVariables?: () => Promise<LightExtensionEnvironmentVariableRecord[]>;
}) {
  const [value, setValue] = useState(props.initialValue || '');
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
  it('shows only Secret candidates and emits an environment expression', async () => {
    const user = userEvent.setup();
    const onValidationChange = vi.fn();
    renderWithEngine(<ControlledCredentialInput onValidationChange={onValidationChange} />);

    const input = screen.getByRole('combobox', { name: 'GitHub credential' });
    await user.click(input);

    expect(await screen.findByText('SYNC_SECRET')).toBeInTheDocument();
    expect(screen.queryByText('PUBLIC_SETTING')).not.toBeInTheDocument();

    await user.click(screen.getByText('SYNC_SECRET'));
    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({
        valid: true,
        authRef: '{{ $env.SYNC_SECRET }}',
      }),
    );
  });

  it('does not accept a directly typed token as a selected value', async () => {
    const user = userEvent.setup();
    const onValidationChange = vi.fn();
    renderWithEngine(<ControlledCredentialInput onValidationChange={onValidationChange} />);

    const input = screen.getByRole('combobox', { name: 'GitHub credential' });
    await user.type(input, 'github_pat_test_direct_123');
    await user.keyboard('{Enter}');

    expect(onValidationChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ authRef: 'github_pat_test_direct_123' }),
    );
  });

  it('rejects ordinary variables and missing Secrets supplied by existing drafts', async () => {
    const onValidationChange = vi.fn();
    renderWithEngine(
      <ControlledCredentialInput initialValue="{{ $env.PUBLIC_SETTING }}" onValidationChange={onValidationChange} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Select an existing Secret variable');
    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({ valid: false, reason: 'secret-not-found' }),
    );
  });

  it('reports a failed Secret-variable lookup for an existing reference', async () => {
    const onValidationChange = vi.fn();
    const loadEnvironmentVariables = vi.fn(async (): Promise<LightExtensionEnvironmentVariableRecord[]> => {
      throw new Error('load failed');
    });
    renderWithEngine(
      <ControlledCredentialInput
        initialValue="{{ $env.SYNC_SECRET }}"
        loadEnvironmentVariables={loadEnvironmentVariables}
        onValidationChange={onValidationChange}
      />,
    );

    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({
        valid: false,
        reason: 'load-failed',
      }),
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load secret variables');
    const expressionInput = screen.getByRole('combobox', { name: 'GitHub credential' });
    expect(expressionInput).toHaveAttribute('aria-invalid', 'true');
    expect(expressionInput).toHaveAttribute('aria-describedby', alert.id);
  });

  it('validates only empty values and exact known Secret references', () => {
    const candidates = [{ name: 'SYNC_SECRET', authRef: formatLightExtensionSecretAuthRef('SYNC_SECRET') }];

    expect(validateLightExtensionCredential('', candidates)).toEqual({ valid: true });
    expect(validateLightExtensionCredential('{{ $env.SYNC_SECRET }}', candidates)).toEqual({
      valid: true,
      authRef: '{{ $env.SYNC_SECRET }}',
    });
    expect(validateLightExtensionCredential('{{ $env.SYNC_SECRET }}', candidates, 'failed')).toEqual({
      valid: false,
      reason: 'load-failed',
    });
    expect(validateLightExtensionCredential('prefix {{ $env.SYNC_SECRET }}', candidates)).toEqual({
      valid: false,
      reason: 'invalid-expression',
    });
    expect(validateLightExtensionCredential('github_pat_test_direct_123', candidates)).toEqual({
      valid: false,
      reason: 'invalid-expression',
    });
    expect(validateLightExtensionCredential('{{ $env.MISSING_SECRET }}', candidates)).toEqual({
      valid: false,
      reason: 'secret-not-found',
    });
  });
});

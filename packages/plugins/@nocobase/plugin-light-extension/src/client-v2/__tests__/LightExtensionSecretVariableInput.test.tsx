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

import LightExtensionSecretVariableInput, {
  formatLightExtensionSecretAuthRef,
  validateLightExtensionSecretAuthRef,
  type LightExtensionSecretAuthRefValidation,
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

function ControlledSecretInput(props: { onValidationChange?: (value: LightExtensionSecretAuthRefValidation) => void }) {
  const [value, setValue] = useState('');
  return (
    <LightExtensionSecretVariableInput
      loadEnvironmentVariables={loadVariables}
      onChange={setValue}
      onValidationChange={props.onValidationChange}
      value={value}
    />
  );
}

describe('LightExtensionSecretVariableInput', () => {
  it('shows only secret candidates and emits an EnvVariableInput-compatible expression', async () => {
    const user = userEvent.setup();
    renderWithEngine(<ControlledSecretInput />);

    const input = screen.getByRole('combobox', { name: 'Token secret' });
    await user.click(input);

    expect(await screen.findByText('SYNC_SECRET')).toBeInTheDocument();
    expect(screen.queryByText('PUBLIC_SETTING')).not.toBeInTheDocument();

    await user.click(screen.getByText('SYNC_SECRET'));
    expect(input).toHaveValue('{{ $env.SYNC_SECRET }}');
  });

  it('rejects literals, ordinary variables, and references that are not in the secret candidates', async () => {
    const user = userEvent.setup();
    const onValidationChange = vi.fn();
    renderWithEngine(<ControlledSecretInput onValidationChange={onValidationChange} />);

    const input = screen.getByRole('combobox', { name: 'Token secret' });
    await user.type(input, 'literal-value');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token secret must be a complete environment variable expression',
    );

    await user.clear(input);
    fireEvent.change(input, { target: { value: '{{ $env.PUBLIC_SETTING }}' } });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token secret must reference an existing secret variable',
    );

    fireEvent.change(input, { target: { value: '{{ $env.MISSING_SECRET }}' } });
    await waitFor(() =>
      expect(onValidationChange).toHaveBeenLastCalledWith({ valid: false, reason: 'secret-not-found' }),
    );
  });

  it('validates empty public-repository auth and exact secret references', () => {
    const candidates = [{ name: 'SYNC_SECRET', authRef: formatLightExtensionSecretAuthRef('SYNC_SECRET') }];

    expect(validateLightExtensionSecretAuthRef('', candidates)).toEqual({ valid: true });
    expect(validateLightExtensionSecretAuthRef('{{ $env.SYNC_SECRET }}', candidates)).toEqual({
      valid: true,
      authRef: '{{ $env.SYNC_SECRET }}',
    });
    expect(validateLightExtensionSecretAuthRef('prefix {{ $env.SYNC_SECRET }}', candidates)).toEqual({
      valid: false,
      reason: 'invalid-expression',
    });
  });
});

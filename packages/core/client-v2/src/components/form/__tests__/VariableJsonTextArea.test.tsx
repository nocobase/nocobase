/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowContextProvider } from '@nocobase/flow-engine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { VariableJsonTextArea } from '../VariableJsonTextArea';

function createContextWithEnv() {
  const ctx = new FlowContext();
  (ctx as unknown as { t: (key: string) => string }).t = (key: string) => key;

  ctx.defineProperty('$env', {
    value: { API_KEY: 'secret' },
    meta: {
      title: 'Env',
      type: 'object',
      properties: {
        API_KEY: { title: 'API Key', type: 'string' },
      },
    },
  });

  return ctx;
}

function renderWithCtx(ctx: FlowContext, node: React.ReactNode) {
  return render(<FlowContextProvider context={ctx}>{node}</FlowContextProvider>);
}

describe('VariableJsonTextArea', () => {
  it('formats object values and emits parsed JSON on blur', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();

    renderWithCtx(ctx, <VariableJsonTextArea value={{ foo: 'bar' }} onChange={handleChange} />);

    const textArea = await screen.findByRole('textbox');
    expect(textArea).toHaveValue('{\n  "foo": "bar"\n}');

    fireEvent.change(textArea, { target: { value: '{"foo":"baz"}' } });
    fireEvent.blur(textArea);

    expect(handleChange).toHaveBeenCalledWith({ foo: 'baz' });
    expect(textArea).toHaveValue('{\n  "foo": "baz"\n}');
  });

  it('shows JSON parse errors and does not emit invalid values', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();

    renderWithCtx(ctx, <VariableJsonTextArea value={{}} onChange={handleChange} />);

    const textArea = await screen.findByRole('textbox');
    fireEvent.change(textArea, { target: { value: '{' } });
    fireEvent.blur(textArea);

    expect(handleChange).not.toHaveBeenCalled();
    expect(await screen.findByText(/JSON/)).toBeInTheDocument();
  });

  it('inserts selected variables with the client-v2 template format', async () => {
    const ctx = createContextWithEnv();

    renderWithCtx(ctx, <VariableJsonTextArea value={null} namespaces={['$env']} onChange={() => undefined} />);

    fireEvent.click(await screen.findByRole('button', { name: 'variable-json-switcher' }));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Env'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('API Key'));
    });

    expect(await screen.findByRole('textbox')).toHaveValue('{{ ctx.$env.API_KEY }}');
  });
});

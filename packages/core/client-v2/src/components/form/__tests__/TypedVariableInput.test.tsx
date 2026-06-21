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
import { TypedVariableInput } from '../TypedVariableInput';

function createContextWithEnv() {
  const ctx = new FlowContext();
  (ctx as any).t = (key: string) => key;

  ctx.defineProperty('$env', {
    value: { SMTP_PORT: 465, SECURE_FLAG: true },
    meta: {
      title: 'Env',
      type: 'object',
      properties: {
        SMTP_PORT: { title: 'SMTP Port', type: 'number' },
        SECURE_FLAG: { title: 'Secure flag', type: 'boolean' },
      },
    },
  });

  return ctx;
}

function renderWithCtx(ctx: FlowContext, node: React.ReactNode) {
  return render(<FlowContextProvider context={ctx}>{node}</FlowContextProvider>);
}

describe('TypedVariableInput - constant rendering', () => {
  it('renders an InputNumber for a numeric value when types=[number]', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={465}
        types={[['number', { min: 1, max: 65535 }]]}
        namespaces={['$env']}
        onChange={() => undefined}
      />,
    );
    const numberInput = await screen.findByDisplayValue('465');
    expect(numberInput).toBeInTheDocument();
    expect(numberInput.getAttribute('role')).toBe('spinbutton');
  });

  it('renders a boolean Select when value is true and types=[boolean]', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={true} types={['boolean']} namespaces={['$env']} onChange={() => undefined} />,
    );
    await waitFor(() => {
      // antd Select renders the chosen item label via a selection-item span
      const item = screen.getByText('True');
      expect(item).toBeInTheDocument();
    });
  });

  it('renders the Null placeholder when value=null and nullable=true', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={null} types={['number']} namespaces={['$env']} nullable onChange={() => undefined} />,
    );
    // Uses placeholder slot (not value) so antd's grey placeholder colour
    // applies — see comment in TypedVariableInput.tsx.
    const nullInput = await screen.findByPlaceholderText('<Null>');
    expect(nullInput).toBeInTheDocument();
    expect(nullInput.getAttribute('readonly')).not.toBeNull();
  });
});

describe('TypedVariableInput - variable rendering', () => {
  it('renders a labelled pill when value is a {{ $env.X }} expression', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value="{{$env.SMTP_PORT}}"
        types={['number']}
        namespaces={['$env']}
        onChange={() => undefined}
      />,
    );
    await waitFor(() => {
      const tag = screen.getByRole('button', { name: 'variable-tag' });
      expect(tag.textContent).toContain('Env');
      expect(tag.textContent).toContain('SMTP Port');
    });
  });

  it('clears back to null when the close button is clicked (nullable=true)', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value="{{$env.SMTP_PORT}}"
        types={['number']}
        namespaces={['$env']}
        nullable
        onChange={handleChange}
      />,
    );
    const clear = await screen.findByRole('button', { name: 'icon-close' });
    fireEvent.click(clear);
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('clears back to default-of-first-type when nullable=false', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value="{{$env.SMTP_PORT}}"
        types={['number']}
        namespaces={['$env']}
        nullable={false}
        onChange={handleChange}
      />,
    );
    const clear = await screen.findByRole('button', { name: 'icon-close' });
    fireEvent.click(clear);
    expect(handleChange).toHaveBeenCalledWith(0);
  });
});

describe('TypedVariableInput - editor onChange propagation', () => {
  it('forwards numeric edits via onChange', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(ctx, <TypedVariableInput value={465} types={['number']} onChange={handleChange} />);
    const numberInput = await screen.findByDisplayValue('465');
    fireEvent.change(numberInput, { target: { value: '587' } });
    // antd InputNumber may emit on blur; force blur to flush
    fireEvent.blur(numberInput);
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toBe(587);
  });
});

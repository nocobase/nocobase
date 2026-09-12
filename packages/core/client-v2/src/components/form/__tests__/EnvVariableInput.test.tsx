/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FlowContext, FlowContextProvider, MetaTreeNode } from '@nocobase/flow-engine';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EnvVariableInput, formatEnvPath, parseEnvPath } from '../EnvVariableInput';

function createContextWithEnv() {
  const ctx = new FlowContext();
  (ctx as any).t = (key: string) => key;

  ctx.defineProperty('$env', {
    value: { API_KEY: 'secret', BASE_URL: 'https://example.com' },
    meta: {
      title: 'Env',
      type: 'object',
      properties: {
        API_KEY: { title: 'API Key', type: 'string' },
        BASE_URL: { title: 'Base URL', type: 'string' },
      },
    },
  });

  ctx.defineProperty('$user', {
    value: { name: 'John' },
    meta: {
      title: 'User',
      type: 'object',
      properties: {
        name: { title: 'Name', type: 'string' },
      },
    },
  });

  return ctx;
}

function renderWithCtx(ctx: FlowContext, node: React.ReactNode) {
  return render(<FlowContextProvider context={ctx}>{node}</FlowContextProvider>);
}

describe('parseEnvPath', () => {
  it('parses single segment', () => {
    expect(parseEnvPath('{{ $env.API_KEY }}')).toEqual(['$env', 'API_KEY']);
  });

  it('parses nested segments', () => {
    expect(parseEnvPath('{{ $env.foo.bar.baz }}')).toEqual(['$env', 'foo', 'bar', 'baz']);
  });

  it('trims surrounding whitespace', () => {
    expect(parseEnvPath('   {{ $env.API_KEY }}   ')).toEqual(['$env', 'API_KEY']);
  });

  it('returns undefined for plain text', () => {
    expect(parseEnvPath('plain value')).toBeUndefined();
  });

  it('returns undefined for non-$env variable', () => {
    expect(parseEnvPath('{{ $user.name }}')).toBeUndefined();
  });

  it('returns undefined for mixed content', () => {
    expect(parseEnvPath('prefix {{ $env.API_KEY }} suffix')).toBeUndefined();
  });

  it('returns undefined for empty / undefined', () => {
    expect(parseEnvPath('')).toBeUndefined();
    expect(parseEnvPath(undefined)).toBeUndefined();
  });
});

describe('formatEnvPath', () => {
  it('formats a single nested env path', () => {
    expect(formatEnvPath({ paths: ['$env', 'API_KEY'] } as MetaTreeNode)).toBe('{{ $env.API_KEY }}');
  });

  it('formats multi-level env path', () => {
    expect(formatEnvPath({ paths: ['$env', 'foo', 'bar'] } as MetaTreeNode)).toBe('{{ $env.foo.bar }}');
  });

  it('returns undefined for non-$env namespace', () => {
    expect(formatEnvPath({ paths: ['$user', 'name'] } as MetaTreeNode)).toBeUndefined();
  });

  it('returns undefined for $env root only', () => {
    expect(formatEnvPath({ paths: ['$env'] } as MetaTreeNode)).toBeUndefined();
  });

  it('returns undefined for empty meta', () => {
    expect(formatEnvPath(undefined)).toBeUndefined();
    expect(formatEnvPath({ paths: [] } as MetaTreeNode)).toBeUndefined();
  });
});

describe('EnvVariableInput component', () => {
  it('renders contenteditable editor with the variable selector button', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(ctx, <EnvVariableInput value="" onChange={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'textbox' })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('renders the variable as a styled pill when value is a $env expression', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(ctx, <EnvVariableInput value="{{ $env.API_KEY }}" onChange={() => undefined} />);

    await waitFor(() => {
      const tag = screen.getByText((_, node) => node?.textContent === 'Env/API Key' && node.tagName === 'SPAN');
      expect(tag).toBeInTheDocument();
      expect(tag.className).toContain('nb-variable-tag');
    });
  });

  it('renders password input when value is plain text and password=true', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(ctx, <EnvVariableInput value="my-secret" password onChange={() => undefined} />);

    const input = await screen.findByDisplayValue('my-secret');
    expect(input).toBeInTheDocument();
    expect(input.getAttribute('type')).toBe('password');
  });

  it('does NOT mask when value is a $env expression even with password=true', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(ctx, <EnvVariableInput value="{{ $env.API_KEY }}" password onChange={() => undefined} />);

    await waitFor(() => {
      const tag = screen.getByText((_, node) => node?.textContent === 'Env/API Key' && node.tagName === 'SPAN');
      expect(tag).toBeInTheDocument();
    });
    expect(screen.queryByDisplayValue('{{ $env.API_KEY }}')).not.toBeInTheDocument();
  });

  it('propagates onChange when typing into the password input', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(ctx, <EnvVariableInput value="initial" password onChange={handleChange} />);

    const input = await screen.findByDisplayValue('initial');
    fireEvent.change(input, { target: { value: 'next-value' } });
    expect(handleChange).toHaveBeenCalledWith('next-value');
  });

  it('renders placeholder text on the editor', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(ctx, <EnvVariableInput value="" placeholder="enter or pick" onChange={() => undefined} />);

    await waitFor(() => {
      const editor = screen.getByRole('textbox', { name: 'textbox' });
      expect(editor.getAttribute('data-placeholder')).toBe('enter or pick');
    });
  });

  it('honors disabled state', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(ctx, <EnvVariableInput value="" disabled onChange={() => undefined} />);

    await waitFor(() => {
      const editor = screen.getByRole('textbox', { name: 'textbox' });
      expect(editor.getAttribute('contenteditable')).toBe('false');
    });
  });
});

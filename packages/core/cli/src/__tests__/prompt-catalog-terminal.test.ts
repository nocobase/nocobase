/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  confirm: vi.fn(),
  placeholderInput: vi.fn(),
  passwordInput: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  select: mocks.select,
  confirm: mocks.confirm,
}));

vi.mock('../lib/inquirer-placeholder-input.ts', () => ({
  placeholderInput: mocks.placeholderInput,
}));

vi.mock('../lib/inquirer-password-input.ts', () => ({
  passwordInput: mocks.passwordInput,
}));

const stdinIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
const stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

function setInteractive(interactive: boolean) {
  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    value: interactive,
  });
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value: interactive,
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  setInteractive(true);
});

afterEach(() => {
  if (stdinIsTTY) {
    Object.defineProperty(process.stdin, 'isTTY', stdinIsTTY);
  }
  if (stdoutIsTTY) {
    Object.defineProperty(process.stdout, 'isTTY', stdoutIsTTY);
  }
});

test('runPromptCatalog adapts async text validate results for placeholder input', async () => {
  mocks.placeholderInput.mockImplementation(async (options: { validate?: (value: string) => Promise<true | string> }) => {
    await expect(options.validate?.('dd')).resolves.toBe(true);
    await expect(options.validate?.('x')).resolves.toBe('too short');
    return 'dd';
  });

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog({
    env: {
      type: 'text',
      message: 'Env',
      validate: async (value) => (String(value).length >= 2 ? undefined : 'too short'),
    },
  });

  expect(result).toEqual({ env: 'dd' });
  expect(mocks.placeholderInput).toHaveBeenCalledTimes(1);
});

test('runPromptCatalog passes default bullet mask and async password validate to password input', async () => {
  mocks.passwordInput.mockImplementation(async (options: {
    mask?: boolean | string;
    validate?: (value: string) => Promise<true | string>;
  }) => {
    expect(options.mask).toBe('•');
    await expect(options.validate?.('secret')).resolves.toBe(true);
    await expect(options.validate?.('x')).resolves.toBe('too short');
    return 'secret';
  });

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog({
    password: {
      type: 'password',
      message: 'Password',
      validate: async (value) => (String(value).length >= 6 ? undefined : 'too short'),
    },
  });

  expect(result).toEqual({ password: 'secret' });
  expect(mocks.passwordInput).toHaveBeenCalledTimes(1);
});

test('runPromptCatalog styles select answers with a new cyan prompt line', async () => {
  mocks.select.mockImplementation(async (options: {
    theme?: {
      style?: {
        answer?: (text: string) => string;
      };
    };
  }) => {
    const rendered = options.theme?.style?.answer?.('Online activation');
    expect(rendered).toContain('\n');
    expect(rendered).toContain('❯');
    expect(rendered).toContain('Online activation');
    return 'online';
  });

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog({
    mode: {
      type: 'select',
      message: 'Mode',
      options: ['online', 'offline'],
    },
  });

  expect(result).toEqual({ mode: 'online' });
  expect(mocks.select).toHaveBeenCalledTimes(1);
});

test('runPromptCatalog styles confirm answers as Yes/No on a new cyan prompt line', async () => {
  mocks.confirm.mockImplementation(async (options: {
    transformer?: (value: boolean) => string;
    theme?: {
      style?: {
        answer?: (text: string) => string;
      };
    };
  }) => {
    expect(options.transformer?.(true)).toBe('Yes');
    expect(options.transformer?.(false)).toBe('No');

    const rendered = options.theme?.style?.answer?.('Yes');
    expect(rendered).toContain('\n');
    expect(rendered).toContain('❯');
    expect(rendered).toContain('Yes');
    return true;
  });

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog({
    confirmInstall: {
      type: 'boolean',
      message: 'Continue?',
      initialValue: true,
    },
  });

  expect(result).toEqual({ confirmInstall: true });
  expect(mocks.confirm).toHaveBeenCalledTimes(1);
});

test('runPromptCatalog skips preset validation for hidden fields', async () => {
  const hiddenValidate = vi.fn(async () => 'should not run');
  mocks.select.mockResolvedValue('no');

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog({
    hasNocobase: {
      type: 'select',
      message: 'Already have app?',
      options: ['no', 'yes'],
      initialValue: 'no',
    },
    apiBaseUrl: {
      type: 'text',
      message: 'API base URL',
      hidden: (values) => values.hasNocobase !== 'yes',
      validate: hiddenValidate,
    },
  }, {
    values: {
      hasNocobase: 'no',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
    },
  });

  expect(result).toEqual({ hasNocobase: 'no' });
  expect(hiddenValidate).not.toHaveBeenCalled();
  expect(mocks.placeholderInput).not.toHaveBeenCalled();
});

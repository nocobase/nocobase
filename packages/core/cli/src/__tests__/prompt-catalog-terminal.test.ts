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
  input: vi.fn(),
  password: vi.fn(),
}));

vi.mock('../lib/inquirer.ts', () => ({
  select: mocks.select,
  confirm: mocks.confirm,
  input: mocks.input,
  password: mocks.password,
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

test('runPromptCatalog adapts async text validate results for input', async () => {
  mocks.input.mockImplementation(async (options: { validate?: (value: string) => Promise<true | string> }) => {
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
  expect(mocks.input).toHaveBeenCalledTimes(1);
});

test('runPromptCatalog passes default bullet mask and async password validate to password', async () => {
  mocks.password.mockImplementation(
    async (options: { mask?: boolean | string; validate?: (value: string) => Promise<true | string> }) => {
      expect(options.mask).toBe('•');
      await expect(options.validate?.('secret')).resolves.toBe(true);
      await expect(options.validate?.('x')).resolves.toBe('too short');
      return 'secret';
    },
  );

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog({
    password: {
      type: 'password',
      message: 'Password',
      validate: async (value) => (String(value).length >= 6 ? undefined : 'too short'),
    },
  });

  expect(result).toEqual({ password: 'secret' });
  expect(mocks.password).toHaveBeenCalledTimes(1);
});

test('runPromptCatalog forwards select options through the shared inquirer layer', async () => {
  mocks.select.mockResolvedValue('online');

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
  expect(mocks.select).toHaveBeenCalledWith({
    message: 'Mode',
    choices: [
      { value: 'online', name: 'online' },
      { value: 'offline', name: 'offline' },
    ],
    default: 'online',
  });
});

test('runPromptCatalog forwards confirm prompts through the shared inquirer layer', async () => {
  mocks.confirm.mockResolvedValue(true);

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
  expect(mocks.confirm).toHaveBeenCalledWith({
    message: 'Continue?',
    default: true,
  });
});

test('runPromptCatalog skips preset validation for hidden fields', async () => {
  const hiddenValidate = vi.fn(async () => 'should not run');
  mocks.select.mockResolvedValue('no');

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog(
    {
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
    },
    {
      values: {
        hasNocobase: 'no',
        apiBaseUrl: 'http://127.0.0.1:13000/api',
      },
    },
  );

  expect(result).toEqual({ hasNocobase: 'no' });
  expect(hiddenValidate).not.toHaveBeenCalled();
  expect(mocks.input).not.toHaveBeenCalled();
});

test('runPromptCatalog throws on missing non-interactive required text by default', async () => {
  setInteractive(false);

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  await expect(
    runPromptCatalog({
      env: {
        type: 'text',
        message: 'Env',
        required: true,
      },
    }),
  ).rejects.toThrow(/required/i);

  expect(mocks.input).not.toHaveBeenCalled();
});

test('runPromptCatalog includes non-catalog initial values when computing prompt defaults', async () => {
  mocks.input.mockResolvedValue('registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16');

  const { runPromptCatalog } = await import('../lib/prompt-catalog-terminal.ts');

  const result = await runPromptCatalog(
    {
      builtinDbImage: {
        type: 'text',
        message: 'Built-in database Docker image',
        initialValue: (values) => String(values.builtinDbImageRegistry ?? '').trim() || 'postgres:16',
      },
    },
    {
      initialValues: {
        builtinDbImageRegistry: 'registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16',
      },
    },
  );

  expect(result).toEqual({
    builtinDbImage: 'registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16',
  });
  expect(mocks.input).toHaveBeenCalledWith(
    expect.objectContaining({
      default: 'registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16',
    }),
  );
});

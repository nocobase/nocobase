/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentEnvName: vi.fn(),
  getEnv: vi.fn(),
  updateEnvConnection: vi.fn(),
  authenticateEnvWithOauth: vi.fn(),
  runPromptCatalog: vi.fn(),
  printStage: vi.fn(),
  startTask: vi.fn(),
  stopTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
}));

vi.mock('../lib/auth-store.ts', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
  updateEnvConnection: mocks.updateEnvConnection,
  resolveConfiguredAuthType: (config?: { authType?: string; auth?: { type?: string } }) => config?.authType ?? config?.auth?.type,
}));

vi.mock('../lib/env-auth.ts', () => ({
  authenticateEnvWithOauth: mocks.authenticateEnvWithOauth,
}));

vi.mock('../lib/prompt-catalog.ts', () => ({
  runPromptCatalog: mocks.runPromptCatalog,
}));

vi.mock('../lib/ui.ts', () => ({
  printStage: mocks.printStage,
  startTask: mocks.startTask,
  stopTask: mocks.stopTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('env auth falls back to the current env and refreshes oauth envs', async () => {
  const { default: EnvAuth } = await import('../commands/env/auth.js');
  mocks.getCurrentEnvName.mockResolvedValue('staging');
  mocks.getEnv.mockResolvedValue({
    name: 'staging',
    config: {
      authType: 'oauth',
    },
  });
  mocks.updateEnvConnection.mockResolvedValue(undefined);
  mocks.authenticateEnvWithOauth.mockResolvedValue(undefined);
  const runCommand = vi.fn(async () => undefined);

  const command = Object.assign(Object.create(EnvAuth.prototype), {
    parse: vi.fn(async () => ({
      args: {},
      flags: {},
    })),
    config: {
      runCommand,
    },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvAuth.prototype.run.call(command);

  expect(mocks.getCurrentEnvName.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(mocks.getEnv.mock.calls).toEqual([['staging', { scope: 'global' }]]);
  expect(mocks.updateEnvConnection.mock.calls).toEqual([[
    'staging',
    { authType: 'oauth' },
    { scope: 'global' },
  ]]);
  expect(mocks.authenticateEnvWithOauth.mock.calls).toEqual([[{ envName: 'staging', scope: 'global' }]]);
  expect(mocks.printStage.mock.calls).toEqual([
    ['Authenticating'],
  ]);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Starting browser sign-in for "staging"...'],
  ]);
  expect(mocks.stopTask.mock.calls).toEqual([[]]);
  expect(runCommand.mock.calls).toEqual([
    ['env:update', ['staging']],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['✔ Authenticated "staging".'],
  ]);
  expect(mocks.failTask.mock.calls.length).toBe(0);
});

test('env auth prompts for a token when the env uses token auth', async () => {
  const { default: EnvAuth } = await import('../commands/env/auth.js');
  mocks.getEnv.mockResolvedValue({
    name: 'staging',
    config: {
      authType: 'token',
    },
  });
  mocks.runPromptCatalog.mockResolvedValue({
    accessToken: 'token-123',
  });
  mocks.updateEnvConnection.mockResolvedValue(undefined);
  const runCommand = vi.fn(async () => undefined);

  const command = Object.assign(Object.create(EnvAuth.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: {},
    })),
    config: {
      runCommand,
    },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvAuth.prototype.run.call(command);

  expect(mocks.runPromptCatalog).toHaveBeenCalledTimes(1);
  expect(Object.keys(mocks.runPromptCatalog.mock.calls[0][0] ?? {})).toEqual([
    'authType',
    'accessToken',
  ]);
  expect(mocks.updateEnvConnection.mock.calls).toEqual([[
    'staging',
    { authType: 'token', accessToken: 'token-123' },
    { scope: 'global' },
  ]]);
  expect(mocks.authenticateEnvWithOauth).not.toHaveBeenCalled();
  expect(runCommand.mock.calls).toEqual([
    ['env:update', ['staging']],
  ]);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Saving access token for "staging"...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['✔ Authenticated "staging".'],
  ]);
});

test('env auth prompts for an access token when --auth-type token is provided without --access-token', async () => {
  const { default: EnvAuth } = await import('../commands/env/auth.js');
  mocks.getEnv.mockResolvedValue({
    name: 'staging',
    config: {
      authType: 'oauth',
    },
  });
  mocks.runPromptCatalog.mockResolvedValue({
    accessToken: 'prompted-token-123',
  });
  mocks.updateEnvConnection.mockResolvedValue(undefined);
  const runCommand = vi.fn(async () => undefined);

  const command = Object.assign(Object.create(EnvAuth.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { 'auth-type': 'token' },
    })),
    config: {
      runCommand,
    },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvAuth.prototype.run.call(command);

  expect(mocks.runPromptCatalog).toHaveBeenCalledTimes(1);
  expect(Object.keys(mocks.runPromptCatalog.mock.calls[0][0] ?? {})).toEqual([
    'authType',
    'accessToken',
  ]);
  expect(mocks.updateEnvConnection.mock.calls).toEqual([[
    'staging',
    { authType: 'token', accessToken: 'prompted-token-123' },
    { scope: 'global' },
  ]]);
  expect(runCommand.mock.calls).toEqual([
    ['env:update', ['staging']],
  ]);
});

test('env auth rejects an explicitly empty --access-token', async () => {
  const { default: EnvAuth } = await import('../commands/env/auth.js');
  mocks.getEnv.mockResolvedValue({
    name: 'staging',
    config: {
      authType: 'token',
    },
  });

  const command = Object.assign(Object.create(EnvAuth.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { 'access-token': '' },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect((() => EnvAuth.prototype.run.call(command))()).rejects.toThrow(
    /--access-token cannot be empty\./,
  );
});

test('env auth rejects conflicting environment names from arg and --env', async () => {
  const { default: EnvAuth } = await import('../commands/env/auth.js');

  const command = Object.assign(Object.create(EnvAuth.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'prod' },
      flags: { env: 'staging' },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect((() => EnvAuth.prototype.run.call(command))()).rejects.toThrow(/Please use only one/);
});

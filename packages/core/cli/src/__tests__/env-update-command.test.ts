/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentEnvName: vi.fn(),
  getEnv: vi.fn(),
  replaceEnvConfig: vi.fn(),
  updateEnvRuntime: vi.fn(),
  setVerboseMode: vi.fn(),
  startTask: vi.fn(),
  stopTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  printInfo: vi.fn(),
  printVerbose: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
  replaceEnvConfig: mocks.replaceEnvConfig,
}));

vi.mock('../lib/bootstrap.js', () => ({
  updateEnvRuntime: mocks.updateEnvRuntime,
}));

vi.mock('../lib/ui.js', () => ({
  setVerboseMode: mocks.setVerboseMode,
  startTask: mocks.startTask,
  stopTask: mocks.stopTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
  printInfo: mocks.printInfo,
  printVerbose: mocks.printVerbose,
}));

function createEnv(overrides: Record<string, any> = {}) {
  return {
    name: 'local',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    authType: 'token',
    auth: {
      type: 'token',
      accessToken: 'old-token',
    },
    config: {
      kind: 'local',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'token',
      source: 'npm',
      downloadVersion: 'latest',
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('env update refreshes runtime when no config flags are provided', async () => {
  const { default: EnvUpdate } = await import('../commands/env/update.js');
  mocks.getCurrentEnvName.mockResolvedValue('local');
  mocks.updateEnvRuntime.mockResolvedValue({
    version: 'v1',
  });

  const command = Object.assign(Object.create(EnvUpdate.prototype), {
    parse: vi.fn(async () => ({
      args: {},
      flags: {
        verbose: false,
      },
    })),
  });

  await EnvUpdate.prototype.run.call(command);

  expect(mocks.replaceEnvConfig).not.toHaveBeenCalled();
  expect(mocks.updateEnvRuntime).toHaveBeenCalledWith(
    expect.objectContaining({
      envName: undefined,
      scope: 'global',
      verbose: false,
    }),
  );
});

test('env update saves config without refreshing runtime for saved app settings', async () => {
  const { default: EnvUpdate } = await import('../commands/env/update.js');
  mocks.getEnv.mockResolvedValue(createEnv());
  mocks.replaceEnvConfig.mockResolvedValue(undefined);

  const command = Object.assign(Object.create(EnvUpdate.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        'app-port': '13080',
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvUpdate.prototype.run.call(command);

  expect(mocks.replaceEnvConfig).toHaveBeenCalledWith(
    'local',
    expect.objectContaining({
      kind: 'local',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'token',
      accessToken: 'old-token',
      appPort: '13080',
    }),
    { scope: 'global' },
  );
  expect(mocks.updateEnvRuntime).not.toHaveBeenCalled();
  expect(mocks.printInfo).toHaveBeenCalledWith(
    'Saved env config was updated. Runtime commands were not refreshed automatically.',
  );
  expect(mocks.printInfo).toHaveBeenCalledWith(
    "Run `nb app restart --env local` when you're ready to apply these changes.",
  );
});

test('env update refreshes runtime after saving a new api base url', async () => {
  const { default: EnvUpdate } = await import('../commands/env/update.js');
  mocks.getEnv.mockResolvedValue(createEnv());
  mocks.replaceEnvConfig.mockResolvedValue(undefined);
  mocks.updateEnvRuntime.mockResolvedValue({
    version: 'v2',
  });

  const command = Object.assign(Object.create(EnvUpdate.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        'api-base-url': 'http://127.0.0.1:13001/api',
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvUpdate.prototype.run.call(command);

  expect(mocks.replaceEnvConfig).toHaveBeenCalledWith(
    'local',
    expect.objectContaining({
      apiBaseUrl: 'http://127.0.0.1:13001/api',
    }),
    { scope: 'global' },
  );
  expect(mocks.updateEnvRuntime).toHaveBeenCalledWith(
    expect.objectContaining({
      envName: 'local',
      scope: 'global',
    }),
  );
});

test('env update supports unsetting saved fields', async () => {
  const { default: EnvUpdate } = await import('../commands/env/update.js');
  mocks.getEnv.mockResolvedValue(
    createEnv({
      authType: 'basic',
      auth: undefined,
      config: {
        kind: 'http',
        apiBaseUrl: 'http://127.0.0.1:13000/api',
        authType: 'basic',
        authUsername: 'admin',
        gitUrl: 'https://example.com/nocobase.git',
      },
    }),
  );
  mocks.replaceEnvConfig.mockResolvedValue(undefined);

  const command = Object.assign(Object.create(EnvUpdate.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        unset: ['git-url', 'username'],
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvUpdate.prototype.run.call(command);

  const savedConfig = mocks.replaceEnvConfig.mock.calls[0]?.[1];
  expect(savedConfig).not.toHaveProperty('gitUrl');
  expect(savedConfig).not.toHaveProperty('authUsername');
  expect(savedConfig).toMatchObject({
    kind: 'http',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    authType: 'basic',
  });
});

test('env update rejects username updates when the env is not using basic auth', async () => {
  const { default: EnvUpdate } = await import('../commands/env/update.js');
  mocks.getEnv.mockResolvedValue(createEnv());

  const command = Object.assign(Object.create(EnvUpdate.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        username: 'admin',
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvUpdate.prototype.run.call(command)).rejects.toThrow(
    '--username can only be used when the env uses basic authentication.',
  );
});

test('env update keeps saved config changes when runtime refresh fails', async () => {
  const { default: EnvUpdate } = await import('../commands/env/update.js');
  mocks.getEnv.mockResolvedValue(createEnv());
  mocks.replaceEnvConfig.mockResolvedValue(undefined);
  mocks.updateEnvRuntime.mockRejectedValue(new Error('boom'));

  const command = Object.assign(Object.create(EnvUpdate.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        'access-token': 'new-token',
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvUpdate.prototype.run.call(command)).rejects.toThrow(
    'Saved env config for "local", but failed to refresh the runtime.',
  );
  expect(mocks.replaceEnvConfig).toHaveBeenCalledWith(
    'local',
    expect.objectContaining({
      authType: 'token',
      accessToken: 'new-token',
    }),
    { scope: 'global' },
  );
});

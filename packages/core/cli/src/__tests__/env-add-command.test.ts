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
  runPromptCatalog: vi.fn(),
  upsertEnv: vi.fn(),
  setCurrentEnv: vi.fn(),
  setVerboseMode: vi.fn(),
  printStage: vi.fn(),
  printSuccess: vi.fn(),
  printVerbose: vi.fn(),
  printInfo: vi.fn(),
}));

vi.mock('../lib/prompt-catalog.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/prompt-catalog.js')>();
  return {
    ...actual,
    runPromptCatalog: mocks.runPromptCatalog,
  };
});

vi.mock('../lib/auth-store.js', () => ({
  upsertEnv: mocks.upsertEnv,
  setCurrentEnv: mocks.setCurrentEnv,
}));

vi.mock('../lib/ui.js', () => ({
  setVerboseMode: mocks.setVerboseMode,
  printStage: mocks.printStage,
  printSuccess: mocks.printSuccess,
  printVerbose: mocks.printVerbose,
  printInfo: mocks.printInfo,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('env add saves builtinDb into env config when provided by install', async () => {
  const { default: EnvAdd } = await import('../commands/env/add.js');
  mocks.runPromptCatalog.mockResolvedValue({
    name: 'local',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    authType: 'token',
    accessToken: 'token-123',
  });
  mocks.upsertEnv.mockResolvedValue(undefined);
  mocks.setCurrentEnv.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(EnvAdd.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        'api-base-url': 'http://127.0.0.1:13000/api',
        'auth-type': 'token',
        'access-token': 'token-123',
        source: 'docker',
        'download-version': 'alpha',
        'docker-registry': 'nocobase/nocobase',
        'docker-platform': 'linux/arm64',
        'npm-registry': 'https://registry.npmmirror.com',
        build: false,
        'build-dts': false,
        'app-key': 'app-key-123',
        timezone: 'Asia/Shanghai',
        'builtin-db': true,
        'builtin-db-image': 'registry.example.com/postgres:16',
        'db-schema': 'test',
        'db-table-prefix': 'nb_',
        'db-underscored': true,
        'root-username': 'admin',
        'root-email': 'admin@nocobase.com',
        'root-password': 'admin123',
        'root-nickname': 'Admin',
      },
    })),
    config: {
      runCommand,
    },
  });

  await EnvAdd.prototype.run.call(command);

  expect(mocks.upsertEnv.mock.calls[0]).toEqual([
    'local',
    {
      kind: 'docker',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      source: 'docker',
      downloadVersion: 'alpha',
      dockerRegistry: 'nocobase/nocobase',
      dockerPlatform: 'linux/arm64',
      npmRegistry: 'https://registry.npmmirror.com',
      build: false,
      buildDts: false,
      appKey: 'app-key-123',
      timezone: 'Asia/Shanghai',
      builtinDb: true,
      builtinDbImage: 'registry.example.com/postgres:16',
      dbSchema: 'test',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
      rootUsername: 'admin',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Admin',
      authType: 'token',
      accessToken: 'token-123',
    },
    { scope: 'global' },
  ]);
  expect(runCommand.mock.calls).toEqual([['env:update', ['local']]]);
  expect(mocks.setCurrentEnv).toHaveBeenCalledWith('local', { scope: 'global' });
  expect(mocks.printSuccess).toHaveBeenCalledWith('✔ Env "local" is ready.');
});

test('env add stores config globally by default', async () => {
  const { default: EnvAdd } = await import('../commands/env/add.js');
  mocks.runPromptCatalog.mockResolvedValue({
    name: 'local',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    authType: 'oauth',
  });
  mocks.upsertEnv.mockResolvedValue(undefined);
  mocks.setCurrentEnv.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(EnvAdd.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        'api-base-url': 'http://127.0.0.1:13000/api',
        'auth-type': 'oauth',
      },
    })),
    config: {
      runCommand,
    },
  });

  await EnvAdd.prototype.run.call(command);

  expect(mocks.upsertEnv.mock.calls[0]).toEqual([
    'local',
    {
      kind: 'http',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'oauth',
    },
    { scope: 'global' },
  ]);
  expect(runCommand.mock.calls).toEqual([
    ['env:auth', ['local']],
    ['env:update', ['local']],
  ]);
  expect(mocks.setCurrentEnv).toHaveBeenCalledWith('local', { scope: 'global' });
  expect(mocks.printSuccess).toHaveBeenCalledWith('✔ Env "local" is ready.');
});

test('env add can defer authentication and tell the user to run env auth later', async () => {
  const { default: EnvAdd } = await import('../commands/env/add.js');
  mocks.runPromptCatalog.mockResolvedValue({
    name: 'local',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    authType: 'token',
  });
  mocks.upsertEnv.mockResolvedValue(undefined);
  mocks.setCurrentEnv.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(EnvAdd.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        'api-base-url': 'http://127.0.0.1:13000/api',
        'auth-type': 'token',
        'skip-auth': true,
      },
    })),
    config: {
      runCommand,
    },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvAdd.prototype.run.call(command);

  expect(mocks.runPromptCatalog).toHaveBeenCalledTimes(1);
  const promptCatalog = mocks.runPromptCatalog.mock.calls[0]?.[0];
  expect(promptCatalog?.accessToken?.hidden?.({ authType: 'token' })).toBe(true);
  expect(mocks.upsertEnv.mock.calls[0]).toEqual([
    'local',
    {
      kind: 'http',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'token',
    },
    { scope: 'global' },
  ]);
  expect(runCommand).not.toHaveBeenCalled();
  expect(mocks.printSuccess).toHaveBeenCalledWith('✔ Env "local" was saved.');
  expect(mocks.printInfo).toHaveBeenCalledWith(
    'Authentication was skipped for env "local". Run `nb env auth local` to finish setup. You will be prompted for an access token.',
  );
});

test('env add explains that deferred basic auth will prompt for username and password', async () => {
  const { default: EnvAdd } = await import('../commands/env/add.js');
  mocks.runPromptCatalog.mockResolvedValue({
    name: 'local',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    authType: 'basic',
    username: 'admin',
  });
  mocks.upsertEnv.mockResolvedValue(undefined);
  mocks.setCurrentEnv.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(EnvAdd.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        verbose: false,
        'api-base-url': 'http://127.0.0.1:13000/api',
        'auth-type': 'basic',
        username: 'admin',
        'skip-auth': true,
      },
    })),
    config: {
      runCommand,
    },
  });

  await EnvAdd.prototype.run.call(command);

  expect(runCommand).not.toHaveBeenCalled();
  expect(mocks.printInfo).toHaveBeenCalledWith(
    'Authentication was skipped for env "local". Run `nb env auth local` to finish setup. You will be prompted for a username and password.',
  );
});

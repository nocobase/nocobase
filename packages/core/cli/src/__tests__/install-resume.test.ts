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
  getEnv: vi.fn(),
  promptInfo: vi.fn(),
  promptStep: vi.fn(),
  promptWarn: vi.fn(),
  promptIntro: vi.fn(),
  promptOutro: vi.fn(),
  promptCancel: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

vi.mock('../lib/prompt-catalog.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/prompt-catalog.js')>();
  return {
    ...actual,
    runPromptCatalog: mocks.runPromptCatalog,
  };
});

vi.mock('../lib/auth-store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth-store.js')>();
  return {
    ...actual,
    getEnv: (...args: Parameters<typeof actual.getEnv>) => {
      const impl = mocks.getEnv.getMockImplementation();
      if (impl) {
        return mocks.getEnv(...args);
      }
      return actual.getEnv(...args);
    },
  };
});

vi.mock('@clack/prompts', () => ({
  intro: mocks.promptIntro,
  log: {
    info: mocks.promptInfo,
    step: mocks.promptStep,
    warn: mocks.promptWarn,
  },
  outro: mocks.promptOutro,
  cancel: mocks.promptCancel,
}));

test('install --resume reuses the saved workspace env config for prompt values', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'app1',
    config: {
      baseUrl: 'http://127.0.0.1:13080/api',
      auth: {
        type: 'token',
        accessToken: 'resume-token',
      },
      source: 'docker',
      downloadVersion: 'alpha',
      dockerRegistry: 'nocobase/nocobase',
      dockerPlatform: 'linux/arm64',
      appRootPath: './app1/source/',
      appPort: '13080',
      storagePath: './app1/storage/',
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'registry.example.com/postgres:16',
      dbHost: 'app1-postgres',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
      build: false,
      buildDts: true,
    },
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    ...(options.initialValues ?? {}),
    ...(options.values ?? {}),
  }));

  const command = Object.create(Install.prototype);
  const result = await (
    Install.prototype as unknown as {
      collectPromptResults: (
        parsed: Record<string, unknown>,
        yes: boolean,
      ) => Promise<{
        envName: string;
        appResults: Record<string, unknown>;
        downloadResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        envAddResults: Record<string, unknown>;
      }>;
    }
  ).collectPromptResults.call(command, {
    resume: true,
    env: 'app1',
    yes: false,
    force: false,
    'fetch-source': false,
    'builtin-db': false,
  }, false);

  expect(mocks.getEnv.mock.calls.length).toBe(1);
  expect(mocks.getEnv.mock.calls[0]).toEqual([
    'app1',
    { scope: 'project' },
  ]);
  expect(result.envName).toBe('app1');
  expect(result.appResults.appRootPath).toBe('./app1/source/');
  expect(result.appResults.appPort).toBe('13080');
  expect(result.appResults.storagePath).toBe('./app1/storage/');
  expect(result.appResults.fetchSource).toBe(true);
  expect(result.downloadResults.source).toBe('docker');
  expect(result.downloadResults.version).toBe('alpha');
  expect(result.downloadResults.dockerRegistry).toBe('nocobase/nocobase');
  expect(result.downloadResults.dockerPlatform).toBe('linux/arm64');
  expect(result.downloadResults.build).toBe(false);
  expect(result.downloadResults.buildDts).toBe(true);
  expect(result.dbResults.builtinDb).toBe(true);
  expect(result.dbResults.dbDialect).toBe('postgres');
  expect(result.dbResults.builtinDbImage).toBe('registry.example.com/postgres:16');
  expect(result.dbResults.dbHost).toBe('app1-postgres');
  expect(result.dbResults.dbPort).toBe('5432');
  expect(result.dbResults.dbDatabase).toBe('nocobase');
  expect(result.dbResults.dbUser).toBe('nocobase');
  expect(result.dbResults.dbPassword).toBe('secret');
  expect(result.envAddResults.authType).toBe('token');
  expect(result.envAddResults.accessToken).toBe('resume-token');
  expect(result.envAddResults.apiBaseUrl).toBe('http://127.0.0.1:13080/api');
});

test('install --resume fails with a clear message when the env is missing', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue(undefined);

  const command = Object.create(Install.prototype);
  await expect((() =>
      (
        Install.prototype as unknown as {
          collectPromptResults: (
            parsed: Record<string, unknown>,
            yes: boolean,
          ) => Promise<unknown>;
        }
      ).collectPromptResults.call(command, {
        resume: true,
        env: 'missing',
        yes: false,
        force: false,
        'fetch-source': false,
        'builtin-db': false,
      }, false))()).rejects.toThrow(/Env "missing" is not configured in this workspace\./);

  expect(mocks.runPromptCatalog.mock.calls.length).toBe(0);
});

test('install --resume --yes requires setup-only flags that are not saved in env config', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'app1',
    config: {
      source: 'docker',
      appRootPath: './app1/source/',
      appPort: '13080',
      storagePath: './app1/storage/',
    },
  });

  const command = Object.create(Install.prototype);
  await expect((() =>
      (
        Install.prototype as unknown as {
          collectPromptResults: (
            parsed: Record<string, unknown>,
            yes: boolean,
          ) => Promise<unknown>;
        }
      ).collectPromptResults.call(command, {
        resume: true,
        env: 'app1',
        yes: true,
        force: false,
        'fetch-source': false,
        'builtin-db': false,
      }, true))()).rejects.toThrow(/These setup-only flags are not saved in the env config: --lang, --root-username, --root-email, --root-password, --root-nickname/);

  expect(mocks.runPromptCatalog.mock.calls.length).toBe(0);
});

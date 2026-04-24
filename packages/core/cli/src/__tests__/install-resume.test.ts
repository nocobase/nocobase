/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { beforeEach, test, vi } from 'vitest';

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

  assert.equal(mocks.getEnv.mock.calls.length, 1);
  assert.deepEqual(mocks.getEnv.mock.calls[0], [
    'app1',
    { scope: 'project' },
  ]);
  assert.equal(result.envName, 'app1');
  assert.equal(result.appResults.appRootPath, './app1/source/');
  assert.equal(result.appResults.appPort, '13080');
  assert.equal(result.appResults.storagePath, './app1/storage/');
  assert.equal(result.appResults.fetchSource, true);
  assert.equal(result.downloadResults.source, 'docker');
  assert.equal(result.downloadResults.version, 'alpha');
  assert.equal(result.downloadResults.dockerRegistry, 'nocobase/nocobase');
  assert.equal(result.downloadResults.dockerPlatform, 'linux/arm64');
  assert.equal(result.downloadResults.build, false);
  assert.equal(result.downloadResults.buildDts, true);
  assert.equal(result.dbResults.builtinDb, true);
  assert.equal(result.dbResults.dbDialect, 'postgres');
  assert.equal(result.dbResults.dbHost, 'app1-postgres');
  assert.equal(result.dbResults.dbPort, '5432');
  assert.equal(result.dbResults.dbDatabase, 'nocobase');
  assert.equal(result.dbResults.dbUser, 'nocobase');
  assert.equal(result.dbResults.dbPassword, 'secret');
  assert.equal(result.envAddResults.authType, 'token');
  assert.equal(result.envAddResults.accessToken, 'resume-token');
  assert.equal(result.envAddResults.apiBaseUrl, 'http://127.0.0.1:13080/api');
});

test('install --resume fails with a clear message when the env is missing', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue(undefined);

  const command = Object.create(Install.prototype);
  await assert.rejects(
    () =>
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
      }, false),
    /Env "missing" is not configured in this workspace\./,
  );

  assert.equal(mocks.runPromptCatalog.mock.calls.length, 0);
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
  await assert.rejects(
    () =>
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
      }, true),
    /These setup-only flags are not saved in the env config: --lang, --root-username, --root-email, --root-password, --root-nickname/,
  );

  assert.equal(mocks.runPromptCatalog.mock.calls.length, 0);
});

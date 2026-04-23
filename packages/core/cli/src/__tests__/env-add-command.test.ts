/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runPromptCatalog: vi.fn(),
  upsertEnv: vi.fn(),
  setVerboseMode: vi.fn(),
  printVerbose: vi.fn(),
  intro: vi.fn(),
  outro: vi.fn(),
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
}));

vi.mock('../lib/ui.js', () => ({
  setVerboseMode: mocks.setVerboseMode,
  printVerbose: mocks.printVerbose,
}));

vi.mock('@clack/prompts', () => ({
  intro: mocks.intro,
  outro: mocks.outro,
}));

test('env add saves builtinDb into env config when provided by install', async () => {
  const { default: EnvAdd } = await import('../commands/env/add.js');
  mocks.runPromptCatalog.mockResolvedValue({
    name: 'local',
    scope: 'project',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    authType: 'token',
    accessToken: 'token-123',
  });
  mocks.upsertEnv.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(EnvAdd.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'local' },
      flags: {
        scope: 'project',
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
      },
    })),
    config: {
      runCommand,
    },
  });

  await EnvAdd.prototype.run.call(command);

  assert.deepEqual(mocks.upsertEnv.mock.calls[0], [
    'local',
    {
      baseUrl: 'http://127.0.0.1:13000/api',
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
      accessToken: 'token-123',
    },
    { scope: 'project' },
  ]);
  assert.deepEqual(runCommand.mock.calls, [
    ['env:update', ['local']],
  ]);
});

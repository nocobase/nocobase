/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveManagedAppRuntime: vi.fn(),
  buildEnvProxyConfig: vi.fn(),
  announceTargetEnv: vi.fn(),
  startTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
}));

vi.mock('../lib/app-runtime.js', () => ({
  resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
  formatMissingManagedAppEnvMessage: vi.fn((envName?: string) => `missing:${envName ?? ''}`),
}));

vi.mock('../lib/env-proxy.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/env-proxy.ts')>('../lib/env-proxy.ts');
  return {
    ...actual,
    buildEnvProxyConfig: mocks.buildEnvProxyConfig,
  };
});

vi.mock('../lib/ui.js', () => ({
  announceTargetEnv: mocks.announceTargetEnv,
  startTask: mocks.startTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
}));

let tempRoot = '';

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-env-proxy-command-'));
  process.env.NB_CLI_ROOT = tempRoot;
  vi.clearAllMocks();
});

afterEach(async () => {
  delete process.env.NB_CLI_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('env proxy writes the generated config to the default proxy path', async () => {
  const { default: EnvProxy } = await import('../commands/env/proxy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyConfig.mockResolvedValue({
    content: 'server {}\n',
  });

  const command = Object.assign(Object.create(EnvProxy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
      },
    })),
  });

  await EnvProxy.prototype.run.call(command);

  const outputPath = path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'app.conf');
  await expect(readFile(outputPath, 'utf8')).resolves.toBe('server {}\n');
  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('demo');
  expect(mocks.succeedTask).toHaveBeenCalledTimes(1);
});

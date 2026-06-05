/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir as fsMkdir, mkdtemp, readFile, rm, writeFile as fsWriteFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveManagedAppRuntime: vi.fn(),
  buildEnvProxyConfig: vi.fn(),
  buildLegacyEnvProxyConfig: vi.fn(),
  resolveEnvProxyProvider: vi.fn(),
  installEnvProxyProvider: vi.fn(),
  reloadEnvProxyProvider: vi.fn(),
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
    buildLegacyEnvProxyConfig: mocks.buildLegacyEnvProxyConfig,
    resolveEnvProxyProvider: mocks.resolveEnvProxyProvider,
    installEnvProxyProvider: mocks.installEnvProxyProvider,
    reloadEnvProxyProvider: mocks.reloadEnvProxyProvider,
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
  mocks.resolveEnvProxyProvider.mockResolvedValue('nginx');
  mocks.buildLegacyEnvProxyConfig.mockResolvedValue({
    content: 'legacy app.conf\n',
  });
  mocks.installEnvProxyProvider.mockResolvedValue({
    configPath: '/tmp/nginx.conf',
    status: 'installed',
  });
  mocks.reloadEnvProxyProvider.mockResolvedValue(undefined);
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
    content: 'location / {}\n',
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

  const outputPath = path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'generated.conf');
  const appConfigPath = path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'app.conf');
  const sharedOutputPath = path.join(tempRoot, '.nocobase', 'proxy', 'nginx.conf');
  await expect(readFile(outputPath, 'utf8')).resolves.toBe('location / {}\n');
  await expect(readFile(appConfigPath, 'utf8')).resolves.toContain(`include ${outputPath};`);
  await expect(readFile(sharedOutputPath, 'utf8')).resolves.toContain(
    `include ${path.join(tempRoot, '.nocobase', 'proxy', '*', 'app.conf')};`,
  );
  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('demo');
  expect(mocks.succeedTask).toHaveBeenLastCalledWith(
    `Saved generated proxy config for env "demo" at ${outputPath}, and created editable app entry config at ${appConfigPath}.`,
  );
});

test('env proxy installs and reloads the provider when requested', async () => {
  const { default: EnvProxy } = await import('../commands/env/proxy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyConfig.mockResolvedValue({
    content: 'location / {}\n',
  });

  const command = Object.assign(Object.create(EnvProxy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        install: true,
        reload: true,
      },
    })),
  });

  await EnvProxy.prototype.run.call(command);

  expect(mocks.resolveEnvProxyProvider).toHaveBeenCalledWith(undefined, { scope: 'global' });
  expect(mocks.installEnvProxyProvider).toHaveBeenCalledWith('nginx', { scope: 'global' });
  expect(mocks.reloadEnvProxyProvider).toHaveBeenCalledWith('nginx', { scope: 'global' });
  expect(mocks.startTask.mock.calls.map(([message]) => message)).toEqual([
    'Generating proxy config for env "demo"...',
    'Installing the shared proxy config into nginx...',
    'Validating and reloading nginx...',
  ]);
  expect(mocks.succeedTask.mock.calls.map(([message]) => message)).toEqual([
    `Saved generated proxy config for env "demo" at ${path.join(
      tempRoot,
      '.nocobase',
      'proxy',
      'demo',
      'generated.conf',
    )}, and created editable app entry config at ${path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'app.conf')}.`,
    'Installed the shared proxy config into the nginx main config at /tmp/nginx.conf.',
    'Validated and reloaded nginx.',
  ]);
});

test('env proxy keeps an existing editable app entry config that already includes generated.conf', async () => {
  const { default: EnvProxy } = await import('../commands/env/proxy.js');
  const appConfigPath = path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'app.conf');
  const generatedPath = path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'generated.conf');

  await rm(path.dirname(appConfigPath), { recursive: true, force: true });
  await fsMkdir(path.dirname(appConfigPath), { recursive: true });
  await fsWriteFile(
    appConfigPath,
    `server {\n    listen 80;\n    include ${generatedPath};\n    server_name demo.local;\n}\n`,
    'utf8',
  );

  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyConfig.mockResolvedValue({
    content: 'location / {}\n',
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

  await expect(readFile(appConfigPath, 'utf8')).resolves.toContain('server_name demo.local;');
  expect(mocks.buildLegacyEnvProxyConfig).not.toHaveBeenCalled();
  expect(mocks.succeedTask).toHaveBeenLastCalledWith(
    `Saved generated proxy config for env "demo" at ${generatedPath}.`,
  );
});

test('env proxy migrates a legacy managed app.conf into an editable entry config', async () => {
  const { default: EnvProxy } = await import('../commands/env/proxy.js');
  const appConfigPath = path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'app.conf');
  const generatedPath = path.join(tempRoot, '.nocobase', 'proxy', 'demo', 'generated.conf');

  await rm(path.dirname(appConfigPath), { recursive: true, force: true });
  await fsMkdir(path.dirname(appConfigPath), { recursive: true });
  await fsWriteFile(appConfigPath, 'legacy app.conf\n', 'utf8');

  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyConfig.mockResolvedValue({
    content: 'location / {}\n',
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

  await expect(readFile(appConfigPath, 'utf8')).resolves.toContain(`include ${generatedPath};`);
  expect(mocks.buildLegacyEnvProxyConfig).toHaveBeenCalledTimes(1);
  expect(mocks.succeedTask).toHaveBeenLastCalledWith(
    `Saved generated proxy config for env "demo" at ${generatedPath}, and migrated the app entry config at ${appConfigPath}.`,
  );
});

test('env proxy rejects --print with --reload', async () => {
  const { default: EnvProxy } = await import('../commands/env/proxy.js');
  const command = Object.assign(Object.create(EnvProxy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: true,
        reload: true,
        install: false,
      },
    })),
    error: vi.fn((message: string) => {
      throw new Error(message);
    }),
  });

  await expect(EnvProxy.prototype.run.call(command)).rejects.toThrow(
    '`--print` cannot be combined with `--install` or `--reload`.',
  );
});

test('env proxy rejects --output with --install', async () => {
  const { default: EnvProxy } = await import('../commands/env/proxy.js');
  const command = Object.assign(Object.create(EnvProxy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        output: './proxy.conf',
        install: true,
        reload: false,
      },
    })),
    error: vi.fn((message: string) => {
      throw new Error(message);
    }),
  });

  await expect(EnvProxy.prototype.run.call(command)).rejects.toThrow(
    '`--output` cannot be combined with `--install` or `--reload` in the current implementation.',
  );
});

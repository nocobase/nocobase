/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setCliConfigValue } from '../lib/cli-config.js';

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
}));

vi.mock('../lib/run-npm.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/run-npm.js')>('../lib/run-npm.js');
  return {
    ...actual,
    run: mocks.run,
  };
});

let tempRoot = '';
let mainConfigPath = '';

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-env-proxy-caddy-'));
  mainConfigPath = path.join(tempRoot, 'Caddyfile');
  process.env.NB_CLI_ROOT = tempRoot;
  process.env.CADDY_CONFIG = mainConfigPath;
  await writeFile(mainConfigPath, ':80 {\n    respond "ok"\n}\n', 'utf8');
  vi.clearAllMocks();
  mocks.run.mockImplementation(async (_name: string, args: string[]) => {
    if (args[0] === 'validate') {
      return;
    }

    if (args[0] === 'reload') {
      return;
    }

    throw new Error(`Unexpected run call: ${args.join(' ')}`);
  });
});

afterEach(async () => {
  delete process.env.NB_CLI_ROOT;
  delete process.env.CADDY_CONFIG;
  await rm(tempRoot, { recursive: true, force: true });
});

test('installEnvProxyProvider injects the shared import into the Caddyfile idempotently', async () => {
  const { installEnvProxyProvider, resolveEnvProxyMainOutputPath } = await import('../lib/env-proxy.ts');

  const first = await installEnvProxyProvider('caddy');
  const second = await installEnvProxyProvider('caddy');
  const content = await readFile(mainConfigPath, 'utf8');

  expect(first).toEqual({
    configPath: mainConfigPath,
    status: 'installed',
  });
  expect(second).toEqual({
    configPath: mainConfigPath,
    status: 'already-installed',
  });
  expect(content).toContain('# BEGIN NocoBase proxy');
  expect(content).toContain(`import ${resolveEnvProxyMainOutputPath({ provider: 'caddy' })}`);
  expect(content.match(/BEGIN NocoBase proxy/g)?.length).toBe(1);
});

test('installEnvProxyProvider injects the runtime-mapped shared import when proxy.nb-cli-root is configured', async () => {
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
  const { installEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await installEnvProxyProvider('caddy');
  const content = await readFile(mainConfigPath, 'utf8');

  expect(content).toContain('import /workspace/.nocobase/proxy/caddy/nocobase.caddy');
});

test('installEnvProxyProvider updates the managed import block when proxy.nb-cli-root changes', async () => {
  const { installEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await installEnvProxyProvider('caddy');
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
  await installEnvProxyProvider('caddy');
  const content = await readFile(mainConfigPath, 'utf8');

  expect(content).toContain('import /workspace/.nocobase/proxy/caddy/nocobase.caddy');
  expect(content).not.toContain(`import ${path.join(tempRoot, '.nocobase', 'proxy', 'caddy', 'nocobase.caddy')}`);
  expect(content.match(/BEGIN NocoBase proxy/g)?.length).toBe(1);
});

test('installEnvProxyProvider restores the original Caddyfile when validation fails', async () => {
  mocks.run.mockImplementation(async (_name: string, args: string[]) => {
    if (args[0] === 'validate') {
      throw new Error('caddy validate exited with code 1');
    }

    throw new Error(`Unexpected run call: ${args.join(' ')}`);
  });

  const original = await readFile(mainConfigPath, 'utf8');
  const { installEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await expect(installEnvProxyProvider('caddy')).rejects.toThrow(
    /Failed to install the Caddy import .* The original config was restored\./s,
  );
  await expect(readFile(mainConfigPath, 'utf8')).resolves.toBe(original);
});

test('reloadEnvProxyProvider validates and reloads Caddy after the import is installed', async () => {
  const { installEnvProxyProvider, reloadEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await installEnvProxyProvider('caddy');
  await reloadEnvProxyProvider('caddy');

  expect(mocks.run.mock.calls).toContainEqual([
    'caddy',
    ['reload', '--adapter', 'caddyfile', '--config', mainConfigPath],
    {
      errorName: 'caddy reload',
      stdio: 'ignore',
    },
  ]);
});

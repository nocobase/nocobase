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
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-env-proxy-nginx-'));
  mainConfigPath = path.join(tempRoot, 'nginx.conf');
  process.env.NB_CLI_ROOT = tempRoot;
  await writeFile(
    mainConfigPath,
    ['events {}', '', 'http {', '    include mime.types;', '    server { listen 8080; }', '}'].join('\n'),
    'utf8',
  );
  vi.clearAllMocks();
  mocks.run.mockImplementation(async (_name: string, args: string[], options?: Record<string, unknown>) => {
    if (args[0] === '-V') {
      (options?.onStderr as ((chunk: string) => void) | undefined)?.(
        `configure arguments: --conf-path=${mainConfigPath} --pid-path=${path.join(tempRoot, 'nginx.pid')}`,
      );
      return;
    }

    if (args[0] === '-t') {
      return;
    }

    if (args[0] === '-s' && args[1] === 'reload') {
      return;
    }

    throw new Error(`Unexpected run call: ${args.join(' ')}`);
  });
});

afterEach(async () => {
  delete process.env.NB_CLI_ROOT;
  await rm(tempRoot, { recursive: true, force: true });
});

test('installEnvProxyProvider injects the shared include into the nginx http block idempotently', async () => {
  const { installEnvProxyProvider, resolveEnvProxyMainOutputPath } = await import('../lib/env-proxy.ts');

  const first = await installEnvProxyProvider('nginx');
  const second = await installEnvProxyProvider('nginx');
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
  expect(content).toContain(`include ${resolveEnvProxyMainOutputPath()};`);
  expect(content.match(/BEGIN NocoBase proxy/g)?.length).toBe(1);
});

test('installEnvProxyProvider injects the runtime-mapped shared include when proxy.nb-cli-root is configured', async () => {
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
  const { installEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await installEnvProxyProvider('nginx');
  const content = await readFile(mainConfigPath, 'utf8');

  expect(content).toContain('include /workspace/.nocobase/proxy/nginx/nocobase.conf;');
});

test('installEnvProxyProvider updates the managed include block when proxy.nb-cli-root changes', async () => {
  const { installEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await installEnvProxyProvider('nginx');
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
  await installEnvProxyProvider('nginx');
  const content = await readFile(mainConfigPath, 'utf8');

  expect(content).toContain('include /workspace/.nocobase/proxy/nginx/nocobase.conf;');
  expect(content).not.toContain(`include ${path.join(tempRoot, '.nocobase', 'proxy', 'nginx', 'nocobase.conf')};`);
  expect(content.match(/BEGIN NocoBase proxy/g)?.length).toBe(1);
});

test('installEnvProxyProvider restores the original nginx config when validation fails', async () => {
  mocks.run.mockImplementation(async (_name: string, args: string[], options?: Record<string, unknown>) => {
    if (args[0] === '-V') {
      (options?.onStderr as ((chunk: string) => void) | undefined)?.(
        `configure arguments: --conf-path=${mainConfigPath} --pid-path=${path.join(tempRoot, 'nginx.pid')}`,
      );
      return;
    }

    if (args[0] === '-t') {
      throw new Error('nginx -t exited with code 1');
    }

    throw new Error(`Unexpected run call: ${args.join(' ')}`);
  });

  const original = await readFile(mainConfigPath, 'utf8');
  const { installEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await expect(installEnvProxyProvider('nginx')).rejects.toThrow(
    /Failed to install the nginx include .* The original config was restored\./s,
  );
  await expect(readFile(mainConfigPath, 'utf8')).resolves.toBe(original);
});

test('reloadEnvProxyProvider validates and reloads nginx after the include is installed', async () => {
  const { installEnvProxyProvider, reloadEnvProxyProvider } = await import('../lib/env-proxy.ts');

  await installEnvProxyProvider('nginx');
  await reloadEnvProxyProvider('nginx');

  expect(mocks.run.mock.calls).toContainEqual([
    'nginx',
    ['-s', 'reload'],
    {
      errorName: 'nginx -s reload',
      stdio: 'ignore',
    },
  ]);
});

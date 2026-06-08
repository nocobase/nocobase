/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import {
  defaultDockerEnvFilePath,
  resolveConfiguredDockerEnvFilePath,
  resolveDockerEnvFileArg,
  resolveDockerEnvFilePath,
} from '../lib/docker-env-file.ts';

const createdRoots: string[] = [];

afterEach(async () => {
  for (const dir of createdRoots.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
  delete process.env.NB_CLI_ROOT;
});

async function withCliRoot(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-envfile-'));
  createdRoots.push(root);
  process.env.NB_CLI_ROOT = root;
  await run(root);
}

test('docker env file defaults to <envName>/.env', () => {
  expect(defaultDockerEnvFilePath('local')).toBe('local/.env');
  expect(resolveConfiguredDockerEnvFilePath('local')).toBe('local/.env');
});

test('docker env file defaults to <app-path>/.env when appPath is saved', () => {
  expect(resolveConfiguredDockerEnvFilePath('local', { appPath: './apps/local/' })).toBe('./apps/local/.env');
});

test('docker env file infers <app-path>/.env from legacy source paths', () => {
  expect(resolveConfiguredDockerEnvFilePath('local', { appRootPath: './apps/local/source/' })).toBe(
    './apps/local/.env',
  );
});

test('docker env file resolves default relative paths under CLI root', async () => {
  await withCliRoot(async (root) => {
    expect(resolveDockerEnvFilePath('demo')).toBe(path.resolve(root, 'demo/.env'));
  });
});

test('docker env file arg uses the default file when it exists', async () => {
  await withCliRoot(async (root) => {
    const envDir = path.join(root, 'demo');
    await mkdir(envDir, { recursive: true });
    await writeFile(path.join(envDir, '.env'), 'FOO=bar\n');

    await expect(resolveDockerEnvFileArg('demo')).resolves.toBe(path.resolve(root, 'demo/.env'));
  });
});

test('docker env file arg skips the default file when it does not exist', async () => {
  await withCliRoot(async () => {
    await expect(resolveDockerEnvFileArg('missing')).resolves.toBe(undefined);
  });
});

test('docker env file arg throws when an explicit envFile is missing', async () => {
  await withCliRoot(async () => {
    await expect(resolveDockerEnvFileArg('demo', { envFile: './custom/.env' })).rejects.toThrow(
      /configured envFile.*\.\/custom\/\.env/i,
    );
  });
});

test('docker env file arg resolves an explicit envFile when it exists', async () => {
  await withCliRoot(async (root) => {
    const envDir = path.join(root, 'custom');
    await mkdir(envDir, { recursive: true });
    await writeFile(path.join(envDir, '.env'), 'FOO=bar\n');

    await expect(resolveDockerEnvFileArg('demo', { envFile: './custom/.env' })).resolves.toBe(
      path.resolve(root, 'custom/.env'),
    );
  });
});

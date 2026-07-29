/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { ensureManagedEnvFileDefaults } from '../lib/managed-env-file.js';

const createdRoots: string[] = [];
const originalNbCliRoot = process.env.NB_CLI_ROOT;

async function createTempRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-managed-env-file-'));
  createdRoots.push(root);
  return root;
}

afterEach(async () => {
  if (originalNbCliRoot === undefined) {
    delete process.env.NB_CLI_ROOT;
  } else {
    process.env.NB_CLI_ROOT = originalNbCliRoot;
  }

  for (const root of createdRoots.splice(0)) {
    await rm(root, { recursive: true, force: true });
  }
});

test('ensureManagedEnvFileDefaults creates the default managed app .env file', async () => {
  const root = await createTempRoot();
  process.env.NB_CLI_ROOT = root;

  const envFilePath = await ensureManagedEnvFileDefaults('local', {
    kind: 'local',
    appPath: './apps/local',
  });

  expect(envFilePath).toBe(path.join(root, 'apps/local/.env'));
  await expect(readFile(envFilePath as string, 'utf8')).resolves.toBe(
    [
      'APP_DISCOVERY_ADAPTER=local',
      'APP_PROCESS_ADAPTER=local',
      'APP_CLIENT_ENTRY_MODE=modern-only',
      '',
    ].join('\n'),
  );
});

test('ensureManagedEnvFileDefaults preserves existing .env values and appends missing defaults', async () => {
  const root = await createTempRoot();
  process.env.NB_CLI_ROOT = root;
  const envFilePath = path.join(root, 'apps/local/.env');
  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writeFile(envFilePath, 'APP_DISCOVERY_ADAPTER=custom\nCUSTOM_VALUE=1', 'utf8');

  await expect(
    ensureManagedEnvFileDefaults('local', {
      kind: 'local',
      appPath: './apps/local',
    }),
  ).resolves.toBe(envFilePath);

  await expect(readFile(envFilePath, 'utf8')).resolves.toBe(
    [
      'APP_DISCOVERY_ADAPTER=custom',
      'CUSTOM_VALUE=1',
      'APP_PROCESS_ADAPTER=local',
      'APP_CLIENT_ENTRY_MODE=modern-only',
      '',
    ].join('\n'),
  );
});

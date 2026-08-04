/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { ensureManagedEnvFileDefaults, upsertManagedEnvFileValues } from '../lib/managed-env-file.js';

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
    ['APP_DISCOVERY_ADAPTER=local', 'APP_PROCESS_ADAPTER=local', 'APP_CLIENT_ENTRY_MODE=modern-only', ''].join('\n'),
  );
});

test('ensureManagedEnvFileDefaults uses the saved app client entry mode', async () => {
  const root = await createTempRoot();
  process.env.NB_CLI_ROOT = root;

  const envFilePath = await ensureManagedEnvFileDefaults('local', {
    kind: 'local',
    appPath: './apps/local',
    appClientEntryMode: 'legacy-default',
  });

  expect(envFilePath).toBe(path.join(root, 'apps/local/.env'));
  await expect(readFile(envFilePath as string, 'utf8')).resolves.toBe(
    ['APP_DISCOVERY_ADAPTER=local', 'APP_PROCESS_ADAPTER=local', 'APP_CLIENT_ENTRY_MODE=legacy-default', ''].join('\n'),
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

test('upsertManagedEnvFileValues updates an existing env value', async () => {
  const root = await createTempRoot();
  process.env.NB_CLI_ROOT = root;
  const envFilePath = path.join(root, 'apps/local/.env');
  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writeFile(
    envFilePath,
    ['APP_DISCOVERY_ADAPTER=local', 'APP_CLIENT_ENTRY_MODE=modern-only', 'CUSTOM_VALUE=1', ''].join('\n'),
    'utf8',
  );

  await expect(
    upsertManagedEnvFileValues(
      'local',
      {
        kind: 'local',
        appPath: './apps/local',
      },
      {
        APP_CLIENT_ENTRY_MODE: 'legacy-default',
      },
    ),
  ).resolves.toBe(envFilePath);

  await expect(readFile(envFilePath, 'utf8')).resolves.toBe(
    ['APP_DISCOVERY_ADAPTER=local', 'APP_CLIENT_ENTRY_MODE=legacy-default', 'CUSTOM_VALUE=1', ''].join('\n'),
  );
});

test('upsertManagedEnvFileValues appends a missing env value', async () => {
  const root = await createTempRoot();
  process.env.NB_CLI_ROOT = root;
  const envFilePath = path.join(root, 'apps/local/.env');
  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writeFile(envFilePath, 'APP_DISCOVERY_ADAPTER=local\n', 'utf8');

  await upsertManagedEnvFileValues(
    'local',
    {
      kind: 'local',
      appPath: './apps/local',
    },
    {
      APP_CLIENT_ENTRY_MODE: 'modern-default',
    },
  );

  await expect(readFile(envFilePath, 'utf8')).resolves.toBe(
    ['APP_DISCOVERY_ADAPTER=local', 'APP_CLIENT_ENTRY_MODE=modern-default', ''].join('\n'),
  );
});

test('upsertManagedEnvFileValues skips writing unchanged env content', async () => {
  const root = await createTempRoot();
  process.env.NB_CLI_ROOT = root;
  const envFilePath = path.join(root, 'apps/local/.env');
  const content = ['APP_DISCOVERY_ADAPTER=local', 'APP_CLIENT_ENTRY_MODE=modern-only', ''].join('\n');
  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writeFile(envFilePath, content, 'utf8');
  const before = await stat(envFilePath);

  await expect(
    upsertManagedEnvFileValues(
      'local',
      {
        kind: 'local',
        appPath: './apps/local',
      },
      {
        APP_CLIENT_ENTRY_MODE: 'modern-only',
      },
    ),
  ).resolves.toBe(envFilePath);

  await expect(readFile(envFilePath, 'utf8')).resolves.toBe(content);
  await expect(stat(envFilePath)).resolves.toMatchObject({
    mtimeMs: before.mtimeMs,
  });
});

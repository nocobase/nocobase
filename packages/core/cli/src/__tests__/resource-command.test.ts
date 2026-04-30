/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, expect, test } from 'vitest';
import { buildCreateArgs, buildUpdateArgs } from '../lib/resource-command.js';

let tempDir: string | undefined;

async function makeJsonFile(data: Record<string, any>) {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-resource-command-test-'));
  const filePath = path.join(tempDir, 'values.json');
  await writeFile(filePath, `${JSON.stringify(data)}\n`, 'utf8');
  return filePath;
}

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

test('buildCreateArgs reads values from --values-file', async () => {
  const valuesFile = await makeJsonFile({
    name: 'publish-e2e',
    rules: {
      userDefined: {
        globalRule: 'schema-only',
      },
    },
  });

  expect(buildCreateArgs({
    resource: 'migrationRules',
    'values-file': valuesFile,
  })).toMatchObject({
    resource: 'migrationRules',
    values: {
      name: 'publish-e2e',
      rules: {
        userDefined: {
          globalRule: 'schema-only',
        },
      },
    },
  });
});

test('buildUpdateArgs rejects conflicting values inputs', async () => {
  const valuesFile = await makeJsonFile({ name: 'from-file' });

  expect(() => buildUpdateArgs({
    resource: 'migrationRules',
    values: '{"name":"inline"}',
    'values-file': valuesFile,
  })).toThrow(/either --values or --values-file/);
});

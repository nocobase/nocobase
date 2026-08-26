/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';

import { buildCjs } from '../buildCjs';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

async function createTempPackageDir() {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-build-cjs-'));
  tempDirs.push(cwd);
  return cwd;
}

describe('buildCjs', () => {
  test('copies text assets without converting them to JavaScript modules', async () => {
    const cwd = await createTempPackageDir();

    await fs.outputFile(path.join(cwd, 'src/index.ts'), 'export const name = "test";');
    await fs.outputFile(path.join(cwd, 'src/migrations/t.txt'), '123');

    await buildCjs(
      cwd,
      {
        modifyTsupConfig: (config) => config,
      },
      false,
      () => {},
    );

    await expect(fs.readFile(path.join(cwd, 'lib/migrations/t.txt'), 'utf8')).resolves.toBe('123');
    await expect(fs.pathExists(path.join(cwd, 'lib/migrations/t.js'))).resolves.toBe(false);
  });
});

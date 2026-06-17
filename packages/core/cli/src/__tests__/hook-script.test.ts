/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import {
  ENV_HOOK_SCRIPT_CONFIG_PATH,
  persistHookScript,
  resolveHookScriptPath,
} from '../lib/hook-script.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

async function useTempDir(): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-hook-'));
  tempDirs.push(dir);
  return dir;
}

test('persistHookScript copies hooks into the app metadata directory', async () => {
  const dir = await useTempDir();
  const appPath = path.join(dir, 'local');
  const sourcePath = path.join(dir, 'new-hook.mjs');
  await fsp.writeFile(sourcePath, 'export default {};');

  const hookScript = await persistHookScript({
    sourcePath,
    appPath,
  });

  expect(hookScript).toBe(ENV_HOOK_SCRIPT_CONFIG_PATH);
  await expect(fsp.readFile(path.join(appPath, '.nb', 'hooks.mjs'), 'utf8')).resolves.toBe('export default {};');
  expect(
    resolveHookScriptPath({
      appPath,
      hookScript,
    }),
  ).toBe(path.join(appPath, '.nb', 'hooks.mjs'));
});

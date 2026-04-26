/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

test('build script copies locale JSON files into dist/locale', async () => {
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const buildScript = path.join(packageRoot, 'scripts', 'build.mjs');
  const sourceLocaleDir = path.join(packageRoot, 'src', 'locale');
  const distLocaleDir = path.join(packageRoot, 'dist', 'locale');

  const build = spawnSync(process.execPath, [buildScript], {
    cwd: packageRoot,
    stdio: 'pipe',
    encoding: 'utf8',
  });

  expect(
    build.status,
    build.stderr || build.stdout || 'expected build script to exit successfully',
  ).toBe(0);

  const [sourceEntries, distEntries] = await Promise.all([
    fsp.readdir(sourceLocaleDir),
    fsp.readdir(distLocaleDir),
  ]);

  const sourceJsonFiles = sourceEntries.filter((name) => name.endsWith('.json')).sort();
  const distJsonFiles = distEntries.filter((name) => name.endsWith('.json')).sort();

  expect(distJsonFiles).toEqual(sourceJsonFiles);

  for (const fileName of sourceJsonFiles) {
    const [sourceContent, distContent] = await Promise.all([
      fsp.readFile(path.join(sourceLocaleDir, fileName), 'utf8'),
      fsp.readFile(path.join(distLocaleDir, fileName), 'utf8'),
    ]);

    expect(distContent).toBe(sourceContent);
  }
});

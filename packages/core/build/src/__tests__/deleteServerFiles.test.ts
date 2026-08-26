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

import { deleteServerFiles, shouldPreserveDistEntry } from '../deleteServerFiles';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

async function createTempPluginDir() {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-build-plugin-'));
  tempDirs.push(cwd);
  return {
    cwd,
    distDir: path.join(cwd, 'dist'),
  };
}

describe('shouldPreserveDistEntry', () => {
  test('preserves client lanes for both Windows and POSIX paths', () => {
    expect(shouldPreserveDistEntry('C:/repo/dist/client')).toBe(true);
    expect(shouldPreserveDistEntry('C:/repo/dist/client-v2')).toBe(true);
    expect(shouldPreserveDistEntry('C:\\repo\\dist\\client')).toBe(true);
    expect(shouldPreserveDistEntry('C:\\repo\\dist\\client-v2')).toBe(true);
    expect(shouldPreserveDistEntry('/repo/dist/client')).toBe(true);
    expect(shouldPreserveDistEntry('/repo/dist/client-v2')).toBe(true);
    expect(shouldPreserveDistEntry('/repo/dist/server')).toBe(false);
  });
});

describe('deleteServerFiles', () => {
  test('removes server artifacts and keeps client lanes', async () => {
    const { cwd, distDir } = await createTempPluginDir();

    await fs.outputFile(path.join(distDir, 'index.js'), 'server entry');
    await fs.outputFile(path.join(distDir, 'server', 'index.js'), 'server build');
    await fs.outputFile(path.join(distDir, 'client', 'index.js'), 'client build');
    await fs.outputFile(path.join(distDir, 'client-v2', 'index.js'), 'client-v2 build');
    await fs.outputFile(path.join(distDir, 'node_modules', 'pkg', 'index.js'), 'dependency');

    deleteServerFiles(cwd, () => {});

    await expect(fs.pathExists(path.join(distDir, 'index.js'))).resolves.toBe(false);
    await expect(fs.pathExists(path.join(distDir, 'server'))).resolves.toBe(false);
    await expect(fs.pathExists(path.join(distDir, 'client'))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(distDir, 'client-v2'))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(distDir, 'node_modules'))).resolves.toBe(true);
  });
});

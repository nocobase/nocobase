/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import chokidar from 'chokidar';
import { describe, expect, test } from 'vitest';
import packageJson from '../../package.json';

describe('cli-v1 runtime dependencies', () => {
  test('declares chokidar directly for production command initialization', () => {
    expect(packageJson.dependencies.chokidar).toBe('3.6.0');
    expect(packageJson.devDependencies).not.toHaveProperty('chokidar');
  });

  test('keeps glob-based plugin directory watching compatible', async () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'nocobase-cli-watch-'));
    const pluginDirectory = path.join(directory, 'plugins');
    mkdirSync(pluginDirectory);
    const watcher = chokidar.watch(`${pluginDirectory}/**/*`, { ignoreInitial: true });

    try {
      await new Promise<void>((resolve, reject) => {
        watcher.once('ready', resolve);
        watcher.once('error', reject);
      });
      const added = new Promise<string>((resolve, reject) => {
        watcher.once('addDir', resolve);
        watcher.once('error', reject);
      });
      const addedDirectory = path.join(pluginDirectory, 'example-plugin');
      mkdirSync(addedDirectory);

      expect(path.resolve(await added)).toBe(addedDirectory);
    } finally {
      await watcher.close();
      rmSync(directory, { recursive: true, force: true });
    }
  }, 10000);
});

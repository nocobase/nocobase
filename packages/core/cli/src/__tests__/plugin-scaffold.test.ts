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
import { expect, test } from 'vitest';
import {
  buildPluginScaffoldContext,
  generatePluginScaffold,
  isValidPluginPackageName,
} from '../scaffolds/plugin/index.js';

test('isValidPluginPackageName accepts scoped and unscoped package names', () => {
  expect(isValidPluginPackageName('@my-scope/plugin-hello')).toBe(true);
  expect(isValidPluginPackageName('plugin-hello')).toBe(true);
  expect(isValidPluginPackageName('../plugin-hello')).toBe(false);
});

test('buildPluginScaffoldContext matches current plugin generator naming behavior', async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'nb-plugin-scaffold-context-'));
  try {
    await fsp.writeFile(path.join(root, 'lerna.json'), JSON.stringify({ version: '2.1.11' }), 'utf8');
    await expect(
      buildPluginScaffoldContext({
        packageName: '@my-scope/plugin-hello',
        sourcePath: root,
      }),
    ).resolves.toEqual({
      packageName: '@my-scope/plugin-hello',
      packageVersion: '2.1.11',
      pascalCaseName: 'PluginHello',
    });
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('generatePluginScaffold renders the plugin template with expected files and content', async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'nb-plugin-scaffold-'));
  const targetRoot = path.join(root, 'plugins');
  try {
    await fsp.writeFile(path.join(root, 'lerna.json'), JSON.stringify({ version: '2.1.11' }), 'utf8');

    const result = await generatePluginScaffold({
      packageName: '@my-scope/plugin-hello',
      sourcePath: root,
      targetRoot,
    });

    expect(result.targetPath).toBe(path.join(targetRoot, '@my-scope', 'plugin-hello'));
    await expect(fsp.readFile(path.join(result.targetPath, 'README.md'), 'utf8')).resolves.toBe('# @my-scope/plugin-hello\n');
    await expect(fsp.readFile(path.join(result.targetPath, 'package.json'), 'utf8')).resolves.toContain(
      '"version": "2.1.11"',
    );
    await expect(fsp.readFile(path.join(result.targetPath, 'src/client/plugin.tsx'), 'utf8')).resolves.toContain(
      'export class PluginHelloClient extends Plugin',
    );
    await expect(fsp.readFile(path.join(result.targetPath, 'src/client-v2/plugin.tsx'), 'utf8')).resolves.toContain(
      'export class PluginHelloClientV2 extends Plugin',
    );
    await expect(fsp.readFile(path.join(result.targetPath, 'src/server/plugin.ts'), 'utf8')).resolves.toContain(
      'export class PluginHelloServer extends Plugin',
    );
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

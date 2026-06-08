/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { discoverPluginPackages, parsePluginName } from '../../plugin-package.js';

function writePackage(root: string, relativeDir: string, name: string, extra: Record<string, unknown> = {}) {
  const dir = path.join(root, relativeDir);
  fs.ensureDirSync(dir);
  fs.writeJsonSync(path.join(dir, 'package.json'), { name, ...extra });
  return dir;
}

describe('plugin-package', () => {
  const originalEnv = {
    APPEND_PRESET_BUILT_IN_PLUGINS: process.env.APPEND_PRESET_BUILT_IN_PLUGINS,
    APPEND_PRESET_LOCAL_PLUGINS: process.env.APPEND_PRESET_LOCAL_PLUGINS,
    NODE_MODULES_PATH: process.env.NODE_MODULES_PATH,
    PLUGIN_PACKAGE_PREFIX: process.env.PLUGIN_PACKAGE_PREFIX,
    PLUGIN_STORAGE_PATH: process.env.PLUGIN_STORAGE_PATH,
    STORAGE_PATH: process.env.STORAGE_PATH,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    vi.restoreAllMocks();
  });

  it('resolves short names through node_modules and keeps custom package names unchanged', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-plugin-package-'));
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    process.env.NODE_MODULES_PATH = path.join(root, 'node_modules');

    writePackage(root, 'node_modules/@nocobase/plugin-alpha', '@nocobase/plugin-alpha');

    await expect(parsePluginName('alpha')).resolves.toEqual({
      name: 'alpha',
      packageName: '@nocobase/plugin-alpha',
    });

    await expect(parsePluginName('@my-project/plugin-demo')).resolves.toEqual({
      name: '@my-project/plugin-demo',
      packageName: '@my-project/plugin-demo',
    });
  });

  it('discovers all plugin sources and resolves paths with current symlink priority', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-plugin-package-'));
    vi.spyOn(process, 'cwd').mockReturnValue(root);

    process.env.NODE_MODULES_PATH = path.join(root, 'node_modules');
    process.env.STORAGE_PATH = path.join(root, 'storage');
    process.env.APPEND_PRESET_BUILT_IN_PLUGINS = 'node-only';
    process.env.APPEND_PRESET_LOCAL_PLUGINS = '@my-project/plugin-storage';

    const nodeModulesAlpha = writePackage(root, 'node_modules/@nocobase/plugin-alpha', '@nocobase/plugin-alpha');
    writePackage(root, 'node_modules/@nocobase/plugin-node-only', '@nocobase/plugin-node-only');
    writePackage(root, 'node_modules/@nocobase/preset-nocobase', '@nocobase/preset-nocobase', {
      dependencies: {
        '@nocobase/plugin-alpha': '1.0.0',
        '@nocobase/plugin-node-only': '1.0.0',
      },
      builtIn: ['@nocobase/plugin-alpha'],
      deprecated: [],
    });

    writePackage(root, 'packages/plugins/@nocobase/plugin-alpha', '@nocobase/plugin-alpha');
    const packagesBeta = writePackage(root, 'packages/plugins/@nocobase/plugin-beta', '@nocobase/plugin-beta');
    const proGamma = writePackage(root, 'packages/pro-plugins/@nocobase/plugin-gamma', '@nocobase/plugin-gamma');
    const storageDelta = writePackage(root, 'storage/plugins/@nocobase/plugin-delta', '@nocobase/plugin-delta');
    const customLocal = writePackage(root, 'packages/plugins/@my-project/plugin-local', '@my-project/plugin-local');
    const customStorage = writePackage(
      root,
      'storage/plugins/@my-project/plugin-storage',
      '@my-project/plugin-storage',
    );

    writePackage(root, 'packages/pro-plugins/@nocobase/plugin-alpha', '@nocobase/plugin-alpha');
    writePackage(root, 'storage/plugins/@nocobase/plugin-alpha', '@nocobase/plugin-alpha');
    writePackage(root, 'packages/pro-plugins/@nocobase/plugin-beta', '@nocobase/plugin-beta');
    writePackage(root, 'storage/plugins/@nocobase/plugin-beta', '@nocobase/plugin-beta');
    writePackage(root, 'storage/plugins/@nocobase/plugin-gamma', '@nocobase/plugin-gamma');
    writePackage(root, 'packages/pro-plugins/external-db-data-source', 'external-db-data-source');

    const discovered = await discoverPluginPackages({
      nodeModulesPath: process.env.NODE_MODULES_PATH,
      storagePluginsPath: path.join(root, 'storage/plugins'),
    });

    const byPackageName = new Map(discovered.map((item) => [item.packageName, item]));

    expect(byPackageName.has('@nocobase/plugin-alpha')).toBe(true);
    expect(byPackageName.has('@nocobase/plugin-beta')).toBe(true);
    expect(byPackageName.has('@nocobase/plugin-gamma')).toBe(true);
    expect(byPackageName.has('@nocobase/plugin-delta')).toBe(true);
    expect(byPackageName.has('@nocobase/plugin-node-only')).toBe(true);
    expect(byPackageName.has('@my-project/plugin-local')).toBe(true);
    expect(byPackageName.has('@my-project/plugin-storage')).toBe(true);
    expect(byPackageName.has('external-db-data-source')).toBe(true);

    expect(byPackageName.get('@nocobase/plugin-alpha')?.resolvedPath).toBe(nodeModulesAlpha);
    expect(byPackageName.get('@nocobase/plugin-beta')?.resolvedPath).toBe(packagesBeta);
    expect(byPackageName.get('@nocobase/plugin-gamma')?.resolvedPath).toBe(proGamma);
    expect(byPackageName.get('@nocobase/plugin-delta')?.resolvedPath).toBe(storageDelta);
    expect(byPackageName.get('@my-project/plugin-local')?.resolvedPath).toBe(customLocal);
    expect(byPackageName.get('@my-project/plugin-storage')?.resolvedPath).toBe(customStorage);
    expect(byPackageName.get('external-db-data-source')?.resolvedPath).toBe(
      path.join(root, 'packages/pro-plugins/external-db-data-source'),
    );

    expect(byPackageName.get('@nocobase/plugin-node-only')?.origins).toContain('append-built-in');
    expect(byPackageName.get('@my-project/plugin-storage')?.origins).toContain('append-local');
    expect(byPackageName.get('@nocobase/plugin-alpha')?.name).toBe('alpha');
    expect(byPackageName.get('@my-project/plugin-local')?.name).toBe('@my-project/plugin-local');
  });
});

// test

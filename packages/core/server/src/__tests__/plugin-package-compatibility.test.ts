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

import { describe, expect, it, vi } from 'vitest';

import {
  discoverPluginPackages,
  JS_TEMPLATE_PLUGIN_PACKAGE_COMPATIBILITY,
  parsePluginName,
} from '../../../utils/plugin-package';

const nodeModulesPath = path.resolve(__dirname, '../../../../../node_modules');
const expectedIdentity = {
  name: 'light-extension',
  packageName: '@nocobase/plugin-light-extension',
};

describe('JS Template plugin package compatibility', () => {
  it('normalizes canonical and legacy names to one runtime and package identity', async () => {
    expect(JS_TEMPLATE_PLUGIN_PACKAGE_COMPATIBILITY).toEqual({
      canonicalName: 'js-template',
      canonicalPackageName: '@nocobase/plugin-js-template',
      legacyName: 'light-extension',
      legacyPackageName: '@nocobase/plugin-light-extension',
      runtimeName: 'light-extension',
      runtimePackageName: '@nocobase/plugin-light-extension',
    });

    for (const nameOrPackage of [
      'js-template',
      '@nocobase/plugin-js-template',
      'light-extension',
      '@nocobase/plugin-light-extension',
    ]) {
      await expect(parsePluginName(nameOrPackage, { nodeModulesPath })).resolves.toEqual(expectedIdentity);
    }
  });

  it('does not change unrelated plugin identities', async () => {
    await expect(parsePluginName('@nocobase/plugin-users', { nodeModulesPath })).resolves.toEqual({
      name: 'users',
      packageName: '@nocobase/plugin-users',
    });
  });

  it('discovers a legacy-only preset after rollback without requiring the canonical facade', async () => {
    const rollbackRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-js-template-rollback-'));
    const rollbackNodeModulesPath = path.join(rollbackRoot, 'node_modules');
    const rollbackStoragePath = path.join(rollbackRoot, 'storage', 'plugins');
    const legacyPackagePath = path.join(rollbackNodeModulesPath, '@nocobase', 'plugin-light-extension');
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(rollbackRoot);

    try {
      await fs.outputJson(path.join(legacyPackagePath, 'package.json'), {
        name: '@nocobase/plugin-light-extension',
        version: '2.2.0-rollback-test',
      });
      await fs.outputJson(path.join(rollbackRoot, 'packages', 'presets', 'nocobase', 'package.json'), {
        dependencies: {
          '@nocobase/plugin-light-extension': '2.2.0-rollback-test',
        },
        builtIn: ['@nocobase/plugin-light-extension'],
      });
      await fs.ensureDir(rollbackStoragePath);

      await expect(
        discoverPluginPackages({
          cwd: rollbackRoot,
          nodeModulesPath: rollbackNodeModulesPath,
          storagePluginsPath: rollbackStoragePath,
        }),
      ).resolves.toEqual([
        {
          name: 'light-extension',
          packageName: '@nocobase/plugin-light-extension',
          origins: ['preset-dependency'],
          resolvedPath: legacyPackagePath,
        },
      ]);
      await expect(
        parsePluginName('@nocobase/plugin-light-extension', { nodeModulesPath: rollbackNodeModulesPath }),
      ).resolves.toEqual(expectedIdentity);
      await expect(
        parsePluginName('@nocobase/plugin-js-template', { nodeModulesPath: rollbackNodeModulesPath }),
      ).resolves.toEqual({
        name: 'js-template',
        packageName: '@nocobase/plugin-js-template',
      });
    } finally {
      cwd.mockRestore();
      await fs.remove(rollbackRoot);
    }
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import {
  assertSafePluginPackageName,
  getNodeModulesPluginDir,
  getStoragePluginDir,
  removePluginPackage,
  resolveSafeChildPath,
} from '../plugin-manager/utils';

describe('plugin-manager utils security', () => {
  const oldNodeModulesPath = process.env.NODE_MODULES_PATH;
  const oldPluginStoragePath = process.env.PLUGIN_STORAGE_PATH;

  beforeEach(() => {
    process.env.NODE_MODULES_PATH = '/tmp/node_modules';
    process.env.PLUGIN_STORAGE_PATH = '/tmp/storage/plugins';
  });

  afterEach(() => {
    process.env.NODE_MODULES_PATH = oldNodeModulesPath;
    process.env.PLUGIN_STORAGE_PATH = oldPluginStoragePath;
  });

  test('accepts valid unscoped package names', () => {
    expect(() => assertSafePluginPackageName('my-plugin')).not.toThrow();
    expect(getStoragePluginDir('my-plugin')).toBe(path.resolve('/tmp/storage/plugins', 'my-plugin'));
  });

  test('accepts valid scoped package names', () => {
    expect(() => assertSafePluginPackageName('@nocobase/plugin-acl')).not.toThrow();
    expect(getNodeModulesPluginDir('@acme/plugin-demo')).toBe(path.resolve('/tmp/node_modules', '@acme/plugin-demo'));
  });

  test('rejects path traversal package names', async () => {
    expect(() => assertSafePluginPackageName('../../../tmp/pwn')).toThrow('Invalid plugin package name');
    expect(() => getStoragePluginDir('../../../tmp/pwn')).toThrow('Invalid plugin package name');
    expect(() => getNodeModulesPluginDir('..\\..\\evil')).toThrow('Invalid plugin package name');
    expect(() => removePluginPackage('../../../tmp/pwn')).toThrow('Invalid plugin package name');
  });

  test('rejects absolute path package names', () => {
    expect(() => assertSafePluginPackageName('/etc/passwd')).toThrow('Invalid plugin package name');
  });

  test('resolveSafeChildPath keeps paths within base dir', () => {
    expect(resolveSafeChildPath('/tmp/storage/plugins', '@scope/demo')).toBe(
      path.resolve('/tmp/storage/plugins', '@scope/demo'),
    );
    expect(() => resolveSafeChildPath('/tmp/storage/plugins', '../../etc/passwd')).toThrow('Path traversal detected');
  });
});

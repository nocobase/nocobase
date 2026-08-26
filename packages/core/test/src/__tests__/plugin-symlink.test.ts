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

const { syncPluginSymlinks } = require('../../../utils/plugin-symlink.js');

function writePlugin(root: string, baseDir: string, packageName: string) {
  const pluginDir = path.join(root, baseDir, packageName);
  fs.ensureDirSync(pluginDir);
  fs.writeJsonSync(path.join(pluginDir, 'package.json'), { name: packageName });
  return pluginDir;
}

describe('plugin symlink sync', () => {
  const originalEnv = {
    NODE_MODULES_PATH: process.env.NODE_MODULES_PATH,
    PLUGIN_STORAGE_PATH: process.env.PLUGIN_STORAGE_PATH,
    STORAGE_PATH: process.env.STORAGE_PATH,
  };

  afterEach(() => {
    process.env.NODE_MODULES_PATH = originalEnv.NODE_MODULES_PATH;
    process.env.PLUGIN_STORAGE_PATH = originalEnv.PLUGIN_STORAGE_PATH;
    process.env.STORAGE_PATH = originalEnv.STORAGE_PATH;
    vi.restoreAllMocks();
  });

  it('keeps real directories in node_modules and rebuilds symlinks by priority', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-plugin-symlink-'));
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    process.env.NODE_MODULES_PATH = path.join(root, 'node_modules');
    process.env.PLUGIN_STORAGE_PATH = path.join(root, 'storage', 'plugins');
    process.env.STORAGE_PATH = path.join(root, 'storage');

    fs.ensureDirSync(process.env.NODE_MODULES_PATH);

    const realDirName = '@scope/real';
    const linkedName = '@scope/linked';
    const storageOnlyName = 'storage-only';

    const packagesPluginDir = writePlugin(root, 'packages/plugins', linkedName);
    const proPluginDir = writePlugin(root, 'packages/pro-plugins', linkedName);
    const storagePluginDir = writePlugin(root, 'storage/plugins', linkedName);
    writePlugin(root, 'storage/plugins', storageOnlyName);
    writePlugin(root, 'packages/plugins', realDirName);

    const realNodeModulesDir = path.join(root, 'node_modules', '@scope', 'real');
    fs.ensureDirSync(realNodeModulesDir);
    fs.writeJsonSync(path.join(realNodeModulesDir, 'package.json'), { name: realDirName });

    const linkedNodeModulesDir = path.join(root, 'node_modules', '@scope', 'linked');
    fs.ensureDirSync(path.dirname(linkedNodeModulesDir));
    fs.symlinkSync(storagePluginDir, linkedNodeModulesDir, 'dir');

    await syncPluginSymlinks();

    expect(fs.lstatSync(realNodeModulesDir).isSymbolicLink()).toBe(false);
    expect(fs.realpathSync(linkedNodeModulesDir)).toBe(fs.realpathSync(packagesPluginDir));
    expect(fs.realpathSync(path.join(root, 'node_modules', storageOnlyName))).toBe(
      fs.realpathSync(path.join(root, 'storage', 'plugins', storageOnlyName)),
    );
    expect(fs.realpathSync(path.join(root, 'node_modules', '@scope', 'linked'))).not.toBe(proPluginDir);
  });

  it('skips invalid source directories when resolving plugin targets', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-plugin-symlink-'));
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    process.env.NODE_MODULES_PATH = path.join(root, 'node_modules');
    process.env.PLUGIN_STORAGE_PATH = path.join(root, 'storage', 'plugins');
    process.env.STORAGE_PATH = path.join(root, 'storage');

    fs.ensureDirSync(process.env.NODE_MODULES_PATH);

    const pluginName = '@scope/linked';
    fs.ensureDirSync(path.join(root, 'packages/plugins', pluginName));
    const storagePluginDir = writePlugin(root, 'storage/plugins', pluginName);

    await syncPluginSymlinks();

    expect(fs.realpathSync(path.join(root, 'node_modules', pluginName))).toBe(fs.realpathSync(storagePluginDir));
  });
});

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

const { IndexGenerator, getPackagePaths } = require('../../../../devtools/common.js');

function writePluginPackage(
  root: string,
  packageName: string,
  options: { clientRootFile?: string; clientSourceDir?: string },
) {
  const [scope, name] = packageName.split('/');
  const packageDir = path.join(root, 'packages', 'plugins', scope, name);
  fs.ensureDirSync(path.join(packageDir, 'src', options.clientSourceDir || 'client'));
  fs.writeJsonSync(path.join(packageDir, 'package.json'), { name: packageName });
  fs.writeFileSync(path.join(packageDir, options.clientRootFile || 'client.js'), 'module.exports = {};');
  fs.writeFileSync(
    path.join(packageDir, 'src', options.clientSourceDir || 'client', 'index.ts'),
    'export default class DemoPlugin {}',
  );
}

describe('IndexGenerator', () => {
  const originalPluginStoragePath = process.env.PLUGIN_STORAGE_PATH;

  afterEach(() => {
    process.env.PLUGIN_STORAGE_PATH = originalPluginStoragePath;
    vi.restoreAllMocks();
  });

  it('should generate client-v2 manifests from client-v2.js and src/client-v2 only', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-client-v2-plugins-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);
    process.env.PLUGIN_STORAGE_PATH = path.join(tempRoot, 'storage', 'plugins');
    fs.ensureDirSync(process.env.PLUGIN_STORAGE_PATH);
    fs.ensureDirSync(path.join(tempRoot, 'node_modules', '@nocobase'));

    writePluginPackage(tempRoot, '@nocobase/plugin-acl', {
      clientRootFile: 'client-v2.js',
      clientSourceDir: 'client-v2',
    });
    writePluginPackage(tempRoot, '@nocobase/plugin-v1-only', {
      clientRootFile: 'client.js',
      clientSourceDir: 'client',
    });

    const outputPath = path.join(tempRoot, 'packages', 'core', 'app', 'client-v2', 'src', '.plugins');
    const pluginsPath = [path.join(tempRoot, 'packages', 'plugins')];

    const generator = new IndexGenerator(outputPath, pluginsPath, {
      clientModuleName: 'client-v2',
      clientRootFile: 'client-v2.js',
      clientSourceDir: 'client-v2',
    });
    generator.generate();

    const packageMap = fs.readJsonSync(path.join(outputPath, 'packageMap.json'));
    expect(packageMap).toEqual({
      '@nocobase/plugin-acl': 'nocobase_plugin_acl.ts',
    });

    const manifest = fs.readFileSync(path.join(outputPath, 'packages', 'nocobase_plugin_acl.ts'), 'utf8');
    expect(manifest).toContain('src/client-v2');
  });

  it('should keep client manifests using client.js and src/client', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-client-v1-plugins-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);
    process.env.PLUGIN_STORAGE_PATH = path.join(tempRoot, 'storage', 'plugins');
    fs.ensureDirSync(process.env.PLUGIN_STORAGE_PATH);
    fs.ensureDirSync(path.join(tempRoot, 'node_modules', '@nocobase'));

    writePluginPackage(tempRoot, '@nocobase/plugin-acl', {
      clientRootFile: 'client-v2.js',
      clientSourceDir: 'client-v2',
    });
    writePluginPackage(tempRoot, '@nocobase/plugin-v1-only', {
      clientRootFile: 'client.js',
      clientSourceDir: 'client',
    });

    const outputPath = path.join(tempRoot, 'packages', 'core', 'app', 'client', 'src', '.plugins');
    const pluginsPath = [path.join(tempRoot, 'packages', 'plugins')];

    const generator = new IndexGenerator(outputPath, pluginsPath);
    generator.generate();

    const packageMap = fs.readJsonSync(path.join(outputPath, 'packageMap.json'));
    expect(packageMap).toEqual({
      '@nocobase/plugin-v1-only': 'nocobase_plugin_v1_only.ts',
    });

    const manifest = fs.readFileSync(path.join(outputPath, 'packages', 'nocobase_plugin_v1_only.ts'), 'utf8');
    expect(manifest).toContain('src/client');
    expect(manifest).not.toContain('src/client-v2');
  });

  it('should read both client and client-v2 aliases from tsconfig paths', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-client-paths-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);
    fs.writeJsonSync(path.join(tempRoot, 'tsconfig.paths.json'), {
      compilerOptions: {
        paths: {
          '@nocobase/plugin-acl/client': ['packages/plugins/@nocobase/plugin-acl/src/client'],
          '@nocobase/plugin-acl/client-v2': ['packages/plugins/@nocobase/plugin-acl/src/client-v2'],
        },
      },
    });

    const packagePaths = getPackagePaths();

    expect(packagePaths).toEqual(
      expect.arrayContaining([
        ['@nocobase/plugin-acl/client', path.join(tempRoot, 'packages/plugins/@nocobase/plugin-acl/src/client')],
        ['@nocobase/plugin-acl/client-v2', path.join(tempRoot, 'packages/plugins/@nocobase/plugin-acl/src/client-v2')],
      ]),
    );
  });
});

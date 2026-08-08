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

const { IndexGenerator, generateAllPlugins, getPackagePaths } = require('../../../../devtools/common.js');

const temporaryRoots: string[] = [];

function createTemporaryRoot(prefix: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

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
  const originalEnvironment = {
    APP_PACKAGE_ROOT: process.env.APP_PACKAGE_ROOT,
    NOCOBASE_DEV_LOCAL_PLUGINS_ONLY: process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY,
    PLUGIN_PATH: process.env.PLUGIN_PATH,
    PLUGIN_STORAGE_PATH: process.env.PLUGIN_STORAGE_PATH,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    for (const root of temporaryRoots.splice(0)) {
      fs.removeSync(root);
    }
    vi.restoreAllMocks();
  });

  it('should generate client-v2 manifests from client-v2.js and src/client-v2 only', () => {
    const tempRoot = createTemporaryRoot('nocobase-client-v2-plugins-');
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
    expect(manifest).toContain("export * from '../../../../../../plugins/@nocobase/plugin-acl/src/client-v2';");
  });

  it('should keep client manifests using client.js and src/client', () => {
    const tempRoot = createTemporaryRoot('nocobase-client-v1-plugins-');
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
    expect(manifest).toContain("export * from '../../../../../../plugins/@nocobase/plugin-v1-only/src/client';");
    expect(manifest).not.toContain('src/client-v2');
  });

  it('should read both client and client-v2 aliases from tsconfig paths', () => {
    const tempRoot = createTemporaryRoot('nocobase-client-paths-');
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

  it('should generate the canonical JS Template entrypoint for each client runtime', () => {
    const tempRoot = createTemporaryRoot('nocobase-all-client-plugins-');
    vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);
    process.env.APP_PACKAGE_ROOT = path.join(tempRoot, 'packages', 'core', 'app');
    process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY = 'true';
    process.env.PLUGIN_PATH = 'packages/plugins';
    process.env.PLUGIN_STORAGE_PATH = path.join(tempRoot, 'storage', 'plugins');
    fs.ensureDirSync(process.env.PLUGIN_STORAGE_PATH);
    fs.ensureDirSync(path.join(tempRoot, 'node_modules', '@nocobase'));

    writePluginPackage(tempRoot, '@nocobase/plugin-js-template', {
      clientRootFile: 'client.js',
      clientSourceDir: 'client',
    });
    writePluginPackage(tempRoot, '@nocobase/plugin-js-template', {
      clientRootFile: 'client-v2.js',
      clientSourceDir: 'client-v2',
    });

    generateAllPlugins();

    const clientRoot = path.join(process.env.APP_PACKAGE_ROOT, 'client', 'src', '.plugins');
    const clientV2Root = path.join(process.env.APP_PACKAGE_ROOT, 'client-v2', 'src', '.plugins');
    const expectedPackageMap = {
      '@nocobase/plugin-js-template': 'nocobase_plugin_js_template.ts',
    };
    expect(fs.readJsonSync(path.join(clientRoot, 'packageMap.json'))).toEqual(expectedPackageMap);
    expect(fs.readJsonSync(path.join(clientV2Root, 'packageMap.json'))).toEqual(expectedPackageMap);

    const clientManifest = fs.readFileSync(path.join(clientRoot, 'packages', 'nocobase_plugin_js_template.ts'), 'utf8');
    const clientV2Manifest = fs.readFileSync(
      path.join(clientV2Root, 'packages', 'nocobase_plugin_js_template.ts'),
      'utf8',
    );
    expect(clientManifest).toContain('/plugin-js-template/src/client');
    expect(clientManifest).not.toContain('/plugin-js-template/src/client-v2');
    expect(clientV2Manifest).toContain('/plugin-js-template/src/client-v2');
  });
});

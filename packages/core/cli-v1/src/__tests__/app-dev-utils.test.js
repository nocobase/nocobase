/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const {
  buildAppDevServerArgs,
  createPluginClientExternals,
  getPluginClientModuleIds,
  shouldUseAppDevServerSource,
  toPosixPath,
} = require('../commands/app-dev-utils');

describe('cli-v1 app-dev utils', () => {
  test('toPosixPath normalizes Windows paths for generated browser imports', () => {
    expect(toPosixPath('C:\\Users\\tester\\app\\packages\\plugins\\demo\\src\\client\\index.tsx')).toBe(
      'C:/Users/tester/app/packages/plugins/demo/src/client/index.tsx',
    );
  });

  test('toPosixPath keeps POSIX paths unchanged', () => {
    expect(toPosixPath('/Users/tester/app/packages/plugins/demo/src/client/index.tsx')).toBe(
      '/Users/tester/app/packages/plugins/demo/src/client/index.tsx',
    );
  });

  test('shouldUseAppDevServerSource requires app-dev and the app source entry', () => {
    const appRoot = path.resolve('/app');
    const appSourceEntry = path.resolve(appRoot, 'storage/.app-dev/src/index.ts');
    const existsSync = (file) => file === appSourceEntry;

    expect(
      shouldUseAppDevServerSource({
        cwd: appRoot,
        env: {
          APP_ENV: 'development',
          APP_PACKAGE_ROOT: 'storage/.app-dev',
          NOCOBASE_APP_DEV: 'true',
        },
        existsSync,
      }),
    ).toBe(true);
    expect(
      shouldUseAppDevServerSource({
        cwd: appRoot,
        env: {
          APP_ENV: 'production',
          APP_PACKAGE_ROOT: 'storage/.app-dev',
          NOCOBASE_APP_DEV: 'true',
        },
        existsSync,
      }),
    ).toBe(false);
    expect(
      shouldUseAppDevServerSource({
        cwd: appRoot,
        env: {
          APP_ENV: 'development',
          APP_PACKAGE_ROOT: 'storage/.app-dev',
          NOCOBASE_APP_DEV: '',
        },
        existsSync,
      }),
    ).toBe(false);
  });

  test('buildAppDevServerArgs runs the app source through tsx watch', () => {
    expect(
      buildAppDevServerArgs({
        appPackageRoot: 'storage/.app-dev',
        argv: ['node', 'nocobase-v1', 'start', '--launch-mode', 'direct'],
        serverTsconfigPath: './tsconfig.server.json',
      }),
    ).toEqual([
      'watch',
      `--ignore=${path.resolve(process.cwd(), 'storage/plugins')}/**`,
      '--tsconfig',
      './tsconfig.server.json',
      '-r',
      'tsconfig-paths/register',
      path.join('storage/.app-dev', 'src/index.ts'),
      'start',
      '--launch-mode',
      'direct',
    ]);
  });

  test('getPluginClientModuleIds discovers plugin client marker files', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-app-dev-modules-'));
    const localPluginDir = path.join(cwd, 'packages/plugins/@nocobase/plugin-local');
    const remotePluginDir = path.join(cwd, 'node_modules/@nocobase/plugin-remote');
    fs.ensureDirSync(localPluginDir);
    fs.ensureDirSync(remotePluginDir);
    fs.writeJsonSync(path.join(localPluginDir, 'package.json'), { name: '@nocobase/plugin-local' });
    fs.writeFileSync(path.join(localPluginDir, 'client.js'), '');
    fs.writeJsonSync(path.join(remotePluginDir, 'package.json'), { name: '@nocobase/plugin-remote' });
    fs.writeFileSync(path.join(remotePluginDir, 'client-v2.js'), '');

    expect(getPluginClientModuleIds({ cwd }).sort()).toEqual([
      '@nocobase/plugin-local/client',
      '@nocobase/plugin-remote/client-v2',
    ]);
    fs.removeSync(cwd);
  });

  test('createPluginClientExternals maps plugin client imports to app-dev modules', () => {
    expect(createPluginClientExternals(['@nocobase/plugin-demo/client'])).toEqual({
      '@nocobase/plugin-demo/client':
        'window.__nocobase_app_dev_plugins__ && window.__nocobase_app_dev_plugins__["@nocobase/plugin-demo/client"]',
    });
  });
});

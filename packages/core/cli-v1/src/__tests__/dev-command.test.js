/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const {
  buildAppDevForwardArgs,
  createSettingsDevProcessOptions,
  forwardDevToAppDev,
  resolveDevRuntimeMode,
  resolveSettingsDevPort,
} = require('../commands/dev')._test;

describe('cli-v1 dev command', () => {
  test('buildAppDevForwardArgs rewrites dev argv to app-dev while preserving extra args', () => {
    expect(
      buildAppDevForwardArgs(['node', 'nocobase-v1', 'dev', '--rsbuild', '--port', '13000', '--inspect=9229']),
    ).toEqual(['app-dev', '--rsbuild', '--port', '13000', '--inspect=9229']);
  });

  test('forwardDevToAppDev delegates to nocobase-v1 app-dev for create-app projects', async () => {
    const calls = [];
    const runCommand = async (...args) => {
      calls.push(args);
    };

    await forwardDevToAppDev({
      argv: ['node', 'nocobase-v1', 'dev', '--port', '13000', '--db-sync'],
      runCommand,
    });

    expect(calls).toEqual([['nocobase-v1', ['app-dev', '--port', '13000', '--db-sync']]]);
  });

  test('resolveDevRuntimeMode keeps both clients in legacy-default', () => {
    expect(resolveDevRuntimeMode({ appClientEntryMode: 'legacy-default' })).toMatchObject({
      useModernOnlyEntryMode: false,
      shouldRunClient: true,
      shouldRunClientV2: true,
      shouldRunSettings: true,
      shouldRunServer: true,
    });
  });

  test('resolveDevRuntimeMode only runs v2 client and server in modern-only', () => {
    expect(resolveDevRuntimeMode({ appClientEntryMode: 'modern-only' })).toMatchObject({
      useModernOnlyEntryMode: true,
      shouldRunClient: false,
      shouldRunClientV2: true,
      shouldRunSettings: true,
      shouldRunServer: true,
    });
  });

  test('resolveDevRuntimeMode preserves explicit client-v2-only flag behavior', () => {
    expect(resolveDevRuntimeMode({ clientV2Only: true, appClientEntryMode: 'legacy-default' })).toMatchObject({
      useModernOnlyEntryMode: false,
      shouldRunClient: false,
      shouldRunClientV2: true,
      shouldRunSettings: true,
      shouldRunServer: false,
    });
  });

  test('resolveSettingsDevPort reserves APP_PORT + 3 by default', () => {
    expect(resolveSettingsDevPort(13001)).toBe(13004);
  });

  test('createSettingsDevProcessOptions uses the standalone config and settings HMR path', () => {
    expect(
      createSettingsDevProcessOptions({
        appPackageRoot: '/repo/packages/core/app',
        appPort: 13001,
        settingsPort: 13004,
        browserPort: 13001,
        appPublicPath: '/nocobase/',
        processEnv: { API_BASE_URL: '/api/' },
      }),
    ).toMatchObject({
      command: 'rsbuild',
      args: ['dev', '--config', '/repo/packages/core/app/client-settings/rsbuild.config.ts'],
      runOptions: {
        prefix: 'client-settings',
        env: {
          APP_PORT: '13001',
          APP_SETTINGS_PORT: '13004',
          RSPACK_HMR_CLIENT_PORT: '13001',
          RSPACK_HMR_PATH: '/nocobase/settings/__rspack_hmr',
        },
      },
    });
  });
});

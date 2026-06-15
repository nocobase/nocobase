/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const { buildAppDevForwardArgs, forwardDevToAppDev } = require('../commands/dev')._test;

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
});

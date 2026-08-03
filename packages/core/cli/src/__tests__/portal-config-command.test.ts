/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  configurePortalWorkspace: vi.fn(),
  getCurrentEnvName: vi.fn(),
  getEnv: vi.fn(),
  setEnvPortalPath: vi.fn(),
  printInfo: vi.fn(),
  printSuccess: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
  setEnvPortalPath: mocks.setEnvPortalPath,
}));

vi.mock('../lib/portal-configure.js', () => ({
  configurePortalWorkspace: mocks.configurePortalWorkspace,
}));

vi.mock('../lib/ui.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/ui.js')>();
  return {
    ...actual,
    printInfo: mocks.printInfo,
    printSuccess: mocks.printSuccess,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

test('portal config stores development path changes in env config', async () => {
  const { default: PortalConfig } = await import('../commands/portal/config.js');
  const env = {
    name: 'remote1',
    kind: 'http',
    apiBaseUrl: 'http://localhost:56187/api',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    config: {
      apiBaseUrl: 'http://localhost:56187/api',
    },
  };
  mocks.getCurrentEnvName.mockResolvedValue('remote1');
  mocks.getEnv.mockResolvedValue(env);
  mocks.configurePortalWorkspace.mockResolvedValue({
    app: '',
    portal: 'customer',
    portalDir: '/Users/chen/test6/customer',
    config: undefined,
    remoteSynced: false,
    pathUpdated: true,
  });

  const command = Object.assign(Object.create(PortalConfig.prototype), {
    argv: ['--path', '/Users/chen/test6/customer'],
    parse: vi.fn(async () => ({
      args: { portal: 'customer' },
      flags: {
        path: '/Users/chen/test6/customer',
      },
    })),
    config: {
      pjson: {
        version: '1.2.3',
      },
    },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await PortalConfig.prototype.run.call(command);

  expect(mocks.configurePortalWorkspace.mock.calls).toEqual([
    [
      {
        portal: 'customer',
        env,
        envName: 'remote1',
        cliVersion: '1.2.3',
        sourceStorage: undefined,
        gitRepo: undefined,
        gitBranch: undefined,
        gitPath: undefined,
        sourcePath: '/Users/chen/test6/customer',
      },
    ],
  ]);
  expect(mocks.setEnvPortalPath.mock.calls).toEqual([
    ['remote1', 'customer', '/Users/chen/test6/customer', { scope: 'global' }],
  ]);
  expect(mocks.printSuccess.mock.calls).toEqual([['Portal "customer" configuration updated.']]);
  expect(mocks.printInfo.mock.calls).toEqual([['Development path: /Users/chen/test6/customer']]);
});

test('portal config syncs source configuration to the remote record', async () => {
  const { default: PortalConfig } = await import('../commands/portal/config.js');
  const env = {
    name: 'remote1',
    kind: 'http',
    apiBaseUrl: 'http://localhost:56187/api',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    config: {
      apiBaseUrl: 'http://localhost:56187/api',
    },
  };
  mocks.getCurrentEnvName.mockResolvedValue('remote1');
  mocks.getEnv.mockResolvedValue(env);
  mocks.configurePortalWorkspace.mockResolvedValue({
    app: 'main',
    portal: 'customer',
    portalDir: '/Users/chen/test6/customer',
    config: {
      sourceStorage: 'git',
      git: {
        repo: 'git@github.com:nocobase/customer-portal.git',
        branch: 'main',
        path: '.',
      },
    },
    remoteSynced: true,
    pathUpdated: false,
  });

  const command = Object.assign(Object.create(PortalConfig.prototype), {
    argv: ['--source-storage', 'git', '--git-repo', 'git@github.com:nocobase/customer-portal.git'],
    parse: vi.fn(async () => ({
      args: { portal: 'customer' },
      flags: {
        'source-storage': 'git',
        'git-repo': 'git@github.com:nocobase/customer-portal.git',
      },
    })),
    config: {
      pjson: {
        version: '1.2.3',
      },
    },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await PortalConfig.prototype.run.call(command);

  expect(mocks.setEnvPortalPath).not.toHaveBeenCalled();
  expect(mocks.printSuccess.mock.calls).toEqual([['Portal "customer" configuration updated.']]);
  expect(mocks.printInfo.mock.calls).toEqual([['Remote portal record: synced']]);
});

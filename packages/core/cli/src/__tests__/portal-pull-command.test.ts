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
  getCurrentEnvName: vi.fn(),
  getEnv: vi.fn(),
  setEnvPortalPath: vi.fn(),
  pullPortalSource: vi.fn(),
  printInfo: vi.fn(),
  printSuccess: vi.fn(),
  printWarning: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
  setEnvPortalPath: mocks.setEnvPortalPath,
}));

vi.mock('../lib/portal-source.js', () => ({
  pullPortalSource: mocks.pullPortalSource,
}));

vi.mock('../lib/ui.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/ui.js')>();
  return {
    ...actual,
    printInfo: mocks.printInfo,
    printSuccess: mocks.printSuccess,
    printWarning: mocks.printWarning,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

test('portal pull passes temporary Git source options without updating configuration', async () => {
  const { default: PortalPull } = await import('../commands/portal/pull.js');
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
  mocks.pullPortalSource.mockResolvedValue({
    app: 'main',
    portal: 'customer',
    portalDir: '/Users/chen/test6/customer',
    mode: 'http',
    sourceStorage: 'git',
    changed: true,
    dependenciesInstalled: false,
    installSkipped: true,
    installFailed: false,
  });

  const command = Object.assign(Object.create(PortalPull.prototype), {
    argv: [
      '--git-repo',
      'git@github.com:nocobase/customer-portal.git',
      '--git-branch',
      'develop',
      '--git-path',
      'portals/customer',
      '--path',
      '/Users/chen/test6/customer',
      '--no-install',
    ],
    parse: vi.fn(async () => ({
      args: { portal: 'customer' },
      flags: {
        'git-repo': 'git@github.com:nocobase/customer-portal.git',
        'git-branch': 'develop',
        'git-path': 'portals/customer',
        path: '/Users/chen/test6/customer',
        install: false,
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

  await PortalPull.prototype.run.call(command);

  expect(mocks.pullPortalSource.mock.calls).toEqual([
    [
      {
        portal: 'customer',
        env,
        envName: 'remote1',
        cliVersion: '1.2.3',
        force: undefined,
        installDependencies: false,
        sourcePath: '/Users/chen/test6/customer',
        defaultSourcePath: true,
        gitRepo: 'git@github.com:nocobase/customer-portal.git',
        gitBranch: 'develop',
        gitPath: 'portals/customer',
      },
    ],
  ]);
  expect(mocks.setEnvPortalPath.mock.calls).toEqual([
    ['remote1', 'customer', '/Users/chen/test6/customer', { scope: 'global' }],
  ]);
  expect(mocks.printSuccess.mock.calls).toEqual([
    ['Pulled portal source "customer" into /Users/chen/test6/customer'],
  ]);
});

test('portal pull rejects temporary Git branch without repo', async () => {
  const { default: PortalPull } = await import('../commands/portal/pull.js');
  const command = Object.assign(Object.create(PortalPull.prototype), {
    argv: ['--git-branch', 'develop'],
    parse: vi.fn(async () => ({
      args: { portal: 'customer' },
      flags: {
        'git-branch': 'develop',
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(PortalPull.prototype.run.call(command)).rejects.toThrow(
    /--git-branch and --git-path require --git-repo/,
  );
  expect(mocks.getCurrentEnvName).not.toHaveBeenCalled();
  expect(mocks.pullPortalSource).not.toHaveBeenCalled();
});

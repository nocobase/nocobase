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
  deployPortalWorkspace: vi.fn(),
  printInfo: vi.fn(),
  printSuccess: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
}));

vi.mock('../lib/portal-deploy.js', () => ({
  deployPortalWorkspace: mocks.deployPortalWorkspace,
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

test('portal deploy resolves the current env name before deploying', async () => {
  const { default: PortalDeploy } = await import('../commands/portal/deploy.js');
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
  mocks.deployPortalWorkspace.mockResolvedValue({
    app: 'main',
    portal: 'cba',
    portalDir: '/Users/chen/test6/remote1/source/storage/portals/main/cba',
    portalBase: '/x/cba/',
    distDir: '/Users/chen/test6/remote1/source/storage/portals/main/cba/dist',
    serverDistPath: 'portals/main/cba/dist',
    mode: 'http',
    uploaded: true,
  });

  const command = Object.assign(Object.create(PortalDeploy.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
      args: { portal: 'cba' },
      flags: {},
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

  await PortalDeploy.prototype.run.call(command);

  expect(mocks.getCurrentEnvName.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(mocks.getEnv.mock.calls).toEqual([['remote1', { scope: 'global' }]]);
  expect(mocks.deployPortalWorkspace.mock.calls).toEqual([
    [
      {
        portal: 'cba',
        env,
        envName: 'remote1',
        cliVersion: '1.2.3',
      },
    ],
  ]);
  expect(mocks.printInfo.mock.calls).toEqual([
    ['Mode: http'],
    ['App: main'],
    ['Base: /x/cba/'],
    ['Local dist: /Users/chen/test6/remote1/source/storage/portals/main/cba/dist'],
    ['Server dist: portals/main/cba/dist'],
  ]);
});

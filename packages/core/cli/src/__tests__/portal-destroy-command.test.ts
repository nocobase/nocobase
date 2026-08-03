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
  unsetEnvPortalPath: vi.fn(),
  destroyPortalWorkspace: vi.fn(),
  printInfo: vi.fn(),
  printSuccess: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
  unsetEnvPortalPath: mocks.unsetEnvPortalPath,
}));

vi.mock('../lib/portal-destroy.js', () => ({
  destroyPortalWorkspace: mocks.destroyPortalWorkspace,
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

test('portal destroy resolves the current env name before destroying', async () => {
  const { default: PortalDestroy } = await import('../commands/portal/destroy.js');
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
  mocks.destroyPortalWorkspace.mockResolvedValue({
    app: 'main',
    portal: 'cba',
    developmentPath: '/Users/chen/test6/remote1/source/portals/cba',
    deploymentPath: '/Users/chen/test6/remote1/source/storage/portals/main/cba',
    portalBase: '/x/cba/',
    mode: 'http',
    recordDeleted: true,
    developmentPathDeleted: false,
    deploymentPathDeleted: true,
  });

  const command = Object.assign(Object.create(PortalDestroy.prototype), {
    argv: ['--yes'],
    parse: vi.fn(async () => ({
      args: { portal: 'cba' },
      flags: {
        yes: true,
        force: false,
        'delete-dev-path': true,
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

  await PortalDestroy.prototype.run.call(command);

  expect(mocks.getCurrentEnvName.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(mocks.getEnv.mock.calls).toEqual([['remote1', { scope: 'global' }]]);
  expect(mocks.destroyPortalWorkspace.mock.calls).toEqual([
    [
      {
        portal: 'cba',
        env,
        envName: 'remote1',
        cliVersion: '1.2.3',
        force: false,
        deleteDevPath: true,
      },
    ],
  ]);
  expect(mocks.unsetEnvPortalPath.mock.calls).toEqual([['remote1', 'cba', { scope: 'global' }]]);
  expect(mocks.printSuccess.mock.calls).toEqual([['Portal "cba" destroyed.']]);
  expect(mocks.printInfo.mock.calls).toEqual([
    ['Mode: http'],
    ['App: main'],
    ['Base: /x/cba/'],
    ['Record: deleted'],
    ['Deployment path: deleted (/Users/chen/test6/remote1/source/storage/portals/main/cba)'],
    ['Development path: retained (/Users/chen/test6/remote1/source/portals/cba)'],
  ]);
});

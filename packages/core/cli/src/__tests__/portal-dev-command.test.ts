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
  devPortalWorkspace: vi.fn(),
  printInfo: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
}));

vi.mock('../lib/portal-dev.js', () => ({
  devPortalWorkspace: mocks.devPortalWorkspace,
}));

vi.mock('../lib/ui.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/ui.js')>();
  return {
    ...actual,
    printInfo: mocks.printInfo,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

test('portal dev resolves the current env name before starting dev', async () => {
  const { default: PortalDev } = await import('../commands/portal/dev.js');
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
  mocks.devPortalWorkspace.mockImplementation(async (options) => {
    options.onStart({
      app: 'main',
      portal: 'cba',
      portalDir: '/Users/chen/test6/remote1/source/storage/portals/main/cba',
      portalBase: '/x/cba/',
      mode: 'http',
    });
    return {
      app: 'main',
      portal: 'cba',
      portalDir: '/Users/chen/test6/remote1/source/storage/portals/main/cba',
      portalBase: '/x/cba/',
      mode: 'http',
    };
  });

  const command = Object.assign(Object.create(PortalDev.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
      args: { portal: 'cba' },
      flags: {},
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await PortalDev.prototype.run.call(command);

  expect(mocks.getCurrentEnvName.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(mocks.getEnv.mock.calls).toEqual([['remote1', { scope: 'global' }]]);
  expect(mocks.devPortalWorkspace.mock.calls[0][0]).toMatchObject({
    portal: 'cba',
    env,
    envName: 'remote1',
  });
  expect(mocks.printInfo.mock.calls).toEqual([
    ['Starting portal "cba"...'],
    ['Mode: http'],
    ['App: main'],
    ['Base: /x/cba/'],
    ['Dir: /Users/chen/test6/remote1/source/storage/portals/main/cba'],
  ]);
});

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
  listPortalWorkspaces: vi.fn(),
  printInfo: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
}));

vi.mock('../lib/portal-list.js', () => ({
  listPortalWorkspaces: mocks.listPortalWorkspaces,
  toPortalOutputItem: (item: {
    routeName: string;
    portalUrl: string;
    developmentMode: string;
    portalDir: string;
    enabled: boolean;
    localSynced: boolean | null;
  }) => ({
    name: item.routeName,
    url: item.portalUrl,
    developmentMode: item.developmentMode,
    localPath: item.localSynced === true ? item.portalDir : '',
    enabled: item.enabled,
    localSynced: item.localSynced,
  }),
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

test('portal list resolves the current env name and prints local sync status', async () => {
  const { default: PortalList } = await import('../commands/portal/list.js');
  const env = {
    name: 'remote1',
    kind: 'http',
    apiBaseUrl: 'http://localhost:56187/api',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    config: {
      apiBaseUrl: 'http://localhost:56187/api',
    },
  };
  const log = vi.fn();
  mocks.getCurrentEnvName.mockResolvedValue('remote1');
  mocks.getEnv.mockResolvedValue(env);
  mocks.listPortalWorkspaces.mockResolvedValue({
    app: 'main',
    mode: 'http',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    items: [
      {
        uid: 'customer',
        routeName: 'customer',
        routePath: '/customer',
        developmentMode: 'ai',
        enabled: true,
        portalUrl: 'http://localhost:56187/x/customer/',
        portalDir: '/Users/chen/test6/remote1/source/storage/portals/main/customer',
        localSynced: true,
      },
      {
        uid: 'partner',
        routeName: 'partner',
        routePath: '/partner',
        developmentMode: 'ai',
        enabled: true,
        portalUrl: 'http://localhost:56187/x/partner/',
        portalDir: '/Users/chen/test6/remote1/source/storage/portals/main/partner',
        localSynced: false,
      },
      {
        uid: 'admin',
        routeName: 'admin',
        routePath: '/admin',
        developmentMode: 'no-code',
        enabled: true,
        portalUrl: 'http://localhost:56187/v/admin',
        portalDir: '/Users/chen/test6/remote1/source/storage/portals/main/admin',
        localSynced: null,
      },
    ],
  });

  const command = Object.assign(Object.create(PortalList.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
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
    log,
  });

  await PortalList.prototype.run.call(command);

  expect(mocks.getCurrentEnvName.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(mocks.getEnv.mock.calls).toEqual([['remote1', { scope: 'global' }]]);
  expect(mocks.listPortalWorkspaces.mock.calls).toEqual([
    [
      {
        env,
        envName: 'remote1',
        cliVersion: '1.2.3',
      },
    ],
  ]);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log.mock.calls[0][0]).toContain('Name');
  expect(log.mock.calls[0][0]).not.toContain('Title');
  expect(log.mock.calls[0][0]).toContain('URL');
  expect(log.mock.calls[0][0]).toContain('Development mode');
  expect(log.mock.calls[0][0]).toContain('Local path');
  expect(log.mock.calls[0][0]).toContain('Local synced');
  expect(log.mock.calls[0][0]).toContain('customer');
  expect(log.mock.calls[0][0]).toContain('partner');
  expect(log.mock.calls[0][0]).toContain('admin');
  expect(log.mock.calls[0][0]).toContain('ai');
  expect(log.mock.calls[0][0]).toContain('no-code');
  expect(log.mock.calls[0][0]).toContain('http://localhost:56187/x/customer/');
  expect(log.mock.calls[0][0]).toContain('http://localhost:56187/v/admin');
  expect(log.mock.calls[0][0]).not.toContain('http://localhost:56187/x/admin/');
  expect(log.mock.calls[0][0]).toContain('/Users/chen/test6/remote1/source/storage/portals/main/customer');
  expect(log.mock.calls[0][0]).not.toContain('/Users/chen/test6/remote1/source/storage/portals/main/partner');
  expect(log.mock.calls[0][0]).not.toContain('/Users/chen/test6/remote1/source/storage/portals/main/admin');
  expect(log.mock.calls[0][0]).toContain('yes');
  expect(log.mock.calls[0][0]).toContain('no');
});

test('portal list prints an empty message when no portals exist', async () => {
  const { default: PortalList } = await import('../commands/portal/list.js');
  const env = {
    name: 'remote1',
    kind: 'http',
    apiBaseUrl: 'http://localhost:56187/api',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    config: {
      apiBaseUrl: 'http://localhost:56187/api',
    },
  };
  const log = vi.fn();
  mocks.getCurrentEnvName.mockResolvedValue('remote1');
  mocks.getEnv.mockResolvedValue(env);
  mocks.listPortalWorkspaces.mockResolvedValue({
    app: 'main',
    mode: 'http',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    items: [],
  });

  const command = Object.assign(Object.create(PortalList.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
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
    log,
  });

  await PortalList.prototype.run.call(command);

  expect(log).not.toHaveBeenCalled();
  expect(mocks.printInfo.mock.calls).toEqual([['No Portal records found.']]);
});

test('portal list prints JSON output when requested', async () => {
  const { default: PortalList } = await import('../commands/portal/list.js');
  const env = {
    name: 'remote1',
    kind: 'http',
    apiBaseUrl: 'http://localhost:56187/api',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    config: {
      apiBaseUrl: 'http://localhost:56187/api',
    },
  };
  const log = vi.fn();
  mocks.getCurrentEnvName.mockResolvedValue('remote1');
  mocks.getEnv.mockResolvedValue(env);
  mocks.listPortalWorkspaces.mockResolvedValue({
    app: 'main',
    mode: 'http',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    items: [
      {
        uid: 'customer',
        routeName: 'customer',
        routePath: '/customer',
        developmentMode: 'ai',
        enabled: true,
        portalUrl: 'http://localhost:56187/x/customer/',
        portalDir: '/Users/chen/test6/remote1/source/storage/portals/main/customer',
        localSynced: true,
      },
      {
        uid: 'admin',
        routeName: 'admin',
        routePath: '/admin',
        developmentMode: 'no-code',
        enabled: false,
        portalUrl: '',
        portalDir: '',
        localSynced: null,
      },
    ],
  });

  const command = Object.assign(Object.create(PortalList.prototype), {
    argv: ['--json'],
    parse: vi.fn(async () => ({
      flags: {
        'json-output': true,
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
    log,
  });

  await PortalList.prototype.run.call(command);

  expect(JSON.parse(log.mock.calls[0][0])).toEqual([
    {
      name: 'customer',
      url: 'http://localhost:56187/x/customer/',
      developmentMode: 'ai',
      localPath: '/Users/chen/test6/remote1/source/storage/portals/main/customer',
      enabled: true,
      localSynced: true,
    },
    {
      name: 'admin',
      url: '',
      developmentMode: 'no-code',
      localPath: '',
      enabled: false,
      localSynced: null,
    },
  ]);
  expect(mocks.printInfo).not.toHaveBeenCalled();
});

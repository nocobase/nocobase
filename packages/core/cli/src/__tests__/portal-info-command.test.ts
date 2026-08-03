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
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
}));

vi.mock('../lib/portal-list.js', () => ({
  listPortalWorkspaces: mocks.listPortalWorkspaces,
  toPortalOutputItem: (item: {
    portalName: string;
    portalUrl: string;
    portalType: string;
    portalDir: string;
    deployDir: string;
    enabled: boolean;
    sourceStorage: string;
  }) => ({
    name: item.portalName,
    url: item.portalUrl,
    portalType: item.portalType,
    developmentPath: item.portalDir,
    deploymentPath: item.deployDir,
    enabled: item.enabled,
    sourceStorage: item.sourceStorage,
  }),
}));

function makeCommand(
  PortalInfo: typeof import('../commands/portal/info.js').default,
  portal: string,
  flags: Record<string, unknown> = {},
) {
  return Object.assign(Object.create(PortalInfo.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
      args: { portal },
      flags,
    })),
    config: {
      pjson: {
        version: '1.2.3',
      },
    },
    error: (message: string) => {
      throw new Error(message);
    },
    log: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('portal info prints AI portal details', async () => {
  const { default: PortalInfo } = await import('../commands/portal/info.js');
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
  mocks.listPortalWorkspaces.mockResolvedValue({
    app: 'main',
    mode: 'http',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    items: [
      {
        uid: 'customer',
        portalName: 'customer',
        routePath: '/customer',
        portalType: 'ai',
        enabled: true,
        sourceStorage: 'nocobase',
        portalUrl: 'http://localhost:56187/x/customer/',
        portalDir: '/Users/chen/test6/customer',
        deployDir: '/Users/chen/test6/remote1/source/storage/portals/main/customer',
      },
    ],
  });
  const command = makeCommand(PortalInfo, 'customer');

  await PortalInfo.prototype.run.call(command);

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
  expect(command.log.mock.calls).toEqual([
    [
      [
        'Name: customer',
        'URL: http://localhost:56187/x/customer/',
        'Portal type: ai',
        'Development path: /Users/chen/test6/customer',
        'Deployment path: /Users/chen/test6/remote1/source/storage/portals/main/customer',
        'Enabled: yes',
      ].join('\n'),
    ],
  ]);
});

test('portal info leaves development and deployment fields empty for no-code portals', async () => {
  const { default: PortalInfo } = await import('../commands/portal/info.js');
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
  mocks.listPortalWorkspaces.mockResolvedValue({
    app: 'main',
    mode: 'http',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    items: [
      {
        uid: 'admin',
        portalName: 'admin',
        routePath: '/admin',
        portalType: 'no-code',
        enabled: true,
        sourceStorage: 'nocobase',
        portalUrl: 'http://localhost:56187/v/admin',
        portalDir: '',
        deployDir: '',
      },
    ],
  });
  const command = makeCommand(PortalInfo, 'admin');

  await PortalInfo.prototype.run.call(command);

  expect(command.log.mock.calls).toEqual([
    [
      [
        'Name: admin',
        'URL: http://localhost:56187/v/admin',
        'Portal type: no-code',
        'Development path: ',
        'Deployment path: ',
        'Enabled: yes',
      ].join('\n'),
    ],
  ]);
});

test('portal info prints JSON output when requested', async () => {
  const { default: PortalInfo } = await import('../commands/portal/info.js');
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
  mocks.listPortalWorkspaces.mockResolvedValue({
    app: 'main',
    mode: 'http',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    items: [
      {
        uid: 'customer',
        portalName: 'customer',
        routePath: '/customer',
        portalType: 'ai',
        enabled: true,
        sourceStorage: 'nocobase',
        portalUrl: 'http://localhost:56187/x/customer/',
        portalDir: '/Users/chen/test6/customer',
        deployDir: '/Users/chen/test6/remote1/source/storage/portals/main/customer',
      },
    ],
  });
  const command = makeCommand(PortalInfo, 'customer', { 'json-output': true });

  await PortalInfo.prototype.run.call(command);

  expect(JSON.parse(command.log.mock.calls[0][0])).toEqual({
    name: 'customer',
    url: 'http://localhost:56187/x/customer/',
    portalType: 'ai',
    developmentPath: '/Users/chen/test6/customer',
    deploymentPath: '/Users/chen/test6/remote1/source/storage/portals/main/customer',
    enabled: true,
    sourceStorage: 'nocobase',
  });
});

test('portal info fails when the portal does not exist', async () => {
  const { default: PortalInfo } = await import('../commands/portal/info.js');
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
  mocks.listPortalWorkspaces.mockResolvedValue({
    app: 'main',
    mode: 'http',
    storagePath: '/Users/chen/test6/remote1/source/storage',
    items: [],
  });
  const command = makeCommand(PortalInfo, 'missing');

  await expect(PortalInfo.prototype.run.call(command)).rejects.toThrow('Portal "missing" was not found.');
});

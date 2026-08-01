/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import type { RequestOptions } from '../lib/api-client.js';
import { NB_CLI_ROOT_ENV } from '../lib/cli-home.js';
import type { PortalCreateEnvLike } from '../lib/portal-create.js';
import { listPortalWorkspaces } from '../lib/portal-list.js';

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function createEnv(params: {
  storagePath: string;
  name?: string;
  apiBaseUrl?: string;
  appPublicPath?: string;
  kind?: PortalCreateEnvLike['kind'];
  configuredStoragePath?: string;
}): PortalCreateEnvLike {
  return {
    name: params.name,
    kind: params.kind ?? 'local',
    apiBaseUrl: params.apiBaseUrl ?? 'http://localhost:13000/api',
    storagePath: params.storagePath,
    config: {
      apiBaseUrl: params.apiBaseUrl ?? 'http://localhost:13000/api',
      appPublicPath: params.appPublicPath,
      storagePath: params.configuredStoragePath ?? params.storagePath,
    },
  };
}

async function preparePortalWorkspace(params: { storagePath: string; app?: string; portal?: string }): Promise<string> {
  const app = params.app ?? 'main';
  const portal = params.portal ?? 'customer';
  const portalDir = path.join(params.storagePath, 'portals', app, portal);
  await fsp.mkdir(portalDir, { recursive: true });
  return portalDir;
}

function appInfoData(name = 'main') {
  return {
    data: {
      name,
    },
  };
}

function expectPortalRecordList(options: RequestOptions) {
  expect(options).toEqual(
    expect.objectContaining({
      flags: {
        pageSize: 200,
        sort: ['portalName'],
      },
      operation: expect.objectContaining({
        method: 'GET',
        pathTemplate: '/multiPortals:list',
        parameters: expect.arrayContaining([
          expect.objectContaining({
            name: 'pageSize',
            flagName: 'pageSize',
            in: 'query',
          }),
          expect.objectContaining({
            name: 'sort[]',
            flagName: 'sort',
            in: 'query',
            isArray: true,
          }),
        ]),
      }),
    }),
  );
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('lists portal records with local workspace sync status for AI portals', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-list-storage-');
  const customerDir = await preparePortalWorkspace({
    storagePath,
    app: 'crm',
    portal: 'customer',
  });
  const apiRequest = vi.fn(async () => ({
    ok: true,
    status: 200,
    data: {
      data: [
        {
          uid: 'customer',
          title: 'Customer',
          portalName: 'customer',
          routePath: '/customer',
          portalType: 'ai',
          enabled: true,
        },
        {
          uid: 'partner',
          title: 'Partner',
          portalName: 'partner',
          routePath: '/partner',
          portalType: 'no-code',
          enabled: false,
        },
      ],
    },
  }));

  await expect(
    listPortalWorkspaces({
      envName: 'dev',
      cliVersion: '1.2.3',
      env: createEnv({
        kind: 'local',
        storagePath,
        apiBaseUrl: 'http://localhost:13000/console/api/__app/crm',
      }),
      apiRequest,
    }),
  ).resolves.toEqual({
    app: 'crm',
    mode: 'local',
    storagePath,
    items: [
      {
        uid: 'customer',
        portalName: 'customer',
        routePath: '/customer',
        portalType: 'ai',
        enabled: true,
        sourceStorage: 'nocobase',
        gitRepo: '',
        gitBranch: '',
        gitPath: '',
        sourceRevision: '',
        options: {},
        portalUrl: 'http://localhost:13000/console/x/apps/crm/customer/',
        portalDir: customerDir,
        localSynced: true,
      },
      {
        uid: 'partner',
        portalName: 'partner',
        routePath: '/partner',
        portalType: 'no-code',
        enabled: false,
        sourceStorage: 'nocobase',
        gitRepo: '',
        gitBranch: '',
        gitPath: '',
        sourceRevision: '',
        options: {},
        portalUrl: '',
        portalDir: '',
        localSynced: null,
      },
    ],
  });

  expect(apiRequest).toHaveBeenCalledTimes(1);
  expect(apiRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      cliVersion: '1.2.3',
      envName: 'dev',
    }),
  );
  expectPortalRecordList(apiRequest.mock.calls[0][0]);
});

test('http list uses env source storage when no local storagePath is configured', async () => {
  const cliRoot = await makeTempDir('nocobase-cli-portal-list-root-');
  const originalCliRoot = process.env[NB_CLI_ROOT_ENV];
  process.env[NB_CLI_ROOT_ENV] = cliRoot;
  try {
    const storagePath = path.join(cliRoot, 'remote1', 'source', 'storage');
    const portalDir = await preparePortalWorkspace({ storagePath });
    const apiRequest = vi.fn(async () => ({
      ok: true,
      status: 200,
      data: {
        data: [
          {
            uid: 'customer',
            title: 'Customer',
            portalName: 'customer',
            routePath: '/customer',
            portalType: 'ai',
            enabled: true,
          },
        ],
      },
    }));

    await expect(
      listPortalWorkspaces({
        envName: 'remote1',
        env: createEnv({
          kind: 'http',
          name: 'remote1',
          storagePath: '/tmp/fallback',
          configuredStoragePath: '',
          apiBaseUrl: 'https://example.com/api',
        }),
        apiRequest,
      }),
    ).resolves.toMatchObject({
      app: 'main',
      mode: 'http',
      storagePath,
      items: [
        expect.objectContaining({
          portalDir,
          portalUrl: 'https://example.com/x/customer/',
          localSynced: true,
        }),
      ],
    });
  } finally {
    if (originalCliRoot === undefined) {
      delete process.env[NB_CLI_ROOT_ENV];
    } else {
      process.env[NB_CLI_ROOT_ENV] = originalCliRoot;
    }
  }
});

test('http list uses app:getInfo app name for custom-domain local paths', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-list-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'demo6',
    portal: 'crm',
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData('demo6') };
    }
    expectPortalRecordList(options);
    return {
      ok: true,
      status: 200,
      data: {
        data: [
          {
            uid: 'crm',
            title: 'CRM',
            portalName: 'crm',
            routePath: '/crm',
            portalType: 'ai',
            enabled: true,
          },
        ],
      },
    };
  });

  await expect(
    listPortalWorkspaces({
      envName: 'prod',
      cliVersion: '1.2.3',
      env: createEnv({
        kind: 'http',
        storagePath,
        apiBaseUrl: 'https://demo6.v11.demo.nocobase.com/api',
      }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'demo6',
    mode: 'http',
    storagePath,
    items: [
      expect.objectContaining({
        portalName: 'crm',
        portalDir,
        localSynced: true,
      }),
    ],
  });
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toEqual([
    '/app:getInfo',
    '/multiPortals:list',
  ]);
});

test('lists no-code portal records without local workspace fields', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-list-storage-');
  const apiRequest = vi.fn(async () => ({
    ok: true,
    status: 200,
    data: {
      data: [
        {
          uid: '__default_portal__',
          title: 'Admin',
          portalName: 'admin',
          routePath: '/admin',
          portalType: 'no-code',
          enabled: true,
        },
      ],
    },
  }));

  await expect(
    listPortalWorkspaces({
      env: createEnv({
        storagePath,
        apiBaseUrl: 'http://localhost:13000/console/api',
      }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    items: [
      expect.objectContaining({
        portalName: 'admin',
        portalType: 'no-code',
        enabled: true,
        portalUrl: 'http://localhost:13000/console/v/admin',
        portalDir: '',
        localSynced: null,
      }),
    ],
  });
});

test('lists sub-app no-code portal records with app-scoped access URLs', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-list-storage-');
  const apiRequest = vi.fn(async () => ({
    ok: true,
    status: 200,
    data: {
      data: [
        {
          uid: '__default_portal__',
          title: 'Admin',
          portalName: 'admin',
          routePath: '/admin',
          portalType: 'no-code',
          enabled: true,
        },
        {
          uid: 'legacy-admin',
          title: 'Legacy Admin',
          portalName: 'legacy-admin',
          routePath: '/v/apps/test/admin',
          portalType: 'no-code',
          enabled: true,
        },
      ],
    },
  }));

  await expect(
    listPortalWorkspaces({
      env: createEnv({
        storagePath,
        apiBaseUrl: 'http://localhost:56187/api/__app/test',
      }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'test',
    items: [
      expect.objectContaining({
        portalName: 'admin',
        portalType: 'no-code',
        portalUrl: 'http://localhost:56187/v/apps/test/admin',
        portalDir: '',
        localSynced: null,
      }),
      expect.objectContaining({
        portalName: 'legacy-admin',
        portalType: 'no-code',
        portalUrl: 'http://localhost:56187/v/apps/test/admin',
        portalDir: '',
        localSynced: null,
      }),
    ],
  });
});

test('does not include a URL for disabled portal records', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-list-storage-');
  const apiRequest = vi.fn(async () => ({
    ok: true,
    status: 200,
    data: {
      data: [
        {
          uid: 'customer',
          title: 'Customer',
          portalName: 'customer',
          routePath: '/customer',
          portalType: 'ai',
          enabled: false,
        },
      ],
    },
  }));

  await expect(
    listPortalWorkspaces({
      env: createEnv({ storagePath }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    items: [
      expect.objectContaining({
        portalName: 'customer',
        enabled: false,
        portalUrl: '',
      }),
    ],
  });
});

test('fails when portal list request fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-list-storage-');
  const apiRequest = vi.fn(async () => ({ ok: false, status: 500, data: { errors: [{ message: 'boom' }] } }));

  await expect(
    listPortalWorkspaces({
      env: createEnv({ storagePath }),
      apiRequest,
    }),
  ).rejects.toThrow(/Portal list failed with status 500/);
});

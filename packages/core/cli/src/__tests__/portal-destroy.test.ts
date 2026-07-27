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
import { destroyPortalWorkspace } from '../lib/portal-destroy.js';

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
  await fsp.mkdir(path.join(portalDir, 'dist'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'dist', 'index.html'), '<div id="root"></div>');
  return portalDir;
}

function expectPortalRecordDestroy(options: RequestOptions, portal = 'customer') {
  expect(options).toEqual(
    expect.objectContaining({
      flags: {
        filterByTk: portal,
      },
      operation: expect.objectContaining({
        method: 'POST',
        pathTemplate: '/multiPortals:destroy',
        parameters: expect.arrayContaining([
          expect.objectContaining({
            name: 'filterByTk',
            flagName: 'filterByTk',
            in: 'query',
            required: true,
          }),
        ]),
      }),
    }),
  );
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('destroys the portal record and local workspace', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-destroy-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'crm',
  });
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: 1 } }));

  await expect(
    destroyPortalWorkspace({
      portal: 'customer',
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
    portal: 'customer',
    portalDir,
    portalBase: '/console/x/apps/crm/customer/',
    mode: 'local',
    recordDeleted: true,
    workspaceDeleted: true,
  });

  expect(apiRequest).toHaveBeenCalledTimes(1);
  expect(apiRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      cliVersion: '1.2.3',
      envName: 'dev',
    }),
  );
  expectPortalRecordDestroy(apiRequest.mock.calls[0][0]);
  await expect(fsp.access(portalDir)).rejects.toThrow();
});

test('force destroy ignores a missing portal record and workspace', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-destroy-storage-');
  const apiRequest = vi.fn(async () => ({ ok: false, status: 404, data: { errors: [{ message: 'Not Found' }] } }));

  await expect(
    destroyPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      force: true,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    portal: 'customer',
    mode: 'local',
    recordDeleted: false,
    workspaceDeleted: false,
  });

  expect(apiRequest).toHaveBeenCalledTimes(1);
  expectPortalRecordDestroy(apiRequest.mock.calls[0][0]);
});

test('http destroy uses env source storage when no local storagePath is configured', async () => {
  const cliRoot = await makeTempDir('nocobase-cli-portal-destroy-root-');
  const originalCliRoot = process.env[NB_CLI_ROOT_ENV];
  process.env[NB_CLI_ROOT_ENV] = cliRoot;
  try {
    const storagePath = path.join(cliRoot, 'remote1', 'source', 'storage');
    const portalDir = await preparePortalWorkspace({ storagePath });
    const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: 1 } }));

    await expect(
      destroyPortalWorkspace({
        portal: 'customer',
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
      portalDir,
      mode: 'http',
      recordDeleted: true,
      workspaceDeleted: true,
    });
    await expect(fsp.access(portalDir)).rejects.toThrow();
  } finally {
    if (originalCliRoot === undefined) {
      delete process.env[NB_CLI_ROOT_ENV];
    } else {
      process.env[NB_CLI_ROOT_ENV] = originalCliRoot;
    }
  }
});

test('fails before deleting the record when workspace is missing without force', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-destroy-storage-');
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: 1 } }));

  await expect(
    destroyPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      apiRequest,
    }),
  ).rejects.toThrow(/Portal does not exist/);

  expect(apiRequest).not.toHaveBeenCalled();
});

test('fails when portal record destroy fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-destroy-storage-');
  const portalDir = await preparePortalWorkspace({ storagePath });
  const apiRequest = vi.fn(async () => ({ ok: false, status: 500, data: { errors: [{ message: 'boom' }] } }));

  await expect(
    destroyPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      apiRequest,
    }),
  ).rejects.toThrow(/Portal record destroy failed with status 500/);

  await expect(fsp.access(portalDir)).resolves.toBeUndefined();
});

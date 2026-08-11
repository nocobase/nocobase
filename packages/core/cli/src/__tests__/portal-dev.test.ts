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
import { devPortalWorkspace } from '../lib/portal-dev.js';
import type { RequestOptions } from '../lib/api-client.js';
import type { PortalCreateEnvLike } from '../lib/portal-create.js';

const tempDirs: string[] = [];

type PortalDevRunOptions = {
  cwd?: string;
  env?: Record<string, string>;
  envMode?: 'inherit' | 'replace';
  errorName?: string;
};

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
  portals?: PortalCreateEnvLike['config']['portals'];
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
      portals: params.portals,
    },
  };
}

async function preparePortalWorkspace(params: {
  storagePath: string;
  app?: string;
  portal?: string;
  serverDevEnvContent?: string;
  serverProdEnvContent?: string;
}): Promise<string> {
  const app = params.app ?? 'main';
  const portal = params.portal ?? 'customer';
  const portalDir = path.join(params.storagePath, 'portals', app, portal);
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'package.json'), '{"name":"portal"}\n');
  if (params.serverDevEnvContent !== undefined) {
    await fsp.writeFile(path.join(portalDir, '.env.server.dev'), params.serverDevEnvContent);
  }
  if (params.serverProdEnvContent !== undefined) {
    await fsp.writeFile(path.join(portalDir, '.env.server.prod'), params.serverProdEnvContent);
  }
  return portalDir;
}

function appInfoData(name = 'main') {
  return {
    data: {
      name,
    },
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('updates env files and starts portal dev without building or syncing records', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-dev-storage-');
  const sourceRoot = await makeTempDir('nocobase-cli-portal-dev-source-');
  const portalDir = await preparePortalWorkspace({
    storagePath: sourceRoot,
    app: 'crm',
    serverDevEnvContent: 'CUSTOM_VALUE=1\nNOCOBASE_API_PROXY_TARGET=http://old.example.com/api\n',
    serverProdEnvContent: 'NOCOBASE_PORTAL_NAME=old\nLOCAL_ONLY=true\n',
  });
  const onStart = vi.fn();
  const runCommand = vi.fn(async () => undefined);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    expect(options.operation.pathTemplate).toBe('/app:getInfo');
    return { ok: true, status: 200, data: appInfoData('crm') };
  });

  await expect(
    devPortalWorkspace({
      portal: 'customer',
      envName: 'prod',
      env: createEnv({
        kind: 'http',
        storagePath,
        configuredStoragePath: storagePath,
        apiBaseUrl: 'https://example.com/console/api/__app/crm',
        portals: {
          customer: { path: portalDir },
        },
      }),
      runCommand,
      apiRequest,
      onStart,
    }),
  ).resolves.toEqual({
    app: 'crm',
    portal: 'customer',
    portalDir,
    portalBase: '/console/x/apps/crm/customer/',
    mode: 'http',
  });

  expect(onStart).toHaveBeenCalledWith({
    app: 'crm',
    portal: 'customer',
    portalDir,
    portalBase: '/console/x/apps/crm/customer/',
    mode: 'http',
  });
  expect(runCommand).toHaveBeenCalledWith('pnpm', ['dev'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_PORTAL_NAME: 'customer',
      NOCOBASE_API_PROXY_TARGET: 'https://example.com/console/api/__app/crm',
      NOCOBASE_PORTAL_BASE: '/console/x/apps/crm/customer/',
      NOCOBASE_API_URL: '/console/api/__app/crm',
    }),
    envMode: 'replace',
    errorName: 'pnpm dev',
  });
  expect(runCommand).not.toHaveBeenCalledWith('pnpm', ['build'], expect.anything());
  expect(await fsp.readFile(path.join(portalDir, '.env.server.dev'), 'utf-8')).toBe(
    'CUSTOM_VALUE=1\n' +
      'NOCOBASE_API_PROXY_TARGET=https://example.com/console/api/__app/crm\n' +
      'NOCOBASE_PORTAL_NAME=customer\n',
  );
  expect(await fsp.readFile(path.join(portalDir, '.env.server.prod'), 'utf-8')).toBe(
    'NOCOBASE_PORTAL_NAME=customer\n' +
      'LOCAL_ONLY=true\n' +
      'NOCOBASE_API_PROXY_TARGET=https://example.com/console/api/__app/crm\n',
  );
});

test('fails when Portal is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-dev-storage-');
  const cwd = await makeTempDir('nocobase-cli-portal-dev-cwd-');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);

  try {
    await expect(
      devPortalWorkspace({
        portal: 'customer',
        env: createEnv({ storagePath }),
        runCommand: vi.fn(),
      }),
    ).rejects.toThrow(new RegExp(`Portal does not exist: ${path.join(cwd, 'customer').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  } finally {
    cwdSpy.mockRestore();
  }
});

test('fails when package.json is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-dev-storage-');
  const portalDir = await makeTempDir('nocobase-cli-portal-dev-source-');

  await expect(
    devPortalWorkspace({
      portal: 'customer',
      env: createEnv({
        storagePath,
        portals: {
          customer: { path: portalDir },
        },
      }),
      runCommand: vi.fn(),
    }),
  ).rejects.toThrow(/package\.json is missing/);
});

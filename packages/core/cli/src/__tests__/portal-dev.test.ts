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

async function preparePortalWorkspace(params: {
  storagePath: string;
  app?: string;
  portal?: string;
  envContent?: string;
  envLocalContent?: string;
}): Promise<string> {
  const app = params.app ?? 'main';
  const portal = params.portal ?? 'customer';
  const portalDir = path.join(params.storagePath, 'portals', app, portal);
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'package.json'), '{"name":"portal"}\n');
  if (params.envContent !== undefined) {
    await fsp.writeFile(path.join(portalDir, '.env'), params.envContent);
  }
  if (params.envLocalContent !== undefined) {
    await fsp.writeFile(path.join(portalDir, '.env.local'), params.envLocalContent);
  }
  return portalDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('updates env files and starts portal dev without building or syncing records', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-dev-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'crm',
    envContent: 'CUSTOM_VALUE=1\nNOCOBASE_API_URL=/old/api\n',
    envLocalContent: 'NOCOBASE_PORTAL_BASE=/old/base/\nLOCAL_ONLY=true\n',
  });
  const onStart = vi.fn();
  const runCommand = vi.fn(async () => undefined);

  await expect(
    devPortalWorkspace({
      portal: 'customer',
      env: createEnv({
        kind: 'http',
        storagePath,
        configuredStoragePath: storagePath,
        apiBaseUrl: 'https://example.com/console/api/__app/crm',
      }),
      runCommand,
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
      NOCOBASE_API_URL: 'https://example.com/console/api/__app/crm',
      NOCOBASE_PORTAL_BASE: '/console/x/apps/crm/customer/',
    }),
    envMode: 'replace',
    errorName: 'pnpm dev',
  });
  expect(runCommand).not.toHaveBeenCalledWith('pnpm', ['build'], expect.anything());
  expect(await fsp.readFile(path.join(portalDir, '.env'), 'utf-8')).toBe(
    'CUSTOM_VALUE=1\nNOCOBASE_API_URL=/console/api/__app/crm\nNOCOBASE_PORTAL_BASE=/console/x/apps/crm/customer/\n',
  );
  expect(await fsp.readFile(path.join(portalDir, '.env.local'), 'utf-8')).toBe(
    'NOCOBASE_PORTAL_BASE=/console/x/apps/crm/customer/\n' +
      'LOCAL_ONLY=true\n' +
      'NOCOBASE_API_URL=https://example.com/console/api/__app/crm\n',
  );
});

test('fails when portal workspace is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-dev-storage-');

  await expect(
    devPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      runCommand: vi.fn(),
    }),
  ).rejects.toThrow(/Portal workspace does not exist/);
});

test('fails when package.json is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-dev-storage-');
  await fsp.mkdir(path.join(storagePath, 'portals', 'main', 'customer'), { recursive: true });

  await expect(
    devPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      runCommand: vi.fn(),
    }),
  ).rejects.toThrow(/package\.json is missing/);
});

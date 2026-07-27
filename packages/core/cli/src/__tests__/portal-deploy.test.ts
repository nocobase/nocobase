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
import * as tar from 'tar';
import { afterEach, expect, test, vi } from 'vitest';
import { deployPortalWorkspace } from '../lib/portal-deploy.js';
import type { PortalCreateEnvLike } from '../lib/portal-create.js';
import type { RequestOptions } from '../lib/api-client.js';
import { NB_CLI_ROOT_ENV } from '../lib/cli-home.js';

const tempDirs: string[] = [];

type PortalDeployRunOptions = {
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
  await fsp.writeFile(path.join(portalDir, 'portal.config.json'), '{\n  "sourceStorage": "nocobase"\n}\n');
  if (params.envContent !== undefined) {
    await fsp.writeFile(path.join(portalDir, '.env'), params.envContent);
  }
  if (params.envLocalContent !== undefined) {
    await fsp.writeFile(path.join(portalDir, '.env.local'), params.envLocalContent);
  }
  return portalDir;
}

function expectPortalRecordFirstOrCreate(options: RequestOptions, portal = 'customer') {
  const body = JSON.parse(String(options.flags.body));

  expect(options).toEqual(
    expect.objectContaining({
      flags: expect.objectContaining({
        filterKeys: ['uid'],
      }),
      operation: expect.objectContaining({
        method: 'POST',
        pathTemplate: '/multiPortals:firstOrCreate',
        parameters: expect.arrayContaining([
          expect.objectContaining({
            name: 'filterKeys[]',
            flagName: 'filterKeys',
            in: 'query',
            isArray: true,
          }),
        ]),
      }),
    }),
  );
  expect(body).toEqual(
    expect.objectContaining({
      uid: portal,
      title: portal === 'customer' ? 'Customer' : expect.any(String),
      developmentMode: 'ai',
      routeName: portal,
      routePath: `/${portal}`,
      authCheck: true,
      enabled: true,
      uiLayoutUid: 'admin-layout-model',
      skipCreatePortalDirectory: true,
      options: {
        sourceStorage: 'nocobase',
      },
    }),
  );
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('updates env files, builds, and syncs the portal record locally without uploading dist', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'crm',
    envContent: 'CUSTOM_VALUE=1\nNOCOBASE_API_URL=/old/api\n',
    envLocalContent: 'NOCOBASE_PORTAL_BASE=/old/base/\nLOCAL_ONLY=true\n',
  });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'index.html'), '<div id="root"></div>');
  });
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: { uid: 'customer' } } }));

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({
        kind: 'local',
        storagePath,
        apiBaseUrl: 'http://localhost:13000/console/api/__app/crm',
      }),
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'crm',
    portal: 'customer',
    portalDir,
    portalBase: '/console/x/apps/crm/customer/',
    mode: 'local',
    uploaded: false,
    recordSynced: true,
  });

  expect(runCommand).toHaveBeenCalledWith('pnpm', ['build'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_API_URL: 'http://localhost:13000/console/api/__app/crm',
      NOCOBASE_PORTAL_BASE: '/console/x/apps/crm/customer/',
    }),
    envMode: 'replace',
    errorName: 'pnpm build',
  });
  expect(apiRequest).toHaveBeenCalledTimes(1);
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[0][0]);
  expect(await fsp.readFile(path.join(portalDir, '.env'), 'utf-8')).toBe(
    'CUSTOM_VALUE=1\nNOCOBASE_API_URL=/console/api/__app/crm\nNOCOBASE_PORTAL_BASE=/console/x/apps/crm/customer/\n',
  );
  expect(await fsp.readFile(path.join(portalDir, '.env.local'), 'utf-8')).toBe(
    'NOCOBASE_PORTAL_BASE=/console/x/apps/crm/customer/\n' +
      'LOCAL_ONLY=true\n' +
      'NOCOBASE_API_URL=http://localhost:13000/console/api/__app/crm\n',
  );
  expect((await fsp.stat(path.join(storagePath, 'portals'))).mode & 0o777).toBe(0o755);
  expect((await fsp.stat(path.join(storagePath, 'portals', 'crm'))).mode & 0o777).toBe(0o755);
  expect((await fsp.stat(portalDir)).mode & 0o777).toBe(0o755);
  expect((await fsp.stat(path.join(portalDir, 'dist'))).mode & 0o777).toBe(0o755);
  expect((await fsp.stat(path.join(portalDir, 'dist', 'index.html'))).mode & 0o777).toBe(0o644);
});

test('docker deploy builds and syncs the portal record without uploading dist', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({ storagePath });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'index.html'), '<div id="root"></div>');
  });
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: { uid: 'customer' } } }));

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ kind: 'docker', storagePath }),
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    portalDir,
    mode: 'docker',
    uploaded: false,
    recordSynced: true,
  });
  expect(apiRequest).toHaveBeenCalledTimes(1);
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[0][0]);
});

test('http deploy builds, packs dist, and uploads it', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'crm',
  });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'assets'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'index.html'), '<div id="root"></div>');
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'assets', 'index.js'), 'console.log("ok");\n');
    await fsp.chmod(path.join(String(options?.cwd), 'dist'), 0o700);
    await fsp.chmod(path.join(String(options?.cwd), 'dist', 'assets'), 0o700);
    await fsp.chmod(path.join(String(options?.cwd), 'dist', 'index.html'), 0o600);
    await fsp.chmod(path.join(String(options?.cwd), 'dist', 'assets', 'index.js'), 0o600);
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:firstOrCreate') {
      return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
    }

    const filePath = String(options.flags.file);
    const entries: string[] = [];
    await tar.list({
      file: filePath,
      onentry: (entry) => {
        entries.push(entry.path);
        if (entry.path === 'index.html') {
          expect(entry.mode).toBe(0o644);
        }
        if (entry.path === 'assets') {
          expect(entry.mode).toBe(0o755);
        }
        if (entry.path === 'assets/index.js') {
          expect(entry.mode).toBe(0o644);
        }
      },
    });
    expect(entries).toEqual(expect.arrayContaining(['index.html', 'assets/index.js']));
    return { ok: true, status: 200, data: { data: { status: 'ok', distPath: 'portals/crm/customer/dist' } } };
  });

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      envName: 'prod',
      cliVersion: '1.2.3',
      env: createEnv({
        kind: 'http',
        storagePath,
        configuredStoragePath: storagePath,
        apiBaseUrl: 'https://example.com/console/api/__app/crm',
      }),
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'crm',
    portalDir,
    mode: 'http',
    uploaded: true,
    recordSynced: true,
    serverDistPath: 'portals/crm/customer/dist',
  });

  expect(apiRequest).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      cliVersion: '1.2.3',
      envName: 'prod',
      flags: expect.objectContaining({
        app: 'crm',
        portal: 'customer',
        basePath: '/console/x/apps/crm/customer/',
      }),
      operation: expect.objectContaining({
        method: 'POST',
        pathTemplate: '/multiPortals:deploy',
        requestContentType: 'multipart/form-data',
      }),
    }),
  );
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[1][0]);
  expect(runCommand).toHaveBeenCalledWith('pnpm', ['build'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_API_URL: 'https://example.com/console/api/__app/crm',
      NOCOBASE_PORTAL_BASE: '/console/x/apps/crm/customer/',
    }),
    envMode: 'replace',
    errorName: 'pnpm build',
  });
});

test('http deploy uses env source storage when no local storagePath is configured', async () => {
  const cliRoot = await makeTempDir('nocobase-cli-portal-deploy-root-');
  const originalCliRoot = process.env[NB_CLI_ROOT_ENV];
  process.env[NB_CLI_ROOT_ENV] = cliRoot;
  try {
    const storagePath = path.join(cliRoot, 'remote1', 'source', 'storage');
    const portalDir = await preparePortalWorkspace({ storagePath });
    const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
      await fsp.mkdir(path.join(String(options?.cwd), 'dist'), { recursive: true });
      await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'index.html'), '<div id="root"></div>');
    });
    const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { status: 'ok' } }));

    await expect(
      deployPortalWorkspace({
        portal: 'customer',
        envName: 'remote1',
        env: createEnv({
          kind: 'http',
          name: 'remote1',
          storagePath: '/tmp/fallback',
          configuredStoragePath: '',
          apiBaseUrl: 'https://example.com/api',
        }),
        runCommand,
        apiRequest,
      }),
    ).resolves.toMatchObject({
      app: 'main',
      portalDir,
      mode: 'http',
      uploaded: true,
      recordSynced: true,
    });
    expect(apiRequest).toHaveBeenCalledTimes(2);
    expectPortalRecordFirstOrCreate(apiRequest.mock.calls[1][0]);
  } finally {
    if (originalCliRoot === undefined) {
      delete process.env[NB_CLI_ROOT_ENV];
    } else {
      process.env[NB_CLI_ROOT_ENV] = originalCliRoot;
    }
  }
});

test('fails when portal record sync fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  await preparePortalWorkspace({ storagePath });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'index.html'), '<div id="root"></div>');
  });
  const apiRequest = vi.fn(async () => ({ ok: false, status: 500, data: { errors: [{ message: 'boom' }] } }));

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      runCommand,
      apiRequest,
    }),
  ).rejects.toThrow(/Portal record sync failed with status 500/);

  expect(apiRequest).toHaveBeenCalledTimes(1);
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[0][0]);
});

test('fails when workspace is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      runCommand: vi.fn(),
    }),
  ).rejects.toThrow(/Portal workspace does not exist/);
});

test('fails when build does not produce dist index', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  await preparePortalWorkspace({ storagePath });

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      runCommand: vi.fn().mockResolvedValue(undefined),
    }),
  ).rejects.toThrow(/Portal build did not produce/);
});

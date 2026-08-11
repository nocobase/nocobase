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
      portals: params.portals ?? {
        customer: {
          path: path.join(params.storagePath, 'customer'),
        },
      },
    },
  };
}

function expectPosixMode(actual: number | undefined, expected: number): void {
  if (process.platform === 'win32') {
    return;
  }
  expect(actual === undefined ? actual : actual & 0o777).toBe(expected);
}

async function preparePortalWorkspace(params: {
  storagePath: string;
  app?: string;
  portal?: string;
  serverDevEnvContent?: string;
  serverProdEnvContent?: string;
}): Promise<string> {
  const portal = params.portal ?? 'customer';
  const portalDir = path.join(params.storagePath, portal);
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.writeFile(
    path.join(portalDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'portal',
        scripts: {
          'build:client': 'build client',
          'build:html': 'build html',
          'build:server':
            'tsc -p tsconfig.server.json && npm install --omit=dev --package-lock=false --prefix ./dist',
          'build:server:deps': 'npm install --omit=dev --package-lock=false --prefix ./dist',
          'clean:dist': 'clean dist',
        },
      },
      null,
      2,
    )}\n`,
  );
  await fsp.mkdir(path.join(portalDir, 'scripts'), { recursive: true });
  await fsp.writeFile(
    path.join(portalDir, 'scripts', 'build-html.mjs'),
    [
      'const getEnvFilesForMode = (mode) => {',
      '  return [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`].map(',
      '    (file) => path.join(rootDir, file)',
      '  );',
      '};',
      '',
    ].join('\n'),
  );
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

function expectPortalRecordFirstOrCreate(options: RequestOptions, portal = 'customer') {
  const body = JSON.parse(String(options.flags.body));

  expect(options).toEqual(
    expect.objectContaining({
      flags: expect.objectContaining({
        filterKeys: ['portalName'],
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
      portalType: 'ai',
      portalName: portal,
      routePath: `/${portal}`,
      authCheck: true,
      enabled: true,
      uiLayoutUid: 'admin-layout-model',
      skipCreatePortalDirectory: true,
    }),
  );
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('updates env files, builds, uploads dist, and syncs the portal record locally', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'crm',
    serverDevEnvContent: 'CUSTOM_VALUE=1\nNOCOBASE_API_PROXY_TARGET=http://old.example.com/api\n',
    serverProdEnvContent: 'NOCOBASE_PORTAL_NAME=old\nLOCAL_ONLY=true\n',
  });
  const runCommand = vi.fn(async (_name: string, args: string[], options?: PortalDeployRunOptions) => {
    const distDir = path.join(String(options?.cwd), 'dist');
    if (args[0] === 'clean:dist') {
      await fsp.rm(distDir, { recursive: true, force: true });
      return;
    }
    await fsp.mkdir(path.join(distDir, 'client'), { recursive: true });
    await fsp.writeFile(path.join(distDir, 'client', 'index.html'), '<div id="root"></div>');
    if (args[0] === 'build:server') {
      await fsp.mkdir(path.join(distDir, 'node_modules', 'pino'), { recursive: true });
      await fsp.writeFile(path.join(distDir, 'node_modules', 'pino', 'bin.js'), 'console.log("pino");\n');
    }
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:firstOrCreate') {
      return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
    }

    const extractDir = await makeTempDir('nocobase-cli-portal-deploy-dist-');
    await tar.extract({
      cwd: extractDir,
      file: String(options.flags.file),
    });
    await expect(fsp.readFile(path.join(extractDir, 'client', 'index.html'), 'utf-8')).resolves.toBe(
      '<div id="root"></div>',
    );
    await expect(fsp.access(path.join(extractDir, 'node_modules', '.bin'))).rejects.toThrow();
    return { ok: true, status: 200, data: { data: { status: 'ok', distPath: 'portals/crm/customer/dist' } } };
  });

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
    uploaded: true,
    recordSynced: true,
  });

  expect(runCommand).toHaveBeenNthCalledWith(1, 'pnpm', ['install'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm install',
  });
  expect(runCommand).toHaveBeenNthCalledWith(2, 'pnpm', ['clean:dist'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm clean:dist',
  });
  expect(runCommand).toHaveBeenNthCalledWith(3, 'pnpm', ['build:client'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm build:client',
  });
  expect(runCommand).toHaveBeenNthCalledWith(4, 'pnpm', ['build:html'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_PORTAL_NAME: 'customer',
      NOCOBASE_API_PROXY_TARGET: 'http://localhost:13000/console/api/__app/crm',
      NOCOBASE_PORTAL_BASE: '/console/x/apps/crm/customer/',
      NOCOBASE_API_URL: '/console/api/__app/crm',
    }),
    envMode: 'replace',
    errorName: 'pnpm build:html',
  });
  expect(runCommand).toHaveBeenNthCalledWith(5, 'pnpm', ['build:server'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm build:server',
  });
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect(apiRequest.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      flags: expect.objectContaining({
        app: 'crm',
        portal: 'customer',
        basePath: '/console/x/apps/crm/customer/',
      }),
      operation: expect.objectContaining({
        pathTemplate: '/multiPortals:deploy',
      }),
    }),
  );
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[1][0]);
  expect(await fsp.readFile(path.join(portalDir, '.env.server.dev'), 'utf-8')).toBe(
    'CUSTOM_VALUE=1\n' +
      'NOCOBASE_API_PROXY_TARGET=http://localhost:13000/console/api/__app/crm\n' +
      'NOCOBASE_PORTAL_NAME=customer\n',
  );
  expect(await fsp.readFile(path.join(portalDir, '.env.server.prod'), 'utf-8')).toBe(
    'NOCOBASE_PORTAL_NAME=customer\n' +
      'LOCAL_ONLY=true\n' +
      'NOCOBASE_API_PROXY_TARGET=http://localhost:13000/console/api/__app/crm\n',
  );
  const buildHtmlScript = await fsp.readFile(path.join(portalDir, 'scripts', 'build-html.mjs'), 'utf-8');
  expect(buildHtmlScript).toContain('return [".env.server.prod"].map((file) => path.join(rootDir, file));');
  expect(buildHtmlScript).not.toContain('.env.local');
  await expect(fsp.readFile(path.join(portalDir, 'scripts', 'clean-dist-bin.mjs'), 'utf-8')).resolves.toContain(
    'distBinDir',
  );
  const portalPackageJson = JSON.parse(await fsp.readFile(path.join(portalDir, 'package.json'), 'utf-8')) as {
    scripts: Record<string, string>;
  };
  expect(portalPackageJson.scripts['build:server']).toContain('node ./scripts/clean-dist-bin.mjs');
  expect(portalPackageJson.scripts['build:server:deps']).toContain('node ./scripts/clean-dist-bin.mjs');
  expectPosixMode((await fsp.stat(portalDir)).mode, 0o755);
  expectPosixMode((await fsp.stat(path.join(portalDir, 'dist', 'client'))).mode, 0o755);
  expectPosixMode((await fsp.stat(path.join(portalDir, 'dist', 'client', 'index.html'))).mode, 0o644);
});

test('local deploy builds from the saved source path and uploads dist', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const sourceRoot = await makeTempDir('nocobase-cli-portal-deploy-source-');
  const portalDir = await preparePortalWorkspace({
    storagePath: sourceRoot,
    app: 'crm',
  });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'client'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), '<div id="root"></div>');
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:deploy') {
      return { ok: true, status: 200, data: { data: { status: 'ok', distPath: 'portals/crm/customer/dist' } } };
    }
    return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
  });

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({
        kind: 'local',
        storagePath,
        apiBaseUrl: 'http://localhost:13000/console/api/__app/crm',
        portals: {
          customer: { path: portalDir },
        },
      }),
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'crm',
    portal: 'customer',
    portalDir,
    portalBase: '/console/x/apps/crm/customer/',
    distDir: path.join(portalDir, 'dist'),
    mode: 'local',
    uploaded: true,
    recordSynced: true,
  });

  expect(runCommand).toHaveBeenNthCalledWith(
    1,
    'pnpm',
    ['install'],
    expect.objectContaining({
      cwd: portalDir,
    }),
  );
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect(apiRequest).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      flags: expect.objectContaining({
        app: 'crm',
        portal: 'customer',
        basePath: '/console/x/apps/crm/customer/',
      }),
      operation: expect.objectContaining({
        pathTemplate: '/multiPortals:deploy',
      }),
    }),
  );
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[1][0]);
});

test('deploy can skip dependency installation', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({ storagePath });
  const runCommand = vi.fn(async (_name: string, args: string[], options?: PortalDeployRunOptions) => {
    if (args[0] !== 'install') {
      await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'client'), { recursive: true });
      await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), '<div id="root"></div>');
    }
  });
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: { uid: 'customer' } } }));

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ kind: 'local', storagePath }),
      installDependencies: false,
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'main',
    portal: 'customer',
    portalDir,
    uploaded: true,
    recordSynced: true,
  });

  expect(runCommand).toHaveBeenCalledTimes(4);
  expect(runCommand).toHaveBeenNthCalledWith(1, 'pnpm', ['clean:dist'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm clean:dist',
  });
  expect(runCommand).toHaveBeenNthCalledWith(2, 'pnpm', ['build:client'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm build:client',
  });
  expect(runCommand).toHaveBeenNthCalledWith(3, 'pnpm', ['build:html'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_PORTAL_NAME: 'customer',
      NOCOBASE_API_PROXY_TARGET: 'http://localhost:13000/api',
      NOCOBASE_PORTAL_BASE: '/x/customer/',
      NOCOBASE_API_URL: '/api',
    }),
    envMode: 'replace',
    errorName: 'pnpm build:html',
  });
  expect(runCommand).toHaveBeenNthCalledWith(4, 'pnpm', ['build:server'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm build:server',
  });
});

test('deploy normalizes legacy dist/index.html into dist/client before upload', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({ storagePath });
  await fsp.writeFile(
    path.join(portalDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'legacy-portal',
        scripts: {
          build: 'build legacy client',
          'build:html': 'build html',
        },
      },
      null,
      2,
    )}\n`,
  );
  const runCommand = vi.fn(async (_name: string, args: string[], options?: PortalDeployRunOptions) => {
    if (args[0] === 'build') {
      await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'assets'), { recursive: true });
      await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'index.html'), '<div id="legacy"></div>');
      await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'assets', 'index.js'), 'console.log("legacy");\n');
    }
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:firstOrCreate') {
      return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
    }

    const extractDir = await makeTempDir('nocobase-cli-portal-deploy-legacy-dist-');
    await tar.extract({
      cwd: extractDir,
      file: String(options.flags.file),
    });
    await expect(fsp.readFile(path.join(extractDir, 'client', 'index.html'), 'utf-8')).resolves.toBe(
      '<div id="legacy"></div>',
    );
    await expect(fsp.readFile(path.join(extractDir, 'client', 'assets', 'index.js'), 'utf-8')).resolves.toBe(
      'console.log("legacy");\n',
    );
    await expect(fsp.access(path.join(extractDir, 'index.html'))).rejects.toThrow();
    return { ok: true, status: 200, data: { data: { status: 'ok', distPath: 'portals/main/customer/dist' } } };
  });

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ kind: 'local', storagePath }),
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'main',
    portal: 'customer',
    uploaded: true,
    recordSynced: true,
  });

  await expect(fsp.readFile(path.join(portalDir, 'dist', 'client', 'index.html'), 'utf-8')).resolves.toBe(
    '<div id="legacy"></div>',
  );
  await expect(fsp.access(path.join(portalDir, 'dist', 'index.html'))).rejects.toThrow();
  expect(runCommand).toHaveBeenNthCalledWith(3, 'pnpm', ['build:html'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_PORTAL_NAME: 'customer',
      NOCOBASE_API_PROXY_TARGET: 'http://localhost:13000/api',
      NOCOBASE_PORTAL_BASE: '/x/customer/',
      NOCOBASE_API_URL: '/api',
    }),
    envMode: 'replace',
    errorName: 'pnpm build:html',
  });
});

test('docker deploy builds, uploads dist, and syncs the portal record', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({ storagePath });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'client'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), '<div id="root"></div>');
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
    uploaded: true,
    recordSynced: true,
  });
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect(apiRequest.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      operation: expect.objectContaining({
        pathTemplate: '/multiPortals:deploy',
      }),
    }),
  );
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[1][0]);
});

test('deploy reports a clear error when pnpm is not installed', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  await preparePortalWorkspace({ storagePath });
  const runCommand = vi.fn(async () => {
    throw Object.assign(new Error('spawn pnpm ENOENT'), { code: 'ENOENT' });
  });
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: { uid: 'customer' } } }));

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ kind: 'local', storagePath }),
      runCommand,
      apiRequest,
    }),
  ).rejects.toThrow(
    "Couldn't run `pnpm install` because the pnpm executable could not be found. Install pnpm or update `nb config set bin.pnpm <path>` and try again.",
  );

  expect(runCommand).toHaveBeenCalledTimes(1);
  expect(runCommand).toHaveBeenCalledWith(
    'pnpm',
    ['install'],
    expect.objectContaining({
      errorName: 'pnpm install',
    }),
  );
  expect(apiRequest).not.toHaveBeenCalled();
});

test('http deploy builds, packs dist, and uploads it', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'crm',
  });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'client', 'assets'), { recursive: true });
    await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'server'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), '<div id="root"></div>');
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'assets', 'index.js'), 'console.log("ok");\n');
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'server', 'embedded.js'), 'console.log("server");\n');
    await fsp.chmod(path.join(String(options?.cwd), 'dist'), 0o700);
    await fsp.chmod(path.join(String(options?.cwd), 'dist', 'client', 'assets'), 0o700);
    await fsp.chmod(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), 0o600);
    await fsp.chmod(path.join(String(options?.cwd), 'dist', 'client', 'assets', 'index.js'), 0o600);
    await fsp.chmod(path.join(String(options?.cwd), 'dist', 'server', 'embedded.js'), 0o600);
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData('crm') };
    }
    if (options.operation.pathTemplate === '/multiPortals:firstOrCreate') {
      return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
    }

    const extractDir = await makeTempDir('nocobase-cli-portal-deploy-dist-');
    await tar.extract({
      cwd: extractDir,
      file: String(options.flags.file),
    });
    await expect(fsp.access(path.join(extractDir, 'client', 'index.html'))).resolves.toBeUndefined();
    await expect(fsp.access(path.join(extractDir, 'client', 'assets', 'index.js'))).resolves.toBeUndefined();
    await expect(fsp.access(path.join(extractDir, 'server', 'embedded.js'))).resolves.toBeUndefined();
    expectPosixMode((await fsp.stat(path.join(extractDir, 'client', 'index.html'))).mode, 0o644);
    expectPosixMode((await fsp.stat(path.join(extractDir, 'client', 'assets'))).mode, 0o755);
    expectPosixMode((await fsp.stat(path.join(extractDir, 'client', 'assets', 'index.js'))).mode, 0o644);
    expectPosixMode((await fsp.stat(path.join(extractDir, 'server', 'embedded.js'))).mode, 0o644);
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
    2,
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
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[2][0]);
  expect(runCommand).toHaveBeenNthCalledWith(1, 'pnpm', ['install'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm install',
  });
  expect(runCommand).toHaveBeenNthCalledWith(2, 'pnpm', ['clean:dist'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm clean:dist',
  });
  expect(runCommand).toHaveBeenNthCalledWith(3, 'pnpm', ['build:client'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm build:client',
  });
  expect(runCommand).toHaveBeenNthCalledWith(4, 'pnpm', ['build:html'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_PORTAL_NAME: 'customer',
      NOCOBASE_API_PROXY_TARGET: 'https://example.com/console/api/__app/crm',
      NOCOBASE_PORTAL_BASE: '/console/x/apps/crm/customer/',
      NOCOBASE_API_URL: '/console/api/__app/crm',
    }),
    envMode: 'replace',
    errorName: 'pnpm build:html',
  });
  expect(runCommand).toHaveBeenNthCalledWith(5, 'pnpm', ['build:server'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm build:server',
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
      await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'client'), { recursive: true });
      await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), '<div id="root"></div>');
    });
    const apiRequest = vi.fn(async (options: RequestOptions) => {
      if (options.operation.pathTemplate === '/app:getInfo') {
        return { ok: true, status: 200, data: appInfoData() };
      }
      return { ok: true, status: 200, data: { status: 'ok' } };
    });

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
          portals: {
            customer: { path: portalDir },
          },
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
    expect(apiRequest).toHaveBeenCalledTimes(3);
    expectPortalRecordFirstOrCreate(apiRequest.mock.calls[2][0]);
  } finally {
    if (originalCliRoot === undefined) {
      delete process.env[NB_CLI_ROOT_ENV];
    } else {
      process.env[NB_CLI_ROOT_ENV] = originalCliRoot;
    }
  }
});

test('http deploy uses root portal base for custom-domain sub-apps', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  const portalDir = await preparePortalWorkspace({
    storagePath,
    app: 'demo6',
    portal: 'crm',
  });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'client'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), '<div id="root"></div>');
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData('demo6') };
    }
    return { ok: true, status: 200, data: { data: { uid: 'crm', distPath: 'portals/demo6/crm/dist' } } };
  });

  await expect(
    deployPortalWorkspace({
      portal: 'crm',
      envName: 'prod',
      env: createEnv({
        kind: 'http',
        storagePath,
        apiBaseUrl: 'https://demo6.v11.demo.nocobase.com/api',
        portals: {
          crm: { path: portalDir },
        },
      }),
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'demo6',
    portal: 'crm',
    portalDir,
    portalBase: '/x/crm/',
    uploaded: true,
    serverDistPath: 'portals/demo6/crm/dist',
  });

  expect(apiRequest).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      flags: expect.objectContaining({
        app: 'demo6',
        portal: 'crm',
        basePath: '/x/apps/demo6/crm/',
      }),
    }),
  );
  expect(runCommand).toHaveBeenNthCalledWith(4, 'pnpm', ['build:html'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_PORTAL_NAME: 'crm',
      NOCOBASE_API_PROXY_TARGET: 'https://demo6.v11.demo.nocobase.com/api',
      NOCOBASE_PORTAL_BASE: '/x/crm/',
      NOCOBASE_API_URL: '/api',
    }),
    envMode: 'replace',
    errorName: 'pnpm build:html',
  });
  const expectedServerEnv =
    'NOCOBASE_PORTAL_NAME=crm\n' + 'NOCOBASE_API_PROXY_TARGET=https://demo6.v11.demo.nocobase.com/api\n';
  expect(await fsp.readFile(path.join(portalDir, '.env.server.dev'), 'utf-8')).toBe(expectedServerEnv);
  expect(await fsp.readFile(path.join(portalDir, '.env.server.prod'), 'utf-8')).toBe(expectedServerEnv);
});

test('fails after local dist upload when portal record sync fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');
  await preparePortalWorkspace({ storagePath });
  const runCommand = vi.fn(async (_name: string, _args: string[], options?: PortalDeployRunOptions) => {
    await fsp.mkdir(path.join(String(options?.cwd), 'dist', 'client'), { recursive: true });
    await fsp.writeFile(path.join(String(options?.cwd), 'dist', 'client', 'index.html'), '<div id="root"></div>');
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:deploy') {
      return { ok: true, status: 200, data: { data: { status: 'ok', distPath: 'portals/main/customer/dist' } } };
    }
    return { ok: false, status: 500, data: { errors: [{ message: 'boom' }] } };
  });

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      runCommand,
      apiRequest,
    }),
  ).rejects.toThrow(/Portal record sync failed with status 500/);

  expect(apiRequest).toHaveBeenCalledTimes(2);
  expectPortalRecordFirstOrCreate(apiRequest.mock.calls[1][0]);
});

test('fails when workspace is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-deploy-storage-');

  await expect(
    deployPortalWorkspace({
      portal: 'customer',
      env: createEnv({ storagePath }),
      runCommand: vi.fn(),
    }),
  ).rejects.toThrow(/Portal does not exist/);
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

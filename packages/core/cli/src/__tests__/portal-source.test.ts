/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import * as tar from 'tar';
import { afterEach, expect, test, vi } from 'vitest';
import type { RequestOptions } from '../lib/api-client.js';
import type { PortalCreateEnvLike } from '../lib/portal-create.js';
import { pullPortalSource, pushPortalSource } from '../lib/portal-source.js';

const tempDirs: string[] = [];
const execFileAsync = promisify(execFile);

function toFileUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

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
    kind: params.kind ?? 'http',
    apiBaseUrl: params.apiBaseUrl ?? 'https://example.com/api',
    storagePath: params.storagePath,
    config: {
      apiBaseUrl: params.apiBaseUrl ?? 'https://example.com/api',
      appPublicPath: params.appPublicPath,
      storagePath: params.configuredStoragePath ?? params.storagePath,
      portals: params.portals,
    },
  };
}

function portalListData(sourceStorage = 'nocobase') {
  return {
    data: [
      {
        uid: 'customer',
        title: 'Customer',
        portalName: 'customer',
        routePath: '/customer',
        portalType: 'ai',
        enabled: true,
        sourceStorage,
        gitRepo: '',
        gitBranch: '',
        gitPath: '',
      },
    ],
  };
}

function appInfoData(name = 'main') {
  return {
    data: {
      name,
    },
  };
}

async function runGit(args: string[], cwd?: string) {
  return await execFileAsync('git', args, { cwd });
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, '\n');
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('pull downloads NocoBase-managed source for http envs', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'customer');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-archive-');
  await fsp.mkdir(path.join(sourceDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default null;\n');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await fsp.mkdir(path.join(sourceDir, 'scripts'), { recursive: true });
  await fsp.writeFile(
    path.join(sourceDir, 'scripts', 'build-html.mjs'),
    [
      'const getEnvFilesForMode = (mode) => {',
      '  return [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`].map(',
      '    (file) => path.join(rootDir, file)',
      '  );',
      '};',
      '',
    ].join('\n'),
  );
  const runCommand = vi.fn().mockResolvedValue(undefined);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    expect(options.operation).toEqual(
      expect.objectContaining({
        method: 'POST',
        pathTemplate: '/multiPortals:pullSource',
        responseType: 'binary',
      }),
    );
    await tar.create({ cwd: sourceDir, file: String(options.flags.output), gzip: true }, await fsp.readdir(sourceDir));
    return { ok: true, status: 200, data: { output: options.flags.output } };
  });

  await expect(
    pullPortalSource({
      portal: 'customer',
      envName: 'prod',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      apiRequest,
      runCommand,
    }),
  ).resolves.toMatchObject({
    portal: 'customer',
    mode: 'http',
    sourceStorage: 'nocobase',
    changed: true,
    dependenciesInstalled: true,
  });

  await expect(fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe('export default null;\n');
  await expect(fsp.readFile(path.join(portalDir, '.env'), 'utf-8')).resolves.toBe(
    'NOCOBASE_API_URL=/api\nNOCOBASE_PORTAL_BASE=/x/customer/\n',
  );
  await expect(fsp.readFile(path.join(portalDir, '.env.local'), 'utf-8')).resolves.toBe(
    'NOCOBASE_API_URL=https://example.com/api\nNOCOBASE_PORTAL_BASE=/x/customer/\n',
  );
  const buildHtmlScript = await fsp.readFile(path.join(portalDir, 'scripts', 'build-html.mjs'), 'utf-8');
  expect(buildHtmlScript).toContain('return [".env"].map((file) => path.join(rootDir, file));');
  expect(buildHtmlScript).not.toContain('.env.local');
  await expect(fsp.access(path.join(portalDir, 'portal.config.json'))).rejects.toThrow();
  expect(runCommand).toHaveBeenCalledWith('pnpm', ['install'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm install',
  });

  await runGit(['init'], portalDir);
  await fsp.writeFile(path.join(portalDir, '.git', 'nocobase-preserve-test'), 'keep');
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default "remote again";\n');
  await expect(
    pullPortalSource({
      portal: 'customer',
      envName: 'prod',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      force: true,
      installDependencies: false,
      apiRequest,
      runCommand,
    }),
  ).resolves.toMatchObject({
    changed: true,
    installSkipped: true,
  });
  await expect(fsp.readFile(path.join(portalDir, '.git', 'nocobase-preserve-test'), 'utf-8')).resolves.toBe('keep');
  await expect(fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe(
    'export default "remote again";\n',
  );
});

test('pull with force refuses to replace a non-portal directory', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'customer');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-archive-');
  await fsp.mkdir(path.join(sourceDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default null;\n');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await fsp.mkdir(portalDir, { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'notes.txt'), 'not a portal');
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    expect(options.operation.pathTemplate).toBe('/multiPortals:pullSource');
    await tar.create({ cwd: sourceDir, file: String(options.flags.output), gzip: true }, await fsp.readdir(sourceDir));
    return { ok: true, status: 200, data: { output: options.flags.output } };
  });

  await expect(
    pullPortalSource({
      portal: 'customer',
      envName: 'prod',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      force: true,
      apiRequest,
    }),
  ).rejects.toThrow(`Refusing to replace a non-portal directory: ${portalDir}`);
  await expect(fsp.readFile(path.join(portalDir, 'notes.txt'), 'utf-8')).resolves.toBe('not a portal');
});

test('pull uses app:getInfo app name for custom-domain http envs', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'crm');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-custom-domain-');
  await fsp.mkdir(path.join(sourceDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default "demo6";\n');
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData('demo6') };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
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
              sourceStorage: 'nocobase',
              gitRepo: '',
              gitBranch: '',
              gitPath: '',
            },
          ],
        },
      };
    }

    expect(options.operation.pathTemplate).toBe('/multiPortals:pullSource');
    expect(options.flags.app).toBe('demo6');
    expect(options.flags.portal).toBe('crm');
    await tar.create({ cwd: sourceDir, file: String(options.flags.output), gzip: true }, await fsp.readdir(sourceDir));
    return { ok: true, status: 200, data: { output: options.flags.output } };
  });

  await expect(
    pullPortalSource({
      portal: 'crm',
      envName: 'prod',
      env: createEnv({
        storagePath,
        kind: 'http',
        apiBaseUrl: 'https://demo6.v11.demo.nocobase.com/api',
      }),
      sourcePath: portalDir,
      installDependencies: false,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'demo6',
    portal: 'crm',
    portalDir,
    portalBase: '/x/crm/',
    changed: true,
  });

  await expect(fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe('export default "demo6";\n');
  await expect(fsp.readFile(path.join(portalDir, '.env'), 'utf-8')).resolves.toBe(
    'NOCOBASE_API_URL=/api\nNOCOBASE_PORTAL_BASE=/x/crm/\n',
  );
  await expect(fsp.readFile(path.join(portalDir, '.env.local'), 'utf-8')).resolves.toBe(
    'NOCOBASE_API_URL=https://demo6.v11.demo.nocobase.com/api\nNOCOBASE_PORTAL_BASE=/x/crm/\n',
  );
  await expect(fsp.access(path.join(storagePath, 'portals', 'main', 'crm'))).rejects.toThrow();
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toEqual([
    '/app:getInfo',
    '/multiPortals:list',
    '/multiPortals:pullSource',
  ]);
});

test('pull completes when dependency installation fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'customer');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-install-failure-');
  await fsp.mkdir(path.join(sourceDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default "install failed";\n');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  const runCommand = vi.fn(async () => {
    throw new Error('pnpm install exited with code 1');
  });
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    expect(options.operation.pathTemplate).toBe('/multiPortals:pullSource');
    await tar.create({ cwd: sourceDir, file: String(options.flags.output), gzip: true }, await fsp.readdir(sourceDir));
    return { ok: true, status: 200, data: { output: options.flags.output } };
  });

  await expect(
    pullPortalSource({
      portal: 'customer',
      envName: 'prod',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      apiRequest,
      runCommand,
    }),
  ).resolves.toMatchObject({
    portal: 'customer',
    changed: true,
    dependenciesInstalled: false,
    installSkipped: false,
    installFailed: true,
  });

  await expect(fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe(
    'export default "install failed";\n',
  );
  await expect(fsp.access(path.join(portalDir, '.env'))).resolves.toBeUndefined();
  await expect(fsp.access(path.join(portalDir, '.env.local'))).resolves.toBeUndefined();
});

test('push uploads NocoBase-managed source for http envs and excludes dist', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.mkdir(path.join(portalDir, 'dist'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default null;\n');
  await fsp.writeFile(path.join(portalDir, 'dist', 'index.html'), '<div></div>');
  await fsp.writeFile(path.join(portalDir, '._package.json'), 'appledouble');
  await fsp.writeFile(path.join(portalDir, 'src', '._index.tsx'), 'appledouble');
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    expect(options.operation).toEqual(
      expect.objectContaining({
        method: 'POST',
        pathTemplate: '/multiPortals:pushSource',
        requestContentType: 'multipart/form-data',
      }),
    );
    const entries: string[] = [];
    await tar.list({
      file: String(options.flags.file),
      onentry: (entry) => entries.push(entry.path),
    });
    expect(entries).toEqual(expect.arrayContaining(['src/index.tsx']));
    expect(entries).not.toContain('dist/index.html');
    expect(entries).not.toContain('._package.json');
    expect(entries).not.toContain('src/._index.tsx');
    return { ok: true, status: 200, data: { data: { sourceRevision: 'src_rev1' } } };
  });

  await expect(
    pushPortalSource({
      portal: 'customer',
      envName: 'prod',
      env: createEnv({
        storagePath,
        kind: 'http',
        portals: {
          customer: { path: portalDir },
        },
      }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    portal: 'customer',
    mode: 'http',
    sourceStorage: 'nocobase',
    changed: true,
    sourceRevision: 'src_rev1',
  });
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toEqual([
    '/app:getInfo',
    '/multiPortals:list',
    '/multiPortals:pushSource',
  ]);
});

test('local NocoBase-managed source pull downloads into the workspace path', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const workspaceRoot = await makeTempDir('nocobase-cli-portal-source-workspace-');
  const portalDir = path.join(workspaceRoot, 'customer');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-archive-');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    await tar.create({ cwd: sourceDir, file: String(options.flags.output), gzip: true }, await fsp.readdir(sourceDir));
    return { ok: true, status: 200, data: { output: options.flags.output } };
  });

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'local', apiBaseUrl: 'http://localhost:13000/api' }),
      sourcePath: portalDir,
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    mode: 'local',
    changed: true,
    portalDir,
  });
  await expect(fsp.access(path.join(portalDir, 'package.json'))).resolves.toBeUndefined();
  expect(runCommand).toHaveBeenCalledWith('pnpm', ['install'], expect.objectContaining({ cwd: portalDir }));
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toEqual([
    '/multiPortals:list',
    '/multiPortals:pullSource',
  ]);
});

test('pull can temporarily use Git source options without updating portal configuration', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const workspaceRoot = await makeTempDir('nocobase-cli-portal-source-workspace-');
  const portalDir = path.join(workspaceRoot, 'customer');
  const remoteRepo = await makeTempDir('nocobase-cli-portal-temp-git-remote-');
  const remoteRepoUrl = toFileUrl(remoteRepo);
  const seedRepo = await makeTempDir('nocobase-cli-portal-temp-git-seed-');
  await runGit(['init', '--bare'], remoteRepo);
  await runGit(['init', '--initial-branch=develop'], seedRepo);
  await runGit(['config', 'user.name', 'NocoBase Test'], seedRepo);
  await runGit(['config', 'user.email', 'test@example.com'], seedRepo);
  await fsp.mkdir(path.join(seedRepo, 'portal-main', 'src'), { recursive: true });
  await fsp.writeFile(path.join(seedRepo, 'portal-main', 'src', 'index.tsx'), 'export default "temporary";\n');
  await fsp.writeFile(path.join(seedRepo, 'portal-main', 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await runGit(['add', 'portal-main'], seedRepo);
  await runGit(['commit', '-m', 'seed temporary source'], seedRepo);
  await runGit(['remote', 'add', 'origin', remoteRepo], seedRepo);
  await runGit(['push', 'origin', 'develop'], seedRepo);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    return { ok: true, status: 200, data: portalListData('nocobase') };
  });

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      gitRepo: remoteRepoUrl,
      gitBranch: 'develop',
      gitPath: 'portal-main',
      installDependencies: false,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    portalDir,
    changed: true,
    installSkipped: true,
  });

  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toEqual([
    '/app:getInfo',
    '/multiPortals:list',
  ]);
  expect(normalizeLineEndings(await fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "temporary";\n',
  );
  await expect(fsp.readFile(path.join(portalDir, '.env'), 'utf-8')).resolves.toBe(
    'NOCOBASE_API_URL=/api\nNOCOBASE_PORTAL_BASE=/x/customer/\n',
  );
});

test('temporary Git pull options require gitRepo', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      gitBranch: 'develop',
      apiRequest: vi.fn(async () => ({ ok: true, status: 200, data: portalListData('nocobase') })),
    }),
  ).rejects.toThrow(/--git-branch and --git-path require --git-repo/);
});

test('local NocoBase-managed source push uploads through the API', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = await makeTempDir('nocobase-cli-portal-source-workspace-');
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.mkdir(path.join(portalDir, 'dist'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default "workspace";\n');
  await fsp.writeFile(path.join(portalDir, 'dist', 'index.html'), '<div>dist</div>');
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    expect(options.operation).toEqual(
      expect.objectContaining({
        method: 'POST',
        pathTemplate: '/multiPortals:pushSource',
        requestContentType: 'multipart/form-data',
      }),
    );
    const entries: string[] = [];
    await tar.list({
      file: String(options.flags.file),
      onentry: (entry) => entries.push(entry.path),
    });
    expect(entries).toEqual(expect.arrayContaining(['package.json', 'src/index.tsx']));
    expect(entries).not.toContain('dist/index.html');
    return { ok: true, status: 200, data: { data: { sourceRevision: 'src_local' } } };
  });

  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({
        storagePath,
        kind: 'local',
        apiBaseUrl: 'http://localhost:13000/api',
        portals: {
          customer: { path: portalDir },
        },
      }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    mode: 'local',
    portalDir,
    changed: true,
    sourceRevision: 'src_local',
  });
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toContain('/multiPortals:pushSource');
});

test('docker NocoBase-managed source push uploads through the API', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = await makeTempDir('nocobase-cli-portal-source-workspace-');
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.mkdir(path.join(portalDir, 'dist'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default "workspace";\n');
  await fsp.writeFile(path.join(portalDir, 'dist', 'index.html'), '<div>dist</div>');
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    expect(options.operation).toEqual(
      expect.objectContaining({
        method: 'POST',
        pathTemplate: '/multiPortals:pushSource',
        requestContentType: 'multipart/form-data',
      }),
    );
    const entries: string[] = [];
    await tar.list({
      file: String(options.flags.file),
      onentry: (entry) => entries.push(entry.path),
    });
    expect(entries).toEqual(expect.arrayContaining(['package.json', 'src/index.tsx']));
    expect(entries).not.toContain('dist/index.html');
    return { ok: true, status: 200, data: { data: { sourceRevision: 'src_docker' } } };
  });

  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({
        storagePath,
        kind: 'docker',
        apiBaseUrl: 'http://localhost:13000/api',
        portals: {
          customer: { path: portalDir },
        },
      }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    mode: 'docker',
    portalDir,
    changed: true,
    sourceRevision: 'src_docker',
  });
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toContain('/multiPortals:pushSource');
});

test('docker NocoBase-managed source push uploads from the saved storage path', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default "storage";\n');
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }
    return { ok: true, status: 200, data: { data: { sourceRevision: 'src_storage' } } };
  });

  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({
        storagePath,
        kind: 'docker',
        apiBaseUrl: 'http://localhost:13000/api',
        portals: {
          customer: { path: portalDir },
        },
      }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    mode: 'docker',
    changed: true,
    sourceRevision: 'src_storage',
  });
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toContain('/multiPortals:pushSource');
});

test('push defaults to the cwd portal workspace instead of the deployment path', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const workspaceRoot = await makeTempDir('nocobase-cli-portal-source-workspace-');
  const portalDir = path.join(workspaceRoot, 'customer');
  const deploymentDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.mkdir(path.join(deploymentDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default "workspace";\n');
  await fsp.writeFile(path.join(deploymentDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await fsp.writeFile(path.join(deploymentDir, 'src', 'index.tsx'), 'export default "deployment";\n');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceRoot);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    const extractDir = await makeTempDir('nocobase-cli-portal-source-upload-');
    await tar.extract({ cwd: extractDir, file: String(options.flags.file) });
    await expect(fsp.readFile(path.join(extractDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe(
      'export default "workspace";\n',
    );
    return { ok: true, status: 200, data: { data: { sourceRevision: 'src_workspace' } } };
  });

  try {
    await expect(
      pushPortalSource({
        portal: 'customer',
        env: createEnv({ storagePath, kind: 'http' }),
        apiRequest,
      }),
    ).resolves.toMatchObject({
      portalDir,
      changed: true,
      sourceRevision: 'src_workspace',
    });
  } finally {
    cwdSpy.mockRestore();
  }
});

test('pull can skip dependency installation', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'customer');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-archive-');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }

    await tar.create({ cwd: sourceDir, file: String(options.flags.output), gzip: true }, await fsp.readdir(sourceDir));
    return { ok: true, status: 200, data: { output: options.flags.output } };
  });

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      installDependencies: false,
      runCommand,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    changed: true,
    dependenciesInstalled: false,
    installSkipped: true,
  });
  expect(runCommand).not.toHaveBeenCalled();
  await expect(fsp.access(path.join(portalDir, '.env'))).resolves.toBeUndefined();
  await expect(fsp.access(path.join(portalDir, '.env.local'))).resolves.toBeUndefined();
});

test('pull and push Git-managed source through the configured repository path', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'customer');
  const remoteRepo = await makeTempDir('nocobase-cli-portal-git-remote-');
  const remoteRepoUrl = toFileUrl(remoteRepo);
  const seedRepo = await makeTempDir('nocobase-cli-portal-git-seed-');
  await runGit(['init', '--bare'], remoteRepo);
  await runGit(['init', '--initial-branch=main'], seedRepo);
  await runGit(['config', 'user.name', 'NocoBase Test'], seedRepo);
  await runGit(['config', 'user.email', 'test@example.com'], seedRepo);
  await fsp.mkdir(path.join(seedRepo, 'customer', 'src'), { recursive: true });
  await fsp.writeFile(path.join(seedRepo, 'customer', 'src', 'index.tsx'), 'export default "remote";\n');
  await fsp.writeFile(path.join(seedRepo, 'customer', 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await runGit(['add', 'customer'], seedRepo);
  await runGit(['commit', '-m', 'seed'], seedRepo);
  await runGit(['remote', 'add', 'origin', remoteRepo], seedRepo);
  await runGit(['push', 'origin', 'main'], seedRepo);

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
          sourceStorage: 'git',
          gitRepo: remoteRepoUrl,
          gitBranch: 'main',
          gitPath: 'customer',
        },
      ],
    },
  }));

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
  });
  expect(normalizeLineEndings(await fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "remote";\n',
  );
  await expect(fsp.readFile(path.join(portalDir, '.env'), 'utf-8')).resolves.toBe(
    'NOCOBASE_API_URL=/api\nNOCOBASE_PORTAL_BASE=/x/customer/\n',
  );
  await expect(fsp.readFile(path.join(portalDir, '.env.local'), 'utf-8')).resolves.toBe(
    'NOCOBASE_API_URL=https://example.com/api\nNOCOBASE_PORTAL_BASE=/x/customer/\n',
  );
  await expect(fsp.access(path.join(portalDir, 'portal.config.json'))).rejects.toThrow();

  await runGit(['init'], portalDir);
  await runGit(['config', 'user.name', 'Local Developer'], portalDir);
  await runGit(['config', 'user.email', 'local-developer@example.com'], portalDir);
  await fsp.writeFile(path.join(portalDir, '.git', 'nocobase-preserve-test'), 'keep');
  await fsp.writeFile(path.join(seedRepo, 'customer', 'src', 'index.tsx'), 'export default "remote again";\n');
  await runGit(['add', 'customer/src/index.tsx'], seedRepo);
  await runGit(['commit', '-m', 'update remote'], seedRepo);
  await runGit(['push', 'origin', 'main'], seedRepo);

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      force: true,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
  });
  await expect(fsp.readFile(path.join(portalDir, '.git', 'nocobase-preserve-test'), 'utf-8')).resolves.toBe('keep');
  expect(normalizeLineEndings(await fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "remote again";\n',
  );

  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default "local";\n');
  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({
        storagePath,
        kind: 'http',
        portals: {
          customer: { path: portalDir },
        },
      }),
      message: 'Update portal source',
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
    sourceRevision: expect.any(String),
  });

  const verifyRepo = await makeTempDir('nocobase-cli-portal-git-verify-');
  await runGit(['clone', '--branch', 'main', remoteRepo, verifyRepo]);
  expect(normalizeLineEndings(await fsp.readFile(path.join(verifyRepo, 'customer', 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "local";\n',
  );
  const commitMetadata = await runGit(['show', '-s', '--format=%an <%ae>%n%cn <%ce>%n%B', 'HEAD'], verifyRepo);
  expect(normalizeLineEndings(commitMetadata.stdout).trim()).toBe(
    [
      'Local Developer <local-developer@example.com>',
      'Local Developer <local-developer@example.com>',
      'Update portal source',
      '',
      'Co-authored-by: NocoBase CLI <314549027+nocobase-cli@users.noreply.github.com>',
    ].join('\n'),
  );
  expect((await runGit(['config', '--get', 'user.name'], portalDir)).stdout.trim()).toBe('Local Developer');
  expect((await runGit(['config', '--get', 'user.email'], portalDir)).stdout.trim()).toBe(
    'local-developer@example.com',
  );
});

test('pull Git-managed source at the repository root as a local Git checkout', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'customer');
  const remoteRepo = await makeTempDir('nocobase-cli-portal-git-root-remote-');
  const remoteRepoUrl = toFileUrl(remoteRepo);
  const seedRepo = await makeTempDir('nocobase-cli-portal-git-root-seed-');
  await runGit(['init', '--bare'], remoteRepo);
  await runGit(['init', '--initial-branch=main'], seedRepo);
  await runGit(['config', 'user.name', 'NocoBase Test'], seedRepo);
  await runGit(['config', 'user.email', 'test@example.com'], seedRepo);
  await fsp.mkdir(path.join(seedRepo, 'src'), { recursive: true });
  await fsp.writeFile(path.join(seedRepo, 'src', 'index.tsx'), 'export default "remote root";\n');
  await fsp.writeFile(path.join(seedRepo, 'package.json'), '{"name":"customer","nocobase":{}}\n');
  await runGit(['add', 'src', 'package.json'], seedRepo);
  await runGit(['commit', '-m', 'seed root'], seedRepo);
  await runGit(['remote', 'add', 'origin', remoteRepo], seedRepo);
  await runGit(['push', 'origin', 'main'], seedRepo);

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
          sourceStorage: 'git',
          gitRepo: remoteRepoUrl,
          gitBranch: 'main',
          gitPath: '',
        },
      ],
    },
  }));

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      installDependencies: false,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
    installSkipped: true,
  });

  await expect(fsp.access(path.join(portalDir, '.git'))).resolves.toBe(undefined);
  expect((await runGit(['rev-parse', '--is-inside-work-tree'], portalDir)).stdout.trim()).toBe('true');
  expect(normalizeLineEndings(await fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "remote root";\n',
  );

  await fsp.writeFile(path.join(portalDir, '.git', 'nocobase-preserve-test'), 'keep');
  await fsp.writeFile(path.join(seedRepo, 'src', 'index.tsx'), 'export default "remote root again";\n');
  await runGit(['add', 'src/index.tsx'], seedRepo);
  await runGit(['commit', '-m', 'update root remote'], seedRepo);
  await runGit(['push', 'origin', 'main'], seedRepo);

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      sourcePath: portalDir,
      force: true,
      installDependencies: false,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
    installSkipped: true,
  });
  await expect(fsp.readFile(path.join(portalDir, '.git', 'nocobase-preserve-test'), 'utf-8')).resolves.toBe('keep');
  expect(normalizeLineEndings(await fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "remote root again";\n',
  );
});

test('push creates configured Git branch and uses repository root by default', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const remoteRepo = await makeTempDir('nocobase-cli-portal-git-empty-remote-');
  const remoteRepoUrl = toFileUrl(remoteRepo);
  await runGit(['init', '--bare'], remoteRepo);

  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(path.join(portalDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default "first push";\n');
  await runGit(['init'], portalDir);
  await runGit(['config', 'user.name', ''], portalDir);
  await runGit(['config', 'user.email', ''], portalDir);

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
          sourceStorage: 'git',
          gitRepo: remoteRepoUrl,
          gitBranch: 'main',
          gitPath: '',
        },
      ],
    },
  }));

  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({
        storagePath,
        kind: 'http',
        portals: {
          customer: { path: portalDir },
        },
      }),
      message: 'Initial portal source',
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
    sourceRevision: expect.any(String),
  });

  const heads = await runGit(['ls-remote', '--heads', remoteRepoUrl, 'main']);
  expect(heads.stdout).toContain('refs/heads/main');

  const verifyRepo = await makeTempDir('nocobase-cli-portal-git-empty-verify-');
  await runGit(['clone', '--branch', 'main', remoteRepoUrl, verifyRepo]);
  expect(normalizeLineEndings(await fsp.readFile(path.join(verifyRepo, 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "first push";\n',
  );
  const commitMetadata = await runGit(['show', '-s', '--format=%an <%ae>%n%cn <%ce>%n%B', 'HEAD'], verifyRepo);
  expect(normalizeLineEndings(commitMetadata.stdout).trim()).toBe(
    [
      'NocoBase CLI <314549027+nocobase-cli@users.noreply.github.com>',
      'NocoBase CLI <314549027+nocobase-cli@users.noreply.github.com>',
      'Initial portal source',
    ].join('\n'),
  );
});

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
import { promisify } from 'node:util';
import * as tar from 'tar';
import { afterEach, expect, test, vi } from 'vitest';
import type { RequestOptions } from '../lib/api-client.js';
import type { PortalCreateEnvLike } from '../lib/portal-create.js';
import { pullPortalSource, pushPortalSource } from '../lib/portal-source.js';

const tempDirs: string[] = [];
const execFileAsync = promisify(execFile);

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
    kind: params.kind ?? 'http',
    apiBaseUrl: params.apiBaseUrl ?? 'https://example.com/api',
    storagePath: params.storagePath,
    config: {
      apiBaseUrl: params.apiBaseUrl ?? 'https://example.com/api',
      appPublicPath: params.appPublicPath,
      storagePath: params.configuredStoragePath ?? params.storagePath,
    },
  };
}

function portalListData(sourceStorage = 'nocobase') {
  return {
    data: [
      {
        uid: 'customer',
        title: 'Customer',
        routeName: 'customer',
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

async function writePortalConfig(portalDir: string, config: Record<string, unknown> = { sourceStorage: 'nocobase' }) {
  await fsp.writeFile(path.join(portalDir, 'portal.config.json'), `${JSON.stringify(config, null, 2)}\n`);
}

async function runGit(args: string[], cwd?: string) {
  return await execFileAsync('git', args, { cwd });
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('pull downloads NocoBase-managed source for http envs', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-archive-');
  await fsp.mkdir(path.join(sourceDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default null;\n');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer"}\n');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
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

  await expect(
    fsp.readFile(path.join(storagePath, 'portals', 'main', 'customer', 'src', 'index.tsx'), 'utf-8'),
  ).resolves.toBe('export default null;\n');
  await expect(
    fsp.readFile(path.join(storagePath, 'portals', 'main', 'customer', 'portal.config.json'), 'utf-8'),
  ).resolves.toBe('{\n  "sourceStorage": "nocobase"\n}\n');
  expect(runCommand).toHaveBeenCalledWith('pnpm', ['install'], {
    cwd: path.join(storagePath, 'portals', 'main', 'customer'),
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm install',
  });
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
  await writePortalConfig(portalDir);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return { ok: true, status: 200, data: portalListData() };
    }
    if (options.operation.pathTemplate === '/multiPortals:update') {
      expect(JSON.parse(String(options.flags.body))).toEqual({
        options: {
          sourceStorage: 'nocobase',
        },
      });
      return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
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
      env: createEnv({ storagePath, kind: 'http' }),
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
    '/multiPortals:list',
    '/multiPortals:update',
    '/multiPortals:pushSource',
  ]);
});

test('local and docker NocoBase-managed source sync is a no-op', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(portalDir, { recursive: true });
  await writePortalConfig(portalDir);
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: portalListData() }));

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'local', apiBaseUrl: 'http://localhost:13000/api' }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    mode: 'local',
    changed: false,
  });

  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'docker', apiBaseUrl: 'http://localhost:13000/api' }),
      apiRequest,
    }),
  ).resolves.toMatchObject({
    mode: 'docker',
    changed: false,
  });
});

test('pull can skip dependency installation', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-archive-');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer"}\n');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
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
});

test('pull and push Git-managed source through the configured repository path', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const remoteRepo = await makeTempDir('nocobase-cli-portal-git-remote-');
  const remoteRepoUrl = `file://${remoteRepo}`;
  const seedRepo = await makeTempDir('nocobase-cli-portal-git-seed-');
  await runGit(['init', '--bare'], remoteRepo);
  await runGit(['init', '--initial-branch=main'], seedRepo);
  await runGit(['config', 'user.name', 'NocoBase Test'], seedRepo);
  await runGit(['config', 'user.email', 'test@example.com'], seedRepo);
  await fsp.mkdir(path.join(seedRepo, 'customer', 'src'), { recursive: true });
  await fsp.writeFile(path.join(seedRepo, 'customer', 'src', 'index.tsx'), 'export default "remote";\n');
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
          routeName: 'customer',
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
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
  });
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await expect(fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe(
    'export default "remote";\n',
  );
  await expect(fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8')).resolves.toBe(
    `{\n  "sourceStorage": "git",\n  "git": {\n    "repo": "${remoteRepoUrl}",\n    "branch": "main",\n    "path": "customer"\n  }\n}\n`,
  );

  await fsp.writeFile(path.join(portalDir, 'src', 'index.tsx'), 'export default "local";\n');
  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
      message: 'Update portal source',
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
    sourceRevision: expect.any(String),
  });

  const verifyRepo = await makeTempDir('nocobase-cli-portal-git-verify-');
  await runGit(['clone', remoteRepo, verifyRepo]);
  await expect(fsp.readFile(path.join(verifyRepo, 'customer', 'src', 'index.tsx'), 'utf-8')).resolves.toBe(
    'export default "local";\n',
  );
});

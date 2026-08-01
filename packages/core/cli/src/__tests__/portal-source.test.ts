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

async function writePortalConfig(portalDir: string, config: Record<string, unknown> = { sourceStorage: 'nocobase' }) {
  await fsp.writeFile(path.join(portalDir, 'portal.config.json'), `${JSON.stringify(config, null, 2)}\n`);
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
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-archive-');
  await fsp.mkdir(path.join(sourceDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default null;\n');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer"}\n');
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

  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await expect(fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe('export default null;\n');
  const buildHtmlScript = await fsp.readFile(path.join(portalDir, 'scripts', 'build-html.mjs'), 'utf-8');
  expect(buildHtmlScript).toContain('return [".env"].map((file) => path.join(rootDir, file));');
  expect(buildHtmlScript).not.toContain('.env.local');
  await expect(fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8')).resolves.toBe(
    '{\n  "sourceStorage": "nocobase"\n}\n',
  );
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

test('pull uses app:getInfo app name for custom-domain http envs', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
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
      installDependencies: false,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    app: 'demo6',
    portal: 'crm',
    portalDir: path.join(storagePath, 'portals', 'demo6', 'crm'),
    changed: true,
  });

  await expect(
    fsp.readFile(path.join(storagePath, 'portals', 'demo6', 'crm', 'src', 'index.tsx'), 'utf-8'),
  ).resolves.toBe('export default "demo6";\n');
  await expect(fsp.access(path.join(storagePath, 'portals', 'main', 'crm'))).rejects.toThrow();
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toEqual([
    '/app:getInfo',
    '/multiPortals:list',
    '/multiPortals:pullSource',
  ]);
});

test('pull completes when dependency installation fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const sourceDir = await makeTempDir('nocobase-cli-portal-source-install-failure-');
  await fsp.mkdir(path.join(sourceDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(sourceDir, 'src', 'index.tsx'), 'export default "install failed";\n');
  await fsp.writeFile(path.join(sourceDir, 'package.json'), '{"name":"customer"}\n');
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

  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await expect(fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8')).resolves.toBe(
    'export default "install failed";\n',
  );
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
    if (options.operation.pathTemplate === '/app:getInfo') {
      return { ok: true, status: 200, data: appInfoData() };
    }
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
    '/app:getInfo',
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
  const remoteRepoUrl = toFileUrl(remoteRepo);
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
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
  });
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  expect(normalizeLineEndings(await fsp.readFile(path.join(portalDir, 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "remote";\n',
  );
  await expect(fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8')).resolves.toBe(
    `{\n  "sourceStorage": "git",\n  "git": {\n    "repo": "${remoteRepoUrl}",\n    "branch": "main",\n    "path": "customer"\n  }\n}\n`,
  );

  await runGit(['init'], portalDir);
  await fsp.writeFile(path.join(portalDir, '.git', 'nocobase-preserve-test'), 'keep');
  await fsp.writeFile(path.join(seedRepo, 'customer', 'src', 'index.tsx'), 'export default "remote again";\n');
  await runGit(['add', 'customer/src/index.tsx'], seedRepo);
  await runGit(['commit', '-m', 'update remote'], seedRepo);
  await runGit(['push', 'origin', 'main'], seedRepo);

  await expect(
    pullPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
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
  await runGit(['clone', '--branch', 'main', remoteRepo, verifyRepo]);
  expect(normalizeLineEndings(await fsp.readFile(path.join(verifyRepo, 'customer', 'src', 'index.tsx'), 'utf-8'))).toBe(
    'export default "local";\n',
  );
});

test('pull Git-managed source at the repository root as a local Git checkout', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-source-storage-');
  const remoteRepo = await makeTempDir('nocobase-cli-portal-git-root-remote-');
  const remoteRepoUrl = toFileUrl(remoteRepo);
  const seedRepo = await makeTempDir('nocobase-cli-portal-git-root-seed-');
  await runGit(['init', '--bare'], remoteRepo);
  await runGit(['init', '--initial-branch=main'], seedRepo);
  await runGit(['config', 'user.name', 'NocoBase Test'], seedRepo);
  await runGit(['config', 'user.email', 'test@example.com'], seedRepo);
  await fsp.mkdir(path.join(seedRepo, 'src'), { recursive: true });
  await fsp.writeFile(path.join(seedRepo, 'src', 'index.tsx'), 'export default "remote root";\n');
  await fsp.writeFile(path.join(seedRepo, 'package.json'), '{"name":"customer"}\n');
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
      installDependencies: false,
      apiRequest,
    }),
  ).resolves.toMatchObject({
    sourceStorage: 'git',
    changed: true,
    installSkipped: true,
  });

  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
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
  await writePortalConfig(portalDir, {
    sourceStorage: 'git',
    git: {
      repo: remoteRepoUrl,
      branch: 'main',
    },
  });

  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:update') {
      return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
    }
    return {
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
    };
  });

  await expect(
    pushPortalSource({
      portal: 'customer',
      env: createEnv({ storagePath, kind: 'http' }),
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
});

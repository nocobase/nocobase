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
import {
  buildPortalBasePath,
  createPortalWorkspace,
  resolvePortalAppFromApiBaseUrl,
  resolvePortalEnvApiUrl,
  resolvePortalStoragePath,
  titleFromPortalSlug,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from '../lib/portal-create.js';
import { NB_CLI_ROOT_ENV } from '../lib/cli-home.js';

type PortalCreateRunOptions = {
  cwd?: string;
  env?: Record<string, string>;
  envMode?: 'inherit' | 'replace';
  errorName?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  timeoutMs?: number;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
};

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function writeTemplate(templateDir: string, options: { packageJson?: boolean } = { packageJson: true }) {
  if (options.packageJson !== false) {
    await fsp.writeFile(path.join(templateDir, 'package.json'), '{"name":"portal-template"}\n');
  }
  await fsp.mkdir(path.join(templateDir, 'src'), { recursive: true });
  await fsp.writeFile(path.join(templateDir, 'src', 'index.tsx'), 'export default null;\n');
  await fsp.mkdir(path.join(templateDir, '.git'), { recursive: true });
  await fsp.writeFile(path.join(templateDir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  await fsp.mkdir(path.join(templateDir, 'node_modules', 'stale'), { recursive: true });
  await fsp.writeFile(path.join(templateDir, 'node_modules', 'stale', 'index.js'), '');
  await fsp.mkdir(path.join(templateDir, 'dist'), { recursive: true });
  await fsp.writeFile(path.join(templateDir, 'dist', 'index.js'), '');
  await fsp.writeFile(path.join(templateDir, '.DS_Store'), '');
}

async function writeTemplateTarball(templateDir: string, tarballPath: string): Promise<void> {
  await tar.create(
    {
      cwd: templateDir,
      file: tarballPath,
      gzip: true,
      prefix: 'package/',
    },
    await fsp.readdir(templateDir),
  );
}

function createEnv(params: {
  storagePath: string;
  name?: string;
  apiBaseUrl?: string;
  appPublicPath?: string;
  kind?: PortalCreateEnvLike['kind'];
  configuredStoragePath?: string;
  npmRegistry?: string;
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
      npmRegistry: params.npmRegistry,
    },
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('validates Portal slugs and generates default titles', () => {
  expect(validatePortalSlug('customer-service_2')).toBe('customer-service_2');
  expect(titleFromPortalSlug('customer-service_2')).toBe('Customer Service 2');

  for (const invalid of [
    'Customer',
    'customer.portal',
    'customer/portal',
    'customer portal',
    '-customer',
    '_customer',
  ]) {
    expect(() => validatePortalSlug(invalid)).toThrow(/Invalid Portal name/);
  }
});

test('resolves app and public path from apiBaseUrl', () => {
  expect(resolvePortalAppFromApiBaseUrl('http://localhost:13000/api')).toEqual({
    app: 'main',
    appPublicPath: '/',
  });
  expect(resolvePortalAppFromApiBaseUrl('http://localhost:13000/api/__app/crm')).toEqual({
    app: 'crm',
    appPublicPath: '/',
  });
  expect(resolvePortalAppFromApiBaseUrl('/api/__app/crm')).toEqual({
    app: 'crm',
    appPublicPath: '/',
  });
  expect(resolvePortalAppFromApiBaseUrl('http://localhost:13000/console/api')).toEqual({
    app: 'main',
    appPublicPath: '/console/',
  });
  expect(resolvePortalAppFromApiBaseUrl('http://localhost:13000/console/api/__app/crm')).toEqual({
    app: 'crm',
    appPublicPath: '/console/',
  });
  expect(resolvePortalAppFromApiBaseUrl('http://localhost:13000/console/api', '/admin/')).toEqual({
    app: 'main',
    appPublicPath: '/admin/',
  });
  expect(() => resolvePortalAppFromApiBaseUrl('http://localhost:13000/api/__app/customer%2Fcrm')).toThrow(
    /Invalid Portal app name/,
  );
});

test('resolves relative API URLs for Portal env files', () => {
  expect(resolvePortalEnvApiUrl('http://localhost:13000/console/api/__app/crm')).toBe('/console/api/__app/crm');
  expect(resolvePortalEnvApiUrl('http://localhost:13000/api')).toBe('/api');
  expect(resolvePortalEnvApiUrl('https://example.com/console/api')).toBe('/console/api');
  expect(resolvePortalEnvApiUrl('/api/__app/crm')).toBe('/api/__app/crm');
});

test('builds Portal base paths for main app and sub apps', () => {
  expect(buildPortalBasePath({ app: 'main', appPublicPath: '/', portal: 'customer' })).toBe('/x/customer/');
  expect(buildPortalBasePath({ app: 'crm', appPublicPath: '/', portal: 'customer' })).toBe('/x/apps/crm/customer/');
  expect(buildPortalBasePath({ app: 'crm', appPublicPath: '/console/', portal: 'customer' })).toBe(
    '/console/x/apps/crm/customer/',
  );
});

test('creates a Portal workspace from a local template', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-create-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-create-template-');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  await writeTemplate(templatePath);

  const result = await createPortalWorkspace({
    portal: 'customer',
    template: templatePath,
    env: createEnv({
      storagePath,
      apiBaseUrl: 'http://localhost:13000/console/api/__app/crm',
    }),
    runCommand,
  });

  const portalDir = path.join(storagePath, 'portals', 'crm', 'customer');
  expect(result).toMatchObject({
    portalDir,
    app: 'crm',
    portal: 'customer',
    title: 'Customer',
    apiBaseUrl: 'http://localhost:13000/console/api/__app/crm',
    portalBase: '/console/x/apps/crm/customer/',
    installSkipped: false,
  });
  await expect(fsp.access(path.join(portalDir, 'src', 'index.tsx'))).resolves.toBe(undefined);
  await expect(fsp.access(path.join(portalDir, '.git'))).rejects.toThrow();
  await expect(fsp.access(path.join(portalDir, 'node_modules'))).rejects.toThrow();
  await expect(fsp.access(path.join(portalDir, 'dist'))).rejects.toThrow();
  await expect(fsp.access(path.join(portalDir, '.DS_Store'))).rejects.toThrow();
  await expect(fsp.access(path.join(storagePath, 'portals', 'portal-manifest.json'))).rejects.toThrow();

  expect(await fsp.readFile(path.join(portalDir, '.env'), 'utf-8')).toBe(
    'NOCOBASE_API_URL=/console/api/__app/crm\n' + 'NOCOBASE_PORTAL_BASE=/console/x/apps/crm/customer/\n',
  );
  expect(await fsp.readFile(path.join(portalDir, '.env.local'), 'utf-8')).toBe(
    'NOCOBASE_API_URL=http://localhost:13000/console/api/__app/crm\n' +
      'NOCOBASE_PORTAL_BASE=/console/x/apps/crm/customer/\n',
  );
  expect(JSON.parse(await fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8'))).toEqual({
    sourceStorage: 'nocobase',
  });
  expect(runCommand).toHaveBeenCalledWith('pnpm', ['install'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'pnpm install',
  });
  expect(runCommand.mock.calls[0]?.[2]?.env).not.toHaveProperty('NOCOBASE_API_URL');
  expect(runCommand.mock.calls[0]?.[2]?.env).not.toHaveProperty('NOCOBASE_PORTAL_BASE');
});

test('skips pnpm install when package.json is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-create-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-create-template-');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  const onSkipInstall = vi.fn();
  await writeTemplate(templatePath, { packageJson: false });

  const result = await createPortalWorkspace({
    portal: 'no_package',
    template: templatePath,
    env: createEnv({ storagePath }),
    runCommand,
    onSkipInstall,
  });

  expect(result.installSkipped).toBe(true);
  expect(runCommand).not.toHaveBeenCalled();
  expect(onSkipInstall).toHaveBeenCalledWith(
    `Skipped pnpm install because package.json was not found in ${path.join(
      storagePath,
      'portals',
      'main',
      'no_package',
    )}.`,
  );
});

test('downloads npm package templates with npm pack when not installed locally', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-create-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-create-template-');
  const runCommand = vi.fn(async (name: string, args: string[], options?: PortalCreateRunOptions): Promise<void> => {
    if (name === 'npm') {
      expect(args).toEqual([
        'pack',
        '--silent',
        '--registry=https://registry.example.com',
        '@nocobase/missing-portal-template',
      ]);
      expect(options?.cwd).toBeTruthy();
      expect(options?.stdio).toBe('pipe');
      await writeTemplateTarball(
        templatePath,
        path.join(String(options?.cwd), 'nocobase-missing-portal-template-1.0.0.tgz'),
      );
    }
  });
  await writeTemplate(templatePath);

  await createPortalWorkspace({
    portal: 'customer',
    template: '@nocobase/missing-portal-template',
    env: createEnv({
      storagePath,
      configuredStoragePath: storagePath,
      appPublicPath: '/',
      npmRegistry: 'https://registry.example.com/',
    }),
    runCommand,
  });

  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await expect(fsp.access(path.join(portalDir, 'src', 'index.tsx'))).resolves.toBe(undefined);
  expect(JSON.parse(await fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8'))).toEqual({
    sourceStorage: 'nocobase',
  });
  expect(runCommand).toHaveBeenNthCalledWith(
    2,
    'pnpm',
    ['install'],
    expect.objectContaining({
      cwd: portalDir,
      env: expect.any(Object),
      envMode: 'replace',
      errorName: 'pnpm install',
    }),
  );
});

test('fails when the target directory exists without force', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-create-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-create-template-');
  await writeTemplate(templatePath);
  await fsp.mkdir(path.join(storagePath, 'portals', 'main', 'customer'), { recursive: true });

  await expect(
    createPortalWorkspace({
      portal: 'customer',
      template: templatePath,
      env: createEnv({ storagePath }),
      runCommand: vi.fn().mockResolvedValue(undefined),
    }),
  ).rejects.toThrow(/Portal workspace already exists/);
});

test('fails before resolving the template when the target directory exists without force', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-create-storage-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(portalDir, { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'old.txt'), 'old');

  await expect(
    createPortalWorkspace({
      portal: 'customer',
      template: path.join(storagePath, 'missing-template'),
      env: createEnv({ storagePath }),
      runCommand: vi.fn().mockResolvedValue(undefined),
    }),
  ).rejects.toThrow(/Portal workspace already exists/);
  expect(await fsp.readFile(path.join(portalDir, 'old.txt'), 'utf-8')).toBe('old');
});

test('deletes and recreates an existing target directory with force', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-create-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-create-template-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await writeTemplate(templatePath);
  await fsp.mkdir(portalDir, { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'old.txt'), 'old');

  await createPortalWorkspace({
    portal: 'customer',
    template: templatePath,
    env: createEnv({ storagePath }),
    force: true,
    runCommand: vi.fn().mockResolvedValue(undefined),
  });

  await expect(fsp.access(path.join(portalDir, 'old.txt'))).rejects.toThrow();
  await expect(fsp.access(path.join(portalDir, 'src', 'index.tsx'))).resolves.toBe(undefined);
});

test('force keeps an existing target directory when template resolution fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-create-storage-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(portalDir, { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'old.txt'), 'old');

  await expect(
    createPortalWorkspace({
      portal: 'customer',
      template: path.join(storagePath, 'missing-template'),
      env: createEnv({ storagePath }),
      force: true,
      runCommand: vi.fn().mockResolvedValue(undefined),
    }),
  ).rejects.toThrow(/Portal template directory does not exist/);

  expect(await fsp.readFile(path.join(portalDir, 'old.txt'), 'utf-8')).toBe('old');
});

test('http envs use env source storage when no local storagePath is configured', async () => {
  const originalStoragePath = process.env.STORAGE_PATH;
  const originalCliRoot = process.env[NB_CLI_ROOT_ENV];
  const cliRoot = await makeTempDir('nocobase-cli-portal-create-root-');
  delete process.env.STORAGE_PATH;
  process.env[NB_CLI_ROOT_ENV] = cliRoot;
  try {
    expect(
      resolvePortalStoragePath(
        createEnv({
          kind: 'http',
          name: 'remote1',
          storagePath: '/tmp/fallback',
          configuredStoragePath: '',
        }),
      ),
    ).toBe(path.join(cliRoot, 'remote1', 'source', 'storage'));
    expect(
      resolvePortalStoragePath(
        createEnv({
          kind: 'http',
          name: 'remote1',
          storagePath: '/tmp/nocobase-storage',
          configuredStoragePath: '/tmp/nocobase-storage',
        }),
      ),
    ).toBe('/tmp/nocobase-storage');
  } finally {
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    if (originalCliRoot === undefined) {
      delete process.env[NB_CLI_ROOT_ENV];
    } else {
      process.env[NB_CLI_ROOT_ENV] = originalCliRoot;
    }
  }
});

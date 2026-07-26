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
import { prepareInitialPortalTemplate } from '../lib/portal-template';

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function writePortalTemplate(templatePath: string, lockfile?: string): Promise<void> {
  await fsp.writeFile(path.join(templatePath, 'package.json'), '{"name":"portal-template"}\n');
  await fsp.mkdir(path.join(templatePath, 'src'), { recursive: true });
  await fsp.writeFile(path.join(templatePath, 'src', 'index.tsx'), 'export default null;\n');
  if (lockfile) {
    await fsp.writeFile(path.join(templatePath, lockfile), '');
  }
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('prepares a local yarn portal template without writing a manifest', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-template-');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  await writePortalTemplate(templatePath, 'yarn.lock');
  await fsp.mkdir(path.join(templatePath, '.git'), { recursive: true });
  await fsp.writeFile(path.join(templatePath, 'local-only.ts'), 'export const localOnly = true;\n');
  await fsp.mkdir(path.join(templatePath, 'node_modules', 'stale-dependency'), { recursive: true });
  await fsp.writeFile(
    path.join(templatePath, 'node_modules', 'stale-dependency', 'index.js'),
    'module.exports = null;\n',
  );

  await expect(
    prepareInitialPortalTemplate({
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: templatePath,
      storagePath,
      runCommand,
    }),
  ).resolves.toEqual({ prepared: true });

  const portalDir = path.join(storagePath, 'portals', 'main', 'admin');
  await expect(fsp.access(path.join(portalDir, 'package.json'))).resolves.toBe(undefined);
  await expect(fsp.access(path.join(portalDir, 'local-only.ts'))).resolves.toBe(undefined);
  await expect(fsp.access(path.join(portalDir, '.git'))).rejects.toThrow();
  await expect(fsp.access(path.join(portalDir, 'node_modules'))).rejects.toThrow();
  expect(runCommand).toHaveBeenCalledTimes(1);
  expect(runCommand).toHaveBeenCalledWith('yarn', ['build:html'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_API_URL: '/api',
      NOCOBASE_PORTAL_BASE: '/x/admin/',
    }),
    envMode: 'replace',
    errorName: 'yarn build:html',
    stdio: 'ignore',
  });

  await expect(fsp.access(path.join(storagePath, 'portals', 'portal-manifest.json'))).rejects.toThrow();
});

test('builds copied portal templates with yarn build:html regardless of lockfile', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const pnpmTemplatePath = await makeTempDir('nocobase-cli-portal-template-pnpm-');
  const npmTemplatePath = await makeTempDir('nocobase-cli-portal-template-npm-');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  await writePortalTemplate(pnpmTemplatePath, 'pnpm-lock.yaml');
  await writePortalTemplate(npmTemplatePath, 'package-lock.json');

  await prepareInitialPortalTemplate({
    developmentMode: 'vibe-coding',
    portalName: 'pnpm_portal',
    portalTemplate: pnpmTemplatePath,
    storagePath,
    runCommand,
  });
  await prepareInitialPortalTemplate({
    developmentMode: 'vibe-coding',
    portalName: 'npm_portal',
    portalTemplate: npmTemplatePath,
    storagePath,
    runCommand,
  });

  expect(runCommand).toHaveBeenNthCalledWith(
    1,
    'yarn',
    ['build:html'],
    expect.objectContaining({
      cwd: path.join(storagePath, 'portals', 'main', 'pnpm_portal'),
      env: expect.objectContaining({
        NOCOBASE_API_URL: '/api',
        NOCOBASE_PORTAL_BASE: '/x/pnpm_portal/',
      }),
      envMode: 'replace',
    }),
  );
  expect(runCommand).toHaveBeenNthCalledWith(
    2,
    'yarn',
    ['build:html'],
    expect.objectContaining({
      cwd: path.join(storagePath, 'portals', 'main', 'npm_portal'),
      env: expect.objectContaining({
        NOCOBASE_API_URL: '/api',
        NOCOBASE_PORTAL_BASE: '/x/npm_portal/',
      }),
      envMode: 'replace',
    }),
  );
});

test('runs portal package manager commands with an isolated environment', async () => {
  vi.stubEnv('NODE_OPTIONS', '--max-old-space-size=4096 --preserve-symlinks');
  vi.stubEnv('INIT_PORTAL_TEMPLATE', '/tmp/parent-template');
  vi.stubEnv('NOCOBASE_API_URL', 'http://127.0.0.1:13000/api');
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-template-');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  await writePortalTemplate(templatePath, 'pnpm-lock.yaml');

  await prepareInitialPortalTemplate({
    developmentMode: 'vibe-coding',
    portalName: 'admin',
    portalTemplate: templatePath,
    storagePath,
    runCommand,
  });

  expect(runCommand).toHaveBeenCalledTimes(1);
  expect(runCommand).toHaveBeenCalledWith(
    'yarn',
    ['build:html'],
    expect.objectContaining({
      env: expect.objectContaining({
        NOCOBASE_API_URL: '/api',
        NOCOBASE_PORTAL_BASE: '/x/admin/',
      }),
      envMode: 'replace',
    }),
  );
  expect(runCommand.mock.calls[0]?.[2]?.env).not.toHaveProperty('NODE_OPTIONS');
  expect(runCommand.mock.calls[0]?.[2]?.env).not.toHaveProperty('INIT_PORTAL_TEMPLATE');
});

test('cleans up a copied portal when preparation fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-template-');
  const runCommand = vi.fn().mockRejectedValue(new Error('build failed'));
  await writePortalTemplate(templatePath);

  await expect(
    prepareInitialPortalTemplate({
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: templatePath,
      storagePath,
      runCommand,
    }),
  ).rejects.toThrow('build failed');
  await expect(fsp.access(path.join(storagePath, 'portals', 'main', 'admin'))).rejects.toThrow();
});

test('skips an already prepared portal', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-template-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'admin');
  await fsp.mkdir(path.join(portalDir, 'dist'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'dist', 'index.html'), '<div id="root"></div>');
  const runCommand = vi.fn().mockResolvedValue(undefined);

  await expect(
    prepareInitialPortalTemplate({
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: templatePath,
      storagePath,
      runCommand,
    }),
  ).resolves.toEqual({ prepared: false, skippedReason: 'already-prepared' });
  expect(runCommand).not.toHaveBeenCalled();
});

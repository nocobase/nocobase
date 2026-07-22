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

type LockfileName = 'yarn.lock' | 'pnpm-lock.yaml' | 'package-lock.json';

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function writePortalTemplate(templatePath: string, lockfile: LockfileName): Promise<void> {
  await fsp.writeFile(path.join(templatePath, 'package.json'), '{"name":"portal-template"}\n');
  await fsp.mkdir(path.join(templatePath, 'src'), { recursive: true });
  await fsp.writeFile(path.join(templatePath, 'src', 'index.tsx'), 'export default null;\n');
  await fsp.writeFile(path.join(templatePath, lockfile), '');
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('prepares a local yarn portal template and writes the manifest', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-template-');
  const runCommand = vi.fn().mockResolvedValue(undefined);
  const commandOutput = vi.fn().mockResolvedValue('');
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
      commandOutput,
    }),
  ).resolves.toEqual({ prepared: true });

  const portalDir = path.join(storagePath, 'portals', 'main', 'admin');
  await expect(fsp.access(path.join(portalDir, 'package.json'))).resolves.toBe(undefined);
  await expect(fsp.access(path.join(portalDir, 'local-only.ts'))).resolves.toBe(undefined);
  await expect(fsp.access(path.join(portalDir, '.git'))).rejects.toThrow();
  await expect(fsp.access(path.join(portalDir, 'node_modules'))).rejects.toThrow();
  expect(runCommand).toHaveBeenNthCalledWith(1, 'yarn', ['install'], {
    cwd: portalDir,
    env: expect.any(Object),
    envMode: 'replace',
    errorName: 'yarn install',
    stdio: 'ignore',
  });
  expect(runCommand).toHaveBeenNthCalledWith(2, 'yarn', ['build'], {
    cwd: portalDir,
    env: expect.objectContaining({
      NOCOBASE_API_URL: '/api',
      NOCOBASE_PORTAL_BASE: '/x/admin/',
    }),
    envMode: 'replace',
    errorName: 'yarn build',
    stdio: 'ignore',
  });

  const manifest = JSON.parse(await fsp.readFile(path.join(storagePath, 'portals', 'portal-manifest.json'), 'utf-8'));
  expect(manifest).toMatchObject({
    defaultPortal: 'admin',
    portals: [
      {
        app: 'main',
        name: 'admin',
        path: '/admin',
        source: {
          type: 'local',
          url: templatePath,
        },
      },
    ],
  });
});

test('uses pnpm and npm based on the copied portal lockfile', async () => {
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
    'pnpm',
    ['install'],
    expect.objectContaining({ cwd: path.join(storagePath, 'portals', 'main', 'pnpm_portal') }),
  );
  expect(runCommand).toHaveBeenNthCalledWith(
    2,
    'pnpm',
    ['build'],
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
    3,
    'npm',
    ['install'],
    expect.objectContaining({ cwd: path.join(storagePath, 'portals', 'main', 'npm_portal') }),
  );
  expect(runCommand).toHaveBeenNthCalledWith(
    4,
    'npm',
    ['run', 'build'],
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

  expect(runCommand).toHaveBeenNthCalledWith(
    1,
    'pnpm',
    ['install'],
    expect.objectContaining({
      envMode: 'replace',
    }),
  );
  expect(runCommand).toHaveBeenNthCalledWith(
    2,
    'pnpm',
    ['build'],
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
  expect(runCommand.mock.calls[0]?.[2]?.env).not.toHaveProperty('NOCOBASE_API_URL');
  expect(runCommand.mock.calls[1]?.[2]?.env).not.toHaveProperty('NODE_OPTIONS');
  expect(runCommand.mock.calls[1]?.[2]?.env).not.toHaveProperty('INIT_PORTAL_TEMPLATE');
});

test('cleans up a copied portal when preparation fails', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-template-');
  await fsp.writeFile(path.join(templatePath, 'package.json'), '{"name":"portal-template"}\n');

  await expect(
    prepareInitialPortalTemplate({
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: templatePath,
      storagePath,
      runCommand: vi.fn().mockResolvedValue(undefined),
    }),
  ).rejects.toThrow(/expected yarn\.lock, pnpm-lock\.yaml, or package-lock\.json/);
  await expect(fsp.access(path.join(storagePath, 'portals', 'main', 'admin'))).rejects.toThrow();
});

test('skips an already prepared portal', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-storage-');
  const templatePath = await makeTempDir('nocobase-cli-portal-template-');
  const portalDir = path.join(storagePath, 'portals', 'main', 'admin');
  await fsp.mkdir(portalDir, { recursive: true });
  await fsp.mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await fsp.writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'admin',
      portals: [{ app: 'main', name: 'admin', path: '/admin', source: { type: 'local', url: templatePath } }],
    }),
  );
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

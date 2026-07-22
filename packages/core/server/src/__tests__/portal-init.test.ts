/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { afterEach, expect, test } from 'vitest';
import {
  initializePortalFromEnv,
  normalizeInitDevelopmentMode,
  validatePortalName,
  type PortalManifest,
} from '../portal-init';

const execFileAsync = promisify(execFile);
const originalStoragePath = process.env.STORAGE_PATH;
const originalInitDevelopmentMode = process.env.INIT_DEVELOPMENT_MODE;
const originalInitPortalName = process.env.INIT_PORTAL_NAME;
const originalInitPortalTemplate = process.env.INIT_PORTAL_TEMPLATE;

afterEach(async () => {
  if (originalStoragePath === undefined) {
    delete process.env.STORAGE_PATH;
  } else {
    process.env.STORAGE_PATH = originalStoragePath;
  }
  if (originalInitDevelopmentMode === undefined) {
    delete process.env.INIT_DEVELOPMENT_MODE;
  } else {
    process.env.INIT_DEVELOPMENT_MODE = originalInitDevelopmentMode;
  }
  if (originalInitPortalName === undefined) {
    delete process.env.INIT_PORTAL_NAME;
  } else {
    process.env.INIT_PORTAL_NAME = originalInitPortalName;
  }
  if (originalInitPortalTemplate === undefined) {
    delete process.env.INIT_PORTAL_TEMPLATE;
  } else {
    process.env.INIT_PORTAL_TEMPLATE = originalInitPortalTemplate;
  }
});

test('normalizes init development mode', () => {
  expect(normalizeInitDevelopmentMode()).toBe('no-code');
  expect(normalizeInitDevelopmentMode('no-code')).toBe('no-code');
  expect(normalizeInitDevelopmentMode('vibe-coding')).toBe('vibe-coding');
  expect(() => normalizeInitDevelopmentMode('vibe')).toThrow(/Invalid INIT_DEVELOPMENT_MODE/);
});

test('validates portal names', () => {
  expect(validatePortalName()).toBe('admin');
  expect(validatePortalName('main_portal-1')).toBe('main_portal-1');
  expect(() => validatePortalName('../admin')).toThrow(/Invalid INIT_PORTAL_NAME/);
});

test('skips portal initialization in no-code mode', async () => {
  const storagePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-init-'));
  process.env.STORAGE_PATH = storagePath;

  try {
    await initializePortalFromEnv({ developmentMode: 'no-code', portalName: 'admin' });

    await expect(fs.promises.access(path.join(storagePath, 'portals', 'admin'))).rejects.toThrow();
  } finally {
    await fs.promises.rm(storagePath, { recursive: true, force: true });
  }
});

test('clones a git portal template into storage/portals/<portal>', async () => {
  const storagePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-storage-'));
  const templatePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-'));
  process.env.STORAGE_PATH = storagePath;

  try {
    await fs.promises.writeFile(path.join(templatePath, 'package.json'), '{"name":"portal-template"}\n');
    await fs.promises.mkdir(path.join(templatePath, 'src'), { recursive: true });
    await fs.promises.writeFile(path.join(templatePath, 'src', 'index.tsx'), 'export default null;\n');
    await execFileAsync('git', ['init'], { cwd: templatePath });
    await execFileAsync('git', ['add', '.'], { cwd: templatePath });
    await execFileAsync('git', ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '-m', 'init'], {
      cwd: templatePath,
    });

    await initializePortalFromEnv({
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: templatePath,
    });

    await expect(fs.promises.access(path.join(storagePath, 'portals', 'admin', 'package.json'))).resolves.toBe(
      undefined,
    );
    await expect(fs.promises.access(path.join(storagePath, 'portals', 'admin', '.git'))).rejects.toThrow();

    const manifest = JSON.parse(
      await fs.promises.readFile(path.join(storagePath, 'portals', 'portal-manifest.json'), 'utf-8'),
    ) as PortalManifest;
    expect(manifest.defaultPortal).toBe('admin');
    expect(manifest.portals[0]).toMatchObject({
      name: 'admin',
      source: {
        type: 'git',
        url: templatePath,
      },
    });
    expect(manifest.portals[0].source.commit).toMatch(/^[0-9a-f]{40}$/);
  } finally {
    await fs.promises.rm(storagePath, { recursive: true, force: true });
    await fs.promises.rm(templatePath, { recursive: true, force: true });
  }
});

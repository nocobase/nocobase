/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, expect, test } from 'vitest';
import {
  initializePortalFromEnv,
  normalizeInitDevelopmentMode,
  validatePortalAppName,
  validatePortalName,
  type PortalManifest,
} from '../portal-init';

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

test('validates portal app names', () => {
  expect(validatePortalAppName()).toBe('main');
  expect(validatePortalAppName('crm_app-1')).toBe('crm_app-1');
  expect(() => validatePortalAppName('../crm')).toThrow(/Invalid portal app name/);
});

test('skips portal initialization in no-code mode', async () => {
  const storagePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-init-'));
  process.env.STORAGE_PATH = storagePath;

  try {
    await initializePortalFromEnv({ developmentMode: 'no-code', portalName: 'admin' });

    await expect(fs.promises.access(path.join(storagePath, 'portals', 'main', 'admin'))).rejects.toThrow();
  } finally {
    await fs.promises.rm(storagePath, { recursive: true, force: true });
  }
});

test('copies a local portal template into storage/portals/<app>/<portal>', async () => {
  const storagePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-storage-'));
  const templatePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-'));
  process.env.STORAGE_PATH = storagePath;

  try {
    await fs.promises.writeFile(path.join(templatePath, 'package.json'), '{"name":"portal-template"}\n');
    await fs.promises.mkdir(path.join(templatePath, 'src'), { recursive: true });
    await fs.promises.writeFile(path.join(templatePath, 'src', 'index.tsx'), 'export default null;\n');
    await fs.promises.mkdir(path.join(templatePath, '.git'), { recursive: true });
    await fs.promises.writeFile(path.join(templatePath, 'local-only.ts'), 'export const localOnly = true;\n');

    await initializePortalFromEnv({
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: templatePath,
    });

    await expect(fs.promises.access(path.join(storagePath, 'portals', 'main', 'admin', 'package.json'))).resolves.toBe(
      undefined,
    );
    await expect(fs.promises.access(path.join(storagePath, 'portals', 'main', 'admin', 'local-only.ts'))).resolves.toBe(
      undefined,
    );
    await expect(fs.promises.access(path.join(storagePath, 'portals', 'main', 'admin', '.git'))).rejects.toThrow();

    const manifest = JSON.parse(
      await fs.promises.readFile(path.join(storagePath, 'portals', 'portal-manifest.json'), 'utf-8'),
    ) as PortalManifest;
    expect(manifest.defaultPortal).toBe('admin');
    expect(manifest.portals[0]).toMatchObject({
      app: 'main',
      name: 'admin',
      path: '/admin',
      source: {
        type: 'local',
        url: templatePath,
      },
    });
  } finally {
    await fs.promises.rm(storagePath, { recursive: true, force: true });
    await fs.promises.rm(templatePath, { recursive: true, force: true });
  }
});

test('uses the bundled default portal template when vibe-coding mode has no explicit template', async () => {
  const storagePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-default-template-'));
  process.env.STORAGE_PATH = storagePath;

  try {
    await initializePortalFromEnv({
      developmentMode: 'vibe-coding',
      portalName: 'admin',
    });

    const portalDir = path.join(storagePath, 'portals', 'main', 'admin');
    const packageJson = JSON.parse(await fs.promises.readFile(path.join(portalDir, 'package.json'), 'utf-8')) as {
      name?: string;
    };
    expect(packageJson.name).toBe('@nocobase/portal-template-default');
    await expect(fs.promises.access(path.join(portalDir, 'node_modules'))).rejects.toThrow();

    const manifest = JSON.parse(
      await fs.promises.readFile(path.join(storagePath, 'portals', 'portal-manifest.json'), 'utf-8'),
    ) as PortalManifest;
    expect(manifest.portals[0]).toMatchObject({
      app: 'main',
      name: 'admin',
      path: '/admin',
      source: {
        type: 'local',
        url: expect.stringContaining('@nocobase/portal-template-default'),
      },
    });
  } finally {
    await fs.promises.rm(storagePath, { recursive: true, force: true });
  }
});

test('copies a local portal template into a sub-app portal directory and appends manifest entry', async () => {
  const storagePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-storage-'));
  const mainTemplatePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-main-'));
  const subTemplatePath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-sub-'));
  process.env.STORAGE_PATH = storagePath;

  try {
    for (const templatePath of [mainTemplatePath, subTemplatePath]) {
      await fs.promises.writeFile(path.join(templatePath, 'package.json'), '{"name":"portal-template"}\n');
    }

    await initializePortalFromEnv({
      appName: 'main',
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: mainTemplatePath,
    });
    await initializePortalFromEnv({
      appName: 'crm',
      developmentMode: 'vibe-coding',
      portalName: 'admin',
      portalTemplate: subTemplatePath,
    });

    await expect(fs.promises.access(path.join(storagePath, 'portals', 'crm', 'admin', 'package.json'))).resolves.toBe(
      undefined,
    );

    const manifest = JSON.parse(
      await fs.promises.readFile(path.join(storagePath, 'portals', 'portal-manifest.json'), 'utf-8'),
    ) as PortalManifest;
    expect(manifest.defaultPortal).toBe('admin');
    expect(manifest.portals).toHaveLength(2);
    expect(manifest.portals[1]).toMatchObject({
      app: 'crm',
      name: 'admin',
      path: '/admin',
      source: {
        type: 'local',
        url: subTemplatePath,
      },
    });
  } finally {
    await fs.promises.rm(storagePath, { recursive: true, force: true });
    await fs.promises.rm(mainTemplatePath, { recursive: true, force: true });
    await fs.promises.rm(subTemplatePath, { recursive: true, force: true });
  }
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import { AppSupervisor } from '@nocobase/server';
import { access, chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import type { ChildProcess } from 'child_process';
import * as tar from 'tar';
import { vi } from 'vitest';

const spawnMock = vi.hoisted(() => {
  const fsSync = require('fs') as typeof import('fs');
  const pathSync = require('path') as typeof import('path');
  const { EventEmitter } = require('events') as typeof import('events');
  const { PassThrough } = require('stream') as typeof import('stream');
  type SpawnOptions = {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  };

  return vi.fn((command: string, args: string[], options: SpawnOptions) => {
    const subprocess = new EventEmitter() as ChildProcess & {
      stdout: InstanceType<typeof PassThrough>;
      stderr: InstanceType<typeof PassThrough>;
    };
    subprocess.stdout = new PassThrough();
    subprocess.stderr = new PassThrough();

    process.nextTick(() => {
      const isBuildCommand = command === 'yarn' && args[0] === 'build:html';
      const isNpmPackCommand = command === 'npm' && args[0] === 'pack';
      subprocess.stdout.write(`${command} ${args.join(' ')} stdout\n`);
      subprocess.stderr.write(`${command} ${args.join(' ')} stderr\n`);
      subprocess.stdout.end();
      subprocess.stderr.end();
      if (isNpmPackCommand && options.cwd && process.env.TEST_PORTAL_TEMPLATE_TARBALL) {
        fsSync.copyFileSync(
          process.env.TEST_PORTAL_TEMPLATE_TARBALL,
          pathSync.join(options.cwd, pathSync.basename(process.env.TEST_PORTAL_TEMPLATE_TARBALL)),
        );
      }
      if (isBuildCommand && options.cwd) {
        if (process.env.TEST_PORTAL_BUILD_FAIL !== 'true') {
          const distDir = pathSync.join(options.cwd, 'dist');
          fsSync.mkdirSync(distDir, { recursive: true });
          fsSync.writeFileSync(pathSync.join(distDir, 'index.html'), options.env?.NOCOBASE_PORTAL_BASE || '');
        }
      }
      subprocess.emit('close', isBuildCommand && process.env.TEST_PORTAL_BUILD_FAIL === 'true' ? 1 : 0, null);
    });

    return subprocess;
  });
});
const execFileMock = vi.hoisted(() => {
  type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;

  return vi.fn((_command: string, _args: string[], options?: ExecFileCallback, callback?: ExecFileCallback) => {
    const done = typeof options === 'function' ? options : callback;
    process.nextTick(() => {
      done?.(null, '', '');
    });
    return { on: () => undefined } as unknown as ChildProcess;
  });
});

vi.mock('child_process', () => ({
  execFile: execFileMock,
  spawn: spawnMock,
}));

const DEFAULT_ADMIN_UI_LAYOUT = {
  title: 'Desktop layout',
  uid: 'admin-layout-model',
  layoutType: 'desktop',
  routeName: 'admin',
  routePath: '/admin',
  authCheck: true,
  enabled: true,
} as const;
const DEFAULT_MOBILE_UI_LAYOUT = {
  title: 'Mobile layout',
  uid: 'mobile-layout-model',
  layoutType: 'mobile',
  routeName: 'mobile',
  routePath: '/mobile',
  authCheck: true,
  enabled: true,
} as const;

const MULTI_PORTAL_RUNTIME_FIELDS = [
  'uid',
  'title',
  'developmentMode',
  'routeName',
  'routePath',
  'authCheck',
  'enabled',
  'uiLayout',
];
const MULTI_PORTAL_ACCESSIBLE_FIELDS = [
  'uid',
  'title',
  'icon',
  'developmentMode',
  'routeName',
  'routePath',
  'authCheck',
  'enabled',
  'uiLayout',
];
const MULTI_PORTAL_MANAGEMENT_ACTIONS = [
  'multiPortals:list',
  'multiPortals:get',
  'multiPortals:getLog',
  'multiPortals:create',
  'multiPortals:update',
  'multiPortals:firstOrCreate',
  'multiPortals:destroy',
  'multiPortals:deploy',
  'multiPortals:pullSource',
  'multiPortals:pushSource',
];
const ROLE_MULTI_PORTAL_PERMISSION_ACTIONS = [
  'roles.multiPortals:*',
  'rolesMultiPortalDesktopRoutes:*',
  'rolesMultiPortalRoutePolicies:*',
];
const originalAppPublicPath = process.env.APP_PUBLIC_PATH;
const originalApiBasePath = process.env.API_BASE_PATH;
const originalApiBaseUrl = process.env.API_BASE_URL;
const originalNocobaseApiUrl = process.env.NOCOBASE_API_URL;
const originalNodeOptions = process.env.NODE_OPTIONS;
const originalStoragePath = process.env.STORAGE_PATH;
const originalInitDevelopmentMode = process.env.INIT_DEVELOPMENT_MODE;
const originalInitPortalName = process.env.INIT_PORTAL_NAME;
const originalInitPortalTemplate = process.env.INIT_PORTAL_TEMPLATE;

interface RouteResponseItem {
  title?: string;
  children?: RouteResponseItem[];
}

async function createMultiPortalAclMockServer() {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: [
      'error-handler',
      'users',
      'auth',
      'client',
      'field-sort',
      'acl',
      'ui-schema-storage',
      'system-settings',
      'data-source-main',
      'data-source-manager',
      'ui-layout',
      'multi-portal',
    ],
  });
}

function collectRouteTitles(routes: RouteResponseItem[] = []) {
  return routes.flatMap((route) => [
    ...(typeof route.title === 'string' ? [route.title] : []),
    ...collectRouteTitles(route.children),
  ]);
}

async function createPortalDistArchive(rootDir: string, files: Record<string, string>, modes?: Record<string, number>) {
  const distSourceDir = path.join(rootDir, `dist-source-${Date.now()}-${Math.random().toString().slice(2)}`);
  const archivePath = path.join(rootDir, `dist-${Date.now()}-${Math.random().toString().slice(2)}.tar.gz`);
  for (const [fileName, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(distSourceDir, fileName)), { recursive: true });
    await writeFile(path.join(distSourceDir, fileName), content, 'utf-8');
  }
  for (const [entryPath, mode] of Object.entries(modes ?? {})) {
    await chmod(path.join(distSourceDir, entryPath), mode);
  }
  await tar.create(
    {
      cwd: distSourceDir,
      file: archivePath,
      gzip: true,
    },
    Object.keys(files),
  );
  return archivePath;
}

async function createPortalTemplate(rootDir: string, files: Record<string, string> = {}) {
  const templateDir = path.join(rootDir, `template-${Date.now()}-${Math.random().toString().slice(2)}`);
  await mkdir(templateDir, { recursive: true });
  await writeFile(path.join(templateDir, 'package.json'), '{"name":"portal-template"}\n', 'utf-8');
  for (const [fileName, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(templateDir, fileName)), { recursive: true });
    await writeFile(path.join(templateDir, fileName), content, 'utf-8');
  }
  return templateDir;
}

async function createPortalTemplateTarball(rootDir: string, templateDir: string) {
  const archivePath = path.join(rootDir, `portal-template-${Date.now()}-${Math.random().toString().slice(2)}.tgz`);
  await tar.create(
    {
      cwd: templateDir,
      file: archivePath,
      gzip: true,
      prefix: 'package/',
    },
    await readdir(templateDir),
  );
  return archivePath;
}

async function waitForPath(filePath: string, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await access(filePath);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Timed out waiting for ${filePath}`);
}

async function waitForFileContent(filePath: string, expected: string, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let content = '';
  while (Date.now() < deadline) {
    try {
      content = await readFile(filePath, 'utf-8');
      if (content.includes(expected)) {
        return content;
      }
    } catch {
      // keep polling until the async portal storage task writes the log
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for ${filePath} to contain ${expected}. Last content: ${content}`);
}

describe('plugin-multi-portal server', () => {
  let app: MockServer | undefined;
  let storagePath: string | undefined;

  beforeEach(async () => {
    execFileMock.mockClear();
    spawnMock.mockClear();
    storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-multi-portal-'));
    process.env.STORAGE_PATH = storagePath;
  });

  afterEach(async () => {
    if (app?.name) {
      await AppSupervisor.getInstance().removeAppManifest(app.name, 'multi-portal');
    }
    await app?.destroy();
    app = undefined;
    if (storagePath) {
      await rm(storagePath, { recursive: true, force: true });
    }
    storagePath = undefined;
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    if (originalAppPublicPath === undefined) {
      delete process.env.APP_PUBLIC_PATH;
    } else {
      process.env.APP_PUBLIC_PATH = originalAppPublicPath;
    }
    if (originalApiBasePath === undefined) {
      delete process.env.API_BASE_PATH;
    } else {
      process.env.API_BASE_PATH = originalApiBasePath;
    }
    if (originalApiBaseUrl === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = originalApiBaseUrl;
    }
    if (originalNocobaseApiUrl === undefined) {
      delete process.env.NOCOBASE_API_URL;
    } else {
      process.env.NOCOBASE_API_URL = originalNocobaseApiUrl;
    }
    if (originalNodeOptions === undefined) {
      delete process.env.NODE_OPTIONS;
    } else {
      process.env.NODE_OPTIONS = originalNodeOptions;
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
    delete process.env.TEST_PORTAL_TEMPLATE_TARBALL;
    delete process.env.TEST_PORTAL_BUILD_FAIL;
  });

  it('should load with UI Layout without adding core dependencies', async () => {
    app = await createMockServer({
      plugins: ['ui-layout', 'multi-portal'],
    });

    expect(app.pm.get('ui-layout')).toBeTruthy();
    expect(app.pm.get('multi-portal')).toBeTruthy();
  });

  it('should not require legacy ui layout scoped permission collections', async () => {
    app = await createMultiPortalAclMockServer();

    expect(app.db.getCollection('rolesUiLayouts')).toBeUndefined();
    expect(app.db.getCollection('rolesUiLayoutDesktopRoutes')).toBeUndefined();
  });

  it('should define multiPortals with ui layout fields and relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const collection = app.db.getCollection('multiPortals');
    expect(collection).toBeTruthy();
    expect(collection.options.filterTargetKey).toBe('uid');
    expect(collection.options.timestamps).toBe(true);
    expect(collection.getField('uid')?.options).toMatchObject({
      type: 'string',
      primaryKey: true,
      allowNull: false,
    });
    expect(collection.getField('title')?.options).toMatchObject({
      type: 'string',
      allowNull: false,
    });
    expect(collection.getField('icon')?.options).toMatchObject({
      type: 'string',
      allowNull: true,
    });
    expect(collection.getField('icon')?.options.required).toBeUndefined();
    expect(collection.getField('routeName')?.options).toMatchObject({
      type: 'string',
      allowNull: false,
    });
    expect(collection.getField('routePath')?.options).toMatchObject({
      type: 'string',
      allowNull: false,
    });
    expect(collection.getField('authCheck')?.options).toMatchObject({
      type: 'boolean',
      defaultValue: true,
      allowNull: false,
    });
    expect(collection.getField('enabled')?.options).toMatchObject({
      type: 'boolean',
      defaultValue: true,
      allowNull: false,
    });
    expect(collection.getField('uiLayoutUid')?.options).toMatchObject({
      type: 'string',
      allowNull: true,
      hidden: true,
    });
    expect(collection.getField('createdAt')?.options).toMatchObject({
      type: 'date',
      field: 'createdAt',
      interface: 'createdAt',
      allowNull: true,
    });
    expect(collection.getField('updatedAt')?.options).toMatchObject({
      type: 'date',
      field: 'updatedAt',
      interface: 'updatedAt',
      allowNull: true,
    });
    expect(collection.getField('layoutType')).toBeUndefined();
    expect(collection.getField('uiLayout')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'uiLayouts',
      targetKey: 'uid',
      foreignKey: 'uiLayoutUid',
      onDelete: 'RESTRICT',
    });
    expect(collection.getField('uiLayout')?.options.constraints).toBeUndefined();

    const repository = app.db.getRepository('multiPortals');
    const desktopPortal = await repository.create({
      values: {
        uid: 'desktop-portal',
        title: 'Desktop portal',
        icon: 'desktopoutlined',
        routeName: 'desktopPortal',
        routePath: '/desktop-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const mobilePortal = await repository.create({
      values: {
        uid: 'mobile-portal',
        title: 'Mobile portal',
        icon: 'mobileoutlined',
        routeName: 'mobilePortal',
        routePath: '/mobile-portal',
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const persistedDesktopPortal = await repository.findOne({
      filterByTk: desktopPortal.get('uid'),
      appends: ['uiLayout'],
    });
    const persistedMobilePortal = await repository.findOne({
      filterByTk: mobilePortal.get('uid'),
      appends: ['uiLayout'],
    });

    expect(persistedDesktopPortal?.get('uiLayout')?.get('uid')).toBe(DEFAULT_ADMIN_UI_LAYOUT.uid);
    expect(persistedMobilePortal?.get('uiLayout')?.get('uid')).toBe(DEFAULT_MOBILE_UI_LAYOUT.uid);
    expect(persistedDesktopPortal?.get('icon')).toBe('desktopoutlined');
    expect(persistedMobilePortal?.get('icon')).toBe('mobileoutlined');
    expect(persistedDesktopPortal?.toJSON()).not.toHaveProperty('layoutType');

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const apiCreateResponse = await rootAgent.resource('multiPortals').create({
      values: {
        uid: 'api-portal',
        title: 'API portal',
        routeName: 'api-portal',
        routePath: '/api-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const apiUpdateResponse = await rootAgent.resource('multiPortals').update({
      filterByTk: 'api-portal',
      values: {
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const persistedApiPortal = await repository.findOne({
      filterByTk: 'api-portal',
      appends: ['uiLayout'],
    });

    expect(apiCreateResponse.status).toBe(200);
    expect(apiUpdateResponse.status).toBe(200);
    expect(persistedApiPortal?.get('uiLayout')?.get('uid')).toBe(DEFAULT_MOBILE_UI_LAYOUT.uid);
    const invalidLayoutPortal = await repository.create({
      values: {
        uid: 'invalid-layout-portal',
        title: 'Invalid layout portal',
        routeName: 'invalidLayoutPortal',
        routePath: '/invalid-layout-portal',
        uiLayoutUid: 'missing-ui-layout',
      },
    });
    const persistedInvalidLayoutPortal = await repository.findOne({
      filterByTk: invalidLayoutPortal.get('uid'),
      appends: ['uiLayout'],
    });
    expect(persistedInvalidLayoutPortal?.get('uiLayout')).toBeFalsy();
  });

  it('should initialize one default portal from environment variables', async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await plugin.install();
    const response = await app.agent().resource('multiPortals').list();
    const portals = response.body.data as Array<Record<string, unknown>>;
    const defaultPortal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: '__default_portal__',
      fields: ['uid', 'uiLayoutUid'],
    });

    expect(response.status).toBe(200);
    expect(defaultPortal?.get('uiLayoutUid')).toBe(DEFAULT_ADMIN_UI_LAYOUT.uid);
    expect(portals).toEqual([
      expect.objectContaining({
        uid: '__default_portal__',
        title: 'Admin',
        developmentMode: 'no-code',
        routeName: 'admin',
        routePath: '/admin',
      }),
    ]);
  });

  it('should apply INIT_PORTAL_NAME to the default portal', async () => {
    process.env.INIT_PORTAL_NAME = 'workspace_home';
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await plugin.install();
    const defaultPortal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: '__default_portal__',
    });

    expect(defaultPortal?.get('title')).toBe('Workspace Home');
    expect(defaultPortal?.get('routeName')).toBe('workspace_home');
    expect(defaultPortal?.get('routePath')).toBe('/workspace_home');
  });

  it('should initialize an AI default portal with the init template', async () => {
    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.INIT_DEVELOPMENT_MODE = 'ai';
    process.env.INIT_PORTAL_NAME = 'workspace';
    process.env.INIT_PORTAL_TEMPLATE = '@nocobase/portal-template-default';
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();
    spawnMock.mockClear();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await plugin.install();

    const appName = app.name || 'main';
    const portalDir = path.join(storagePath as string, 'portals', appName, 'workspace');
    const defaultPortal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: '__default_portal__',
    });

    expect(defaultPortal?.get('developmentMode')).toBe('ai');
    expect(defaultPortal?.get('routeName')).toBe('workspace');
    await waitForPath(path.join(portalDir, 'dist', 'index.html'));
    await expect(readFile(path.join(portalDir, 'dist', 'index.html'), 'utf-8')).resolves.toBe('/console/x/workspace/');
    expect(spawnMock).toHaveBeenCalledWith(
      'yarn',
      ['build:html'],
      expect.objectContaining({
        cwd: portalDir,
        env: expect.objectContaining({
          NOCOBASE_PORTAL_BASE: '/console/x/workspace/',
        }),
      }),
    );
  });

  it('should initialize an AI default portal from a local init template', async () => {
    const templateDir = await createPortalTemplate(storagePath as string, {
      'src/index.tsx': 'export default null;\n',
      '.git/config': '[core]\n',
      'node_modules/stale/index.js': 'module.exports = null;\n',
      '.DS_Store': '',
      '._shadow': '',
    });
    process.env.INIT_DEVELOPMENT_MODE = 'ai';
    process.env.INIT_PORTAL_NAME = 'workspace';
    process.env.INIT_PORTAL_TEMPLATE = templateDir;
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();
    spawnMock.mockClear();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await plugin.install();

    const portalDir = path.join(storagePath as string, 'portals', app.name || 'main', 'workspace');
    await waitForPath(path.join(portalDir, 'dist', 'index.html'));
    await expect(access(path.join(portalDir, 'src', 'index.tsx'))).resolves.toBeUndefined();
    await expect(access(path.join(portalDir, '.git'))).rejects.toThrow();
    await expect(access(path.join(portalDir, 'node_modules'))).rejects.toThrow();
    await expect(access(path.join(portalDir, '.DS_Store'))).rejects.toThrow();
    await expect(access(path.join(portalDir, '._shadow'))).rejects.toThrow();
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith(
      'yarn',
      ['build:html'],
      expect.objectContaining({
        cwd: portalDir,
      }),
    );
  });

  it('should download npm package init templates with npm pack when not installed locally', async () => {
    const templateDir = await createPortalTemplate(storagePath as string, {
      'src/index.tsx': 'export default null;\n',
    });
    process.env.TEST_PORTAL_TEMPLATE_TARBALL = await createPortalTemplateTarball(storagePath as string, templateDir);
    process.env.INIT_DEVELOPMENT_MODE = 'ai';
    process.env.INIT_PORTAL_NAME = 'workspace';
    process.env.INIT_PORTAL_TEMPLATE = '@nocobase/missing-portal-template';
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();
    spawnMock.mockClear();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await plugin.install();

    const portalDir = path.join(storagePath as string, 'portals', app.name || 'main', 'workspace');
    await waitForPath(path.join(portalDir, 'dist', 'index.html'));
    expect(spawnMock).toHaveBeenNthCalledWith(
      1,
      'npm',
      ['pack', '--silent', '@nocobase/missing-portal-template'],
      expect.objectContaining({
        cwd: expect.any(String),
      }),
    );
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'yarn',
      ['build:html'],
      expect.objectContaining({
        cwd: portalDir,
      }),
    );
  });

  it('should not fail plugin install when the init portal build fails', async () => {
    const templateDir = await createPortalTemplate(storagePath as string, {
      'src/index.tsx': 'export default null;\n',
    });
    process.env.TEST_PORTAL_BUILD_FAIL = 'true';
    process.env.INIT_DEVELOPMENT_MODE = 'ai';
    process.env.INIT_PORTAL_NAME = 'workspace';
    process.env.INIT_PORTAL_TEMPLATE = templateDir;
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await expect(plugin.install()).resolves.toBeUndefined();

    const portalDir = path.join(storagePath as string, 'portals', app.name || 'main', 'workspace');
    await expect(access(path.join(portalDir, 'package.json'))).resolves.toBeUndefined();
    await expect(access(path.join(portalDir, 'dist', 'index.html'))).rejects.toThrow();
    await expect(
      waitForFileContent(
        path.join(storagePath as string, 'logs', 'portals', app.name || 'main', 'workspace.log'),
        'Portal storage create task failed for',
      ),
    ).resolves.toContain('Portal storage create task failed for');
  });

  it('should reject invalid init environment variables', async () => {
    process.env.INIT_DEVELOPMENT_MODE = 'invalid';
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await expect(plugin.install()).rejects.toThrow('INIT_DEVELOPMENT_MODE must be either "no-code" or "ai".');

    process.env.INIT_DEVELOPMENT_MODE = 'no-code';
    process.env.INIT_PORTAL_NAME = 'Admin';
    await expect(plugin.install()).rejects.toThrow(
      'INIT_PORTAL_NAME can only contain lowercase letters, numbers, hyphens, and underscores.',
    );
  });

  it('should allow deleting default portals', async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await plugin.install();
    const response = await app.agent().resource('multiPortals').destroy({
      filterByTk: '__default_portal__',
    });
    const defaultPortal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: '__default_portal__',
    });
    const listResponse = await app.agent().resource('multiPortals').list();
    const portals = listResponse.body.data as Array<Record<string, unknown>>;

    expect(response.status).toBe(200);
    expect(defaultPortal).toBeNull();
    expect(portals).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uid: '__default_portal__',
        }),
      ]),
    );
  });

  it('should allow updating enabled for default portals', async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    await plugin.install();
    const response = await app
      .agent()
      .resource('multiPortals')
      .update({
        filterByTk: '__default_portal__',
        values: {
          enabled: false,
          routeName: 'changed-admin',
        },
      });
    const defaultPortal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: '__default_portal__',
    });

    expect(response.status).toBe(200);
    expect(defaultPortal?.get('enabled')).toBe(false);
    expect(defaultPortal?.get('routeName')).toBe('admin');
  });

  it('should publish custom enabled portal manifest through app supervisor', async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const customerPortal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'manifest-customer-portal',
        title: 'Customer portal',
        icon: 'appstoreoutlined',
        developmentMode: 'ai',
        routeName: 'manifestCustomerPortal',
        routePath: '/customer-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'manifest-disabled-portal',
        title: 'Disabled portal',
        icon: 'stopoutlined',
        routeName: 'manifestDisabledPortal',
        routePath: '/disabled-portal',
        authCheck: true,
        enabled: false,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    await expect(AppSupervisor.getInstance().getAppManifestItems(app.name, 'multi-portal')).resolves.toEqual([
      {
        uid: 'manifest-customer-portal',
        title: 'Customer portal',
        icon: 'appstoreoutlined',
        developmentMode: 'ai',
        routePath: '/customer-portal',
        layout: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
      },
    ]);

    await customerPortal.update({
      enabled: false,
    });
    await expect(AppSupervisor.getInstance().getAppManifestItems(app.name, 'multi-portal')).resolves.toEqual([]);

    await customerPortal.update({
      enabled: true,
    });
    await customerPortal.destroy();
    await expect(AppSupervisor.getInstance().getAppManifestItems(app.name, 'multi-portal')).resolves.toEqual([]);
  });

  it('should prepare a storage portal from the default template for AI multi-portals', async () => {
    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.API_BASE_PATH = '/api';
    process.env.NODE_OPTIONS = '--preserve-symlinks --max_old_space_size=4096 --preserve-symlinks-main';
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'storage-template-portal',
        title: 'Storage template portal',
        developmentMode: 'ai',
        routeName: 'storageTemplatePortal',
        routePath: '/storage-template-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const appName = app.name || 'main';
    const portalDir = path.join(storagePath as string, 'portals', appName, 'storageTemplatePortal');
    await waitForPath(path.join(portalDir, 'dist', 'index.html'));
    await expect(access(path.join(portalDir, 'package.json'))).resolves.toBeUndefined();
    await expect(access(path.join(portalDir, 'node_modules'))).rejects.toThrow();
    await expect(access(path.join(portalDir, 'dist', 'favicon.ico'))).resolves.toBeUndefined();
    await expect(readFile(path.join(portalDir, 'dist', 'index.html'), 'utf-8')).resolves.toBe(
      '/console/x/storageTemplatePortal/',
    );
    expect(spawnMock).toHaveBeenCalledWith(
      'yarn',
      ['build:html'],
      expect.objectContaining({
        cwd: portalDir,
        env: expect.objectContaining({
          NODE_OPTIONS: '--max_old_space_size=4096',
          NOCOBASE_API_URL: '/console/api',
          NOCOBASE_PORTAL_BASE: '/console/x/storageTemplatePortal/',
        }),
      }),
    );
    await expect(
      readFile(path.join(storagePath as string, 'logs', 'portals', appName, 'storageTemplatePortal.log'), 'utf-8'),
    ).resolves.toContain('Portal build completed for');
    const logResponse = await app.agent().resource('multiPortals').getLog({
      filterByTk: 'storage-template-portal',
    });
    expect(logResponse.status).toBe(200);
    expect(logResponse.body.data).toEqual(
      expect.objectContaining({
        content: expect.stringContaining('Portal build completed for'),
        path: path.join('logs', 'portals', appName, 'storageTemplatePortal.log'),
      }),
    );
    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'storage-no-code-portal',
        title: 'Storage no-code portal',
        developmentMode: 'no-code',
        routeName: 'storageNoCodePortal',
        routePath: '/storage-no-code-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const noCodeLogResponse = await app.agent().resource('multiPortals').getLog({
      filterByTk: 'storage-no-code-portal',
    });
    expect(noCodeLogResponse.status).toBe(404);

    await expect(access(path.join(storagePath as string, 'portals', 'portal-manifest.json'))).rejects.toThrow();

    await app.db.getRepository('multiPortals').update({
      filterByTk: 'storage-template-portal',
      values: {
        enabled: false,
      },
    });
    await expect(access(path.join(portalDir, 'dist', 'index.html'))).rejects.toThrow();
  });

  it('should skip preparing the storage portal directory when requested by multiPortals:create', async () => {
    process.env.APP_PUBLIC_PATH = '/console/';
    app = await createMultiPortalAclMockServer();
    await app.db.sync();
    spawnMock.mockClear();

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const response = await rootAgent.resource('multiPortals').create({
      values: {
        uid: 'skip-template-portal',
        title: 'Skip template portal',
        developmentMode: 'ai',
        routeName: 'skip-template-portal',
        routePath: '/skip-template-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        skipCreatePortalDirectory: true,
      },
    });

    const appName = app.name || 'main';
    const portalDir = path.join(storagePath as string, 'portals', appName, 'skip-template-portal');
    const portal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: 'skip-template-portal',
    });

    expect(response.status).toBe(200);
    expect(portal?.get('uid')).toBe('skip-template-portal');
    expect(portal?.get('routePath')).toBe('/skip-template-portal');
    await expect(access(portalDir)).rejects.toThrow();
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('should skip preparing the storage portal directory when requested by multiPortals:firstOrCreate', async () => {
    process.env.APP_PUBLIC_PATH = '/console/';
    app = await createMultiPortalAclMockServer();
    await app.db.sync();
    spawnMock.mockClear();

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const response = await rootAgent.resource('multiPortals').firstOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: 'first-or-create-skip-template-portal',
        title: 'First or create skip template portal',
        developmentMode: 'ai',
        routeName: 'first-or-create-skip-template-portal',
        routePath: '/first-or-create-skip-template-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        skipCreatePortalDirectory: true,
      },
    });

    const appName = app.name || 'main';
    const portalDir = path.join(storagePath as string, 'portals', appName, 'first-or-create-skip-template-portal');
    const portal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: 'first-or-create-skip-template-portal',
    });

    expect(response.status).toBe(200);
    expect(portal?.get('uid')).toBe('first-or-create-skip-template-portal');
    expect(portal?.get('routePath')).toBe('/first-or-create-skip-template-portal');
    await expect(access(portalDir)).rejects.toThrow();
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('should not update existing multi-portal values during firstOrCreate', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const repository = app.db.getRepository('multiPortals');
    await repository.create({
      values: {
        uid: 'preserve-title-portal',
        title: 'Custom portal title',
        developmentMode: 'no-code',
        routeName: 'preserve-title-portal',
        routePath: '/preserve-title-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'fill-empty-title-portal',
        title: '',
        developmentMode: 'no-code',
        routeName: 'fill-empty-title-portal',
        routePath: '/fill-empty-title-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const preservedResponse = await rootAgent.resource('multiPortals').firstOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: 'preserve-title-portal',
        title: 'Generated portal title',
        developmentMode: 'no-code',
        routeName: 'preserve-title-portal',
        routePath: '/preserve-title-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const emptyTitleResponse = await rootAgent.resource('multiPortals').firstOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: 'fill-empty-title-portal',
        title: 'Filled portal title',
        developmentMode: 'no-code',
        routeName: 'fill-empty-title-portal',
        routePath: '/fill-empty-title-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const preservedPortal = await repository.findOne({ filterByTk: 'preserve-title-portal' });
    const filledPortal = await repository.findOne({ filterByTk: 'fill-empty-title-portal' });

    expect(preservedResponse.status).toBe(200);
    expect(emptyTitleResponse.status).toBe(200);
    expect(preservedPortal?.get('title')).toBe('Custom portal title');
    expect(filledPortal?.get('title')).toBe('');
  });

  it('should deploy uploaded portal dist into storage without writing a portal manifest', async () => {
    process.env.APP_PUBLIC_PATH = '/console/';
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const archivePath = await createPortalDistArchive(
      storagePath as string,
      {
        'index.html': '<div id="root"></div>',
        'assets/index.js': 'console.log("portal");\n',
      },
      {
        assets: 0o700,
        'index.html': 0o600,
        'assets/index.js': 0o600,
      },
    );
    const portalDir = path.join(storagePath as string, 'portals', 'main', 'customer');
    await mkdir(path.join(portalDir, '.dist-upload-stale'), { recursive: true });
    await mkdir(path.join(portalDir, '.dist-backup-stale'), { recursive: true });
    await chmod(path.join(storagePath as string, 'portals'), 0o700);
    await chmod(path.join(storagePath as string, 'portals', 'main'), 0o700);
    await chmod(portalDir, 0o700);
    const response = await app
      .agent()
      .resource('multiPortals')
      .deploy({
        values: {
          app: 'main',
          portal: 'customer',
          basePath: '/console/x/customer/',
        },
        file: archivePath,
      });
    const data = response.body.data as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        status: 'ok',
        app: 'main',
        portal: 'customer',
        basePath: '/console/x/customer/',
        distPath: path.join('portals', 'main', 'customer', 'dist'),
      }),
    );
    await expect(
      readFile(path.join(storagePath as string, 'portals', 'main', 'customer', 'dist', 'index.html'), 'utf-8'),
    ).resolves.toBe('<div id="root"></div>');
    await expect(
      readFile(path.join(storagePath as string, 'portals', 'main', 'customer', 'dist', 'assets', 'index.js'), 'utf-8'),
    ).resolves.toBe('console.log("portal");\n');
    expect((await stat(path.join(storagePath as string, 'portals'))).mode & 0o777).toBe(0o755);
    expect((await stat(path.join(storagePath as string, 'portals', 'main'))).mode & 0o777).toBe(0o755);
    expect((await stat(portalDir)).mode & 0o777).toBe(0o755);
    expect((await stat(path.join(portalDir, 'dist'))).mode & 0o777).toBe(0o755);
    expect((await stat(path.join(portalDir, 'dist', 'assets'))).mode & 0o777).toBe(0o755);
    expect((await stat(path.join(portalDir, 'dist', 'index.html'))).mode & 0o777).toBe(0o644);
    expect((await stat(path.join(portalDir, 'dist', 'assets', 'index.js'))).mode & 0o777).toBe(0o644);
    await expect(readdir(portalDir)).resolves.not.toEqual(
      expect.arrayContaining(['.dist-upload-stale', '.dist-backup-stale']),
    );
    await expect(access(path.join(storagePath as string, 'portals', 'portal-manifest.json'))).rejects.toThrow();
  });

  it('should reject portal dist deploy when basePath does not match the app and portal', async () => {
    process.env.APP_PUBLIC_PATH = '/console/';
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const archivePath = await createPortalDistArchive(storagePath as string, {
      'index.html': '<div id="root"></div>',
    });
    const response = await app
      .agent()
      .resource('multiPortals')
      .deploy({
        values: {
          app: 'main',
          portal: 'customer',
          basePath: '/console/x/apps/crm/customer/',
        },
        file: archivePath,
      });

    expect(response.status).toBe(400);
    await expect(
      access(path.join(storagePath as string, 'portals', 'main', 'customer', 'dist', 'index.html')),
    ).rejects.toThrow();
  });

  it('should reject portal dist deploy without an uploaded file', async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const response = await app
      .agent()
      .resource('multiPortals')
      .deploy({
        values: {
          app: 'main',
          portal: 'customer',
          basePath: '/x/customer/',
        },
      });

    expect(response.status).toBe(400);
  });

  it('should expose newly created portal through app getPortals immediately', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const createResponse = await rootAgent.resource('multiPortals').create({
      values: {
        uid: 'manifest-api-portal',
        title: 'Manifest API portal',
        icon: 'appstoreoutlined',
        routeName: 'manifest-api-portal',
        routePath: '/ignored-access-path',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const portalsResponse = await rootAgent.get('/app:getPortals');

    expect(createResponse.status).toBe(200);
    expect(portalsResponse.status).toBe(200);
    expect(portalsResponse.body.data.portals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uid: 'manifest-api-portal',
          appName: app.name,
          title: 'Manifest API portal',
          routePath: '/manifest-api-portal',
          layout: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
        }),
      ]),
    );
  });

  it('should reject portal route names that conflict with UI layouts', async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const agent = app.agent();
    const repository = app.db.getRepository('multiPortals');
    const createResponse = await agent.resource('multiPortals').create({
      values: {
        uid: 'conflicting-admin-portal',
        title: 'Conflicting admin portal',
        routeName: DEFAULT_ADMIN_UI_LAYOUT.routeName,
        routePath: '/conflicting-admin-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    expect(createResponse.status).toBe(400);
    expect(await repository.findOne({ filterByTk: 'conflicting-admin-portal' })).toBeNull();

    await repository.create({
      values: {
        uid: 'valid-route-name-portal',
        title: 'Valid route name portal',
        routeName: 'validRouteNamePortal',
        routePath: '/valid-route-name-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const updateResponse = await agent.resource('multiPortals').update({
      filterByTk: 'valid-route-name-portal',
      values: {
        routeName: DEFAULT_MOBILE_UI_LAYOUT.routeName,
      },
    });
    const persistedPortal = await repository.findOne({
      filterByTk: 'valid-route-name-portal',
    });

    expect(updateResponse.status).toBe(400);
    expect(persistedPortal?.get('routeName')).toBe('validRouteNamePortal');
  });

  it('should relate desktop routes to multi-portals explicitly', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const desktopRoutesCollection = app.db.getCollection('desktopRoutes');
    expect(desktopRoutesCollection.getField('multiPortals')?.options).toMatchObject({
      type: 'belongsToMany',
      target: 'multiPortals',
      through: 'desktopRoutesMultiPortals',
      sourceKey: 'id',
      targetKey: 'uid',
      foreignKey: 'desktopRouteId',
      otherKey: 'multiPortalUid',
    });

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'desktop-route-relation-portal',
        title: 'Desktop route relation portal',
        routeName: 'desktopRouteRelationPortal',
        routePath: '/desktop-route-relation-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const otherPortal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'desktop-route-relation-other-portal',
        title: 'Desktop route relation other portal',
        routeName: 'desktopRouteRelationOtherPortal',
        routePath: '/desktop-route-relation-other-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-MULTI-PORTAL-ROUTE-RELATION',
        schemaUid: 'multi-portal-route-relation',
        hidden: false,
        sort: 10,
      },
    });
    const findRoutesByPortal = async (portalUid: string) =>
      app.db.getRepository('desktopRoutes').find({
        filter: {
          'multiPortals.uid': portalUid,
        },
        appends: ['multiPortals'],
      });

    expect(await findRoutesByPortal(portal.get('uid'))).toEqual([]);

    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });

    const portalRoutes = await findRoutesByPortal(portal.get('uid'));
    const otherPortalRoutes = await findRoutesByPortal(otherPortal.get('uid'));

    expect(portalRoutes.map((item) => item.get('title'))).toEqual(['DATA-MULTI-PORTAL-ROUTE-RELATION']);
    expect(portalRoutes[0].get('multiPortals').map((item) => item.get('uid'))).toEqual([
      'desktop-route-relation-portal',
    ]);
    expect(otherPortalRoutes).toEqual([]);
  });

  it('should define role multi-portal permission relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    expect(app.db.getCollection('roles').getField('allowNewMultiPortal')).toBeDefined();

    const collection = app.db.getCollection('rolesMultiPortals');
    expect(collection).toBeTruthy();
    expect(collection.getField('role')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('multiPortal')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'multiPortals',
      targetKey: 'uid',
      foreignKey: 'multiPortalUid',
      onDelete: 'CASCADE',
    });
    expect(app.db.getCollection('roles').getField('multiPortals')?.options).toMatchObject({
      type: 'belongsToMany',
      target: 'multiPortals',
      through: 'rolesMultiPortals',
      sourceKey: 'name',
      targetKey: 'uid',
      foreignKey: 'roleName',
      otherKey: 'multiPortalUid',
    });
  });

  it('should persist the role-level default multi-portal access flag', async () => {
    app = await createMultiPortalAclMockServer();

    await app.db.getRepository('roles').create({
      values: {
        name: 'portal-default-access-role',
        allowNewMultiPortal: false,
      },
    });

    await app.db.getRepository('roles').update({
      filterByTk: 'portal-default-access-role',
      values: {
        allowNewMultiPortal: true,
      },
    });

    const role = await app.db.getRepository('roles').findOne({
      filterByTk: 'portal-default-access-role',
    });

    expect(role?.get('allowNewMultiPortal')).toBe(true);
  });

  it('should allow new multi-portals by default for initialized built-in roles', async () => {
    app = await createMultiPortalAclMockServer();

    const roles = await app.db.getRepository('roles').find({
      filter: {
        name: ['admin', 'member'],
      },
      sort: ['name'],
    });

    expect(roles.map((role) => [role.get('name'), role.get('allowNewMultiPortal')])).toEqual([
      ['admin', true],
      ['member', true],
    ]);
  });

  it('should grant new enabled multi-portals by the role default portal access policy', async () => {
    app = await createMultiPortalAclMockServer();

    await app.db.getRepository('roles').create({
      values: {
        name: 'new-portal-default-allowed',
        allowNewMultiPortal: true,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'new-portal-default-denied',
        allowNewMultiPortal: false,
      },
    });

    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'default-policy-new-portal',
        title: 'Default policy new portal',
        routeName: 'defaultPolicyNewPortal',
        routePath: '/default-policy-new-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const portalAccessRecords = await app.db.getRepository('rolesMultiPortals').find({
      filter: {
        roleName: ['new-portal-default-allowed', 'new-portal-default-denied'],
      },
      sort: ['roleName', 'multiPortalUid'],
    });
    const portalAccessKeys = portalAccessRecords.map(
      (record) => `${record.get('roleName')}:${record.get('multiPortalUid')}`,
    );

    expect(portalAccessKeys).toEqual(['new-portal-default-allowed:default-policy-new-portal']);

    const routePolicyRecords = await app.db.getRepository('rolesMultiPortalRoutePolicies').find({
      filter: {
        roleName: ['new-portal-default-allowed', 'new-portal-default-denied'],
      },
      sort: ['roleName', 'multiPortalUid'],
    });
    const routePolicyValues = routePolicyRecords.map((record) => [
      `${record.get('roleName')}:${record.get('multiPortalUid')}`,
      record.get('allowNewMenu'),
    ]);

    expect(routePolicyValues).toEqual([['new-portal-default-allowed:default-policy-new-portal', true]]);
  });

  it('should initialize route default policies for built-in roles when granting new multi-portals', async () => {
    app = await createMultiPortalAclMockServer();

    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'built-in-default-policy-portal',
        title: 'Built-in default policy portal',
        routeName: 'builtInDefaultPolicyPortal',
        routePath: '/built-in-default-policy-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const routePolicyRecords = await app.db.getRepository('rolesMultiPortalRoutePolicies').find({
      filter: {
        roleName: ['admin', 'member'],
        multiPortalUid: 'built-in-default-policy-portal',
      },
      sort: ['roleName', 'multiPortalUid'],
    });
    const routePolicyValues = routePolicyRecords.map((record) => [
      record.get('roleName'),
      record.get('multiPortalUid'),
      record.get('allowNewMenu'),
    ]);

    expect(routePolicyValues).toEqual([
      ['admin', 'built-in-default-policy-portal', true],
      ['member', 'built-in-default-policy-portal', true],
    ]);
  });

  it('should define role multi-portal desktop route permission relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const collection = app.db.getCollection('rolesMultiPortalDesktopRoutes');
    expect(collection).toBeTruthy();
    expect(collection.getField('role')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('multiPortal')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'multiPortals',
      targetKey: 'uid',
      foreignKey: 'multiPortalUid',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('desktopRoute')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'desktopRoutes',
      targetKey: 'id',
      foreignKey: 'desktopRouteId',
      onDelete: 'CASCADE',
    });
  });

  it('should define role multi-portal route default policy relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const collection = app.db.getCollection('rolesMultiPortalRoutePolicies');
    expect(collection).toBeTruthy();
    expect(collection.options.autoGenId).toBe(false);
    expect(collection.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unique: true,
          fields: ['roleName', 'multiPortalUid'],
        }),
      ]),
    );
    expect(collection.getField('role')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('multiPortal')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'multiPortals',
      targetKey: 'uid',
      foreignKey: 'multiPortalUid',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('allowNewMenu')?.options).toMatchObject({
      type: 'boolean',
      defaultValue: false,
    });
  });

  it('should expose portal route permission targets through role configuration reader', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'route-target-portal',
        title: 'Route target portal',
        routeName: 'routeTargetPortal',
        routePath: '/route-target-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-ROUTE-TARGET',
        schemaUid: 'portal-route-target',
        hidden: false,
        sort: 10,
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'portal-route-target-role-manager',
        snippets: ['pm.acl.roles'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const agent = await app.agent().login(user);

    const response = await agent.get('/desktopRoutes:listRolePermissionTargets').query({
      portal: portal.get('uid'),
      filter: {
        id: -1,
      },
      fields: ['id'],
      appends: ['uiLayouts'],
    });

    expect(response.status).toBe(200);
    expect((response.body.data as Array<Record<string, unknown>>).map((item) => item.title)).toEqual([
      'DATA-PORTAL-ROUTE-TARGET',
    ]);
    for (const item of response.body.data as Array<Record<string, unknown>>) {
      expect(Object.keys(item).sort()).toEqual(['children', 'hidden', 'id', 'options', 'parentId', 'title'].sort());
      expect(item).not.toHaveProperty('uiLayouts');
    }
  });

  it('should serve accessible desktop routes through an explicit portal scope', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'explicit-scope-portal',
        title: 'Explicit scope portal',
        routeName: 'explicitScopePortal',
        routePath: '/explicit-scope-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const portalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-EXPLICIT-SCOPE-ROUTE',
        schemaUid: 'portal-explicit-scope-route',
        hidden: false,
        sort: 10,
      },
    });
    const uiLayoutRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-UI-LAYOUT-EXPLICIT-SCOPE-ROUTE',
        schemaUid: 'ui-layout-explicit-scope-route',
        hidden: false,
        sort: 20,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'explicit-scope-portal-role',
        snippets: ['pm.acl.roles'],
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', portalRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', uiLayoutRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        desktopRouteId: portalRoute.get('id'),
      },
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const memberAgent = await app.agent().login(memberUser);
    const [listResponse, getResponse, targetsResponse, ambiguousScopeResponse] = await Promise.all([
      memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: portalRoute.get('id'),
        portal: portal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:listRolePermissionTargets').query({
        portal: portal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        portal: portal.get('uid'),
      }),
    ]);

    expect(listResponse.status).toBe(200);
    expect(getResponse.status).toBe(200);
    expect(targetsResponse.status).toBe(200);
    expect(ambiguousScopeResponse.status).toBe(400);
    expect(collectRouteTitles(listResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-EXPLICIT-SCOPE-ROUTE',
    ]);
    expect(getResponse.body.data.title).toBe('DATA-PORTAL-EXPLICIT-SCOPE-ROUTE');
    expect(collectRouteTitles(targetsResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-EXPLICIT-SCOPE-ROUTE',
    ]);
  });

  it('should not treat layout parameters as multi-portal scopes', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'customer-portal-layout-param',
        title: 'Customer portal layout param',
        routeName: 'customerPortalLayoutParam',
        routePath: '/customer-portal-layout-param',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const portalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-LAYOUT-PARAM-ROUTE',
        schemaUid: 'portal-layout-param-route',
        hidden: false,
        sort: 10,
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', portalRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const [
      layoutListResponse,
      layoutGetResponse,
      layoutTargetsResponse,
      layoutCreateResponse,
      layoutUpdateOrCreateResponse,
    ] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({
        layout: portal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: portalRoute.get('id'),
        layout: portal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:listRolePermissionTargets').query({
        layout: portal.get('uid'),
      }),
      rootAgent.resource('desktopRoutes').create({
        layout: portal.get('uid'),
        values: {
          type: 'flowPage',
          title: 'layout portal param created page',
          schemaUid: 'layout-portal-param-created-page',
        },
      }),
      rootAgent.resource('desktopRoutes').updateOrCreate({
        layout: portal.get('uid'),
        filterKeys: ['schemaUid'],
        values: {
          type: 'flowPage',
          title: 'layout portal param upserted page',
          schemaUid: 'layout-portal-param-upserted-page',
        },
      }),
    ]);
    const rejectedLayoutRouteCount = await app.db.getRepository('desktopRoutes').count({
      filter: {
        schemaUid: ['layout-portal-param-created-page', 'layout-portal-param-upserted-page'],
      },
    });
    const [portalListResponse, portalGetResponse, portalTargetsResponse] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: portalRoute.get('id'),
        portal: portal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:listRolePermissionTargets').query({
        portal: portal.get('uid'),
      }),
    ]);
    const portalCreateResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'explicit portal created page',
        schemaUid: 'explicit-portal-created-page',
      },
    });
    const portalUpdateOrCreateResponse = await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: portal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'flowPage',
        title: 'explicit portal upserted page',
        schemaUid: 'explicit-portal-upserted-page',
      },
    });
    const [portalCreatedRoute, portalUpsertedRoute] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: portalCreateResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filter: {
          schemaUid: 'explicit-portal-upserted-page',
        },
        appends: ['multiPortals', 'uiLayouts'],
      }),
    ]);

    expect(layoutListResponse.status).toBe(200);
    expect(layoutListResponse.body.data).toEqual([]);
    expect(layoutGetResponse.status).toBe(204);
    expect(layoutGetResponse.body.data ?? null).toBeNull();
    expect(layoutTargetsResponse.status).toBe(200);
    expect(layoutTargetsResponse.body.data).toEqual([]);
    expect(layoutCreateResponse.status).toBe(400);
    expect(layoutUpdateOrCreateResponse.status).toBe(400);
    expect(rejectedLayoutRouteCount).toBe(0);
    expect(portalListResponse.status).toBe(200);
    expect(portalGetResponse.status).toBe(200);
    expect(portalTargetsResponse.status).toBe(200);
    expect(collectRouteTitles(portalListResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-LAYOUT-PARAM-ROUTE',
    ]);
    expect(portalGetResponse.body.data.title).toBe('DATA-PORTAL-LAYOUT-PARAM-ROUTE');
    expect(collectRouteTitles(portalTargetsResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-LAYOUT-PARAM-ROUTE',
    ]);
    expect(portalCreateResponse.status).toBe(200);
    expect(portalUpdateOrCreateResponse.status).toBe(200);
    expect(portalCreatedRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalCreatedRoute?.get('uiLayouts')).toEqual([]);
    expect(portalUpsertedRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalUpsertedRoute?.get('uiLayouts')).toEqual([]);
  });

  it('should reject invalid portal scopes without falling back to the default layout', async () => {
    app = await createMultiPortalAclMockServer();

    const disabledPortal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'disabled-scope-portal',
        title: 'Disabled scope portal',
        routeName: 'disabledScopePortal',
        routePath: '/disabled-scope-portal',
        authCheck: true,
        enabled: false,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-INVALID-PORTAL-FALLBACK-ADMIN-ROUTE',
        schemaUid: 'invalid-portal-fallback-admin-route',
        hidden: false,
        sort: 10,
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const [
      missingListResponse,
      missingGetResponse,
      missingTargetsResponse,
      missingCreateResponse,
      missingUpdateOrCreateResponse,
    ] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({
        portal: 'missing-portal',
      }),
      rootAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: adminRoute.get('id'),
        portal: 'missing-portal',
      }),
      rootAgent.get('/desktopRoutes:listRolePermissionTargets').query({
        portal: 'missing-portal',
      }),
      rootAgent.resource('desktopRoutes').create({
        portal: 'missing-portal',
        values: {
          type: 'flowPage',
          title: 'invalid portal created page',
          schemaUid: 'invalid-portal-created-page',
        },
      }),
      rootAgent.resource('desktopRoutes').updateOrCreate({
        portal: 'missing-portal',
        filterKeys: ['schemaUid'],
        values: {
          type: 'flowPage',
          title: 'invalid portal upserted page',
          schemaUid: 'invalid-portal-upserted-page',
        },
      }),
    ]);
    const [
      disabledListResponse,
      disabledGetResponse,
      disabledTargetsResponse,
      disabledCreateResponse,
      disabledUpdateOrCreateResponse,
    ] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({
        portal: disabledPortal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: adminRoute.get('id'),
        portal: disabledPortal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:listRolePermissionTargets').query({
        portal: disabledPortal.get('uid'),
      }),
      rootAgent.resource('desktopRoutes').create({
        portal: disabledPortal.get('uid'),
        values: {
          type: 'flowPage',
          title: 'disabled portal created page',
          schemaUid: 'disabled-portal-created-page',
        },
      }),
      rootAgent.resource('desktopRoutes').updateOrCreate({
        portal: disabledPortal.get('uid'),
        filterKeys: ['schemaUid'],
        values: {
          type: 'flowPage',
          title: 'disabled portal upserted page',
          schemaUid: 'disabled-portal-upserted-page',
        },
      }),
    ]);
    const createdRouteCount = await app.db.getRepository('desktopRoutes').count({
      filter: {
        schemaUid: [
          'invalid-portal-created-page',
          'invalid-portal-upserted-page',
          'disabled-portal-created-page',
          'disabled-portal-upserted-page',
        ],
      },
    });

    expect(missingListResponse.status).toBe(200);
    expect(missingListResponse.body.data).toEqual([]);
    expect(missingGetResponse.status).toBe(204);
    expect(missingGetResponse.body.data ?? null).toBeNull();
    expect(missingTargetsResponse.status).toBe(200);
    expect(missingTargetsResponse.body.data).toEqual([]);
    expect(missingCreateResponse.status).toBe(400);
    expect(missingUpdateOrCreateResponse.status).toBe(400);
    expect(disabledListResponse.status).toBe(200);
    expect(disabledListResponse.body.data).toEqual([]);
    expect(disabledGetResponse.status).toBe(204);
    expect(disabledGetResponse.body.data ?? null).toBeNull();
    expect(disabledTargetsResponse.status).toBe(200);
    expect(disabledTargetsResponse.body.data).toEqual([]);
    expect(disabledCreateResponse.status).toBe(400);
    expect(disabledUpdateOrCreateResponse.status).toBe(400);
    expect(createdRouteCount).toBe(0);
  });

  it('should not let portal uids shadow ui layout route scopes', async () => {
    app = await createMultiPortalAclMockServer();

    await app.db.getRepository('multiPortals').create({
      values: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        title: 'Shadow admin layout portal',
        routeName: 'shadowAdminLayoutPortal',
        routePath: '/shadow-admin-layout-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-SHADOWED-ADMIN-LAYOUT-ROUTE',
        schemaUid: 'shadowed-admin-layout-route',
        hidden: false,
        sort: 10,
      },
    });
    const portalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-SHADOWED-PORTAL-ROUTE',
        schemaUid: 'shadowed-portal-route',
        hidden: false,
        sort: 20,
      },
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', adminRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', portalRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const [layoutResponse, portalResponse] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      rootAgent.get('/desktopRoutes:listAccessible').query({
        portal: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
    ]);

    expect(layoutResponse.status).toBe(200);
    expect(portalResponse.status).toBe(200);
    expect(collectRouteTitles(layoutResponse.body.data as RouteResponseItem[])).toContain(
      'DATA-SHADOWED-ADMIN-LAYOUT-ROUTE',
    );
    expect(collectRouteTitles(layoutResponse.body.data as RouteResponseItem[])).not.toContain(
      'DATA-SHADOWED-PORTAL-ROUTE',
    );
    expect(collectRouteTitles(portalResponse.body.data as RouteResponseItem[])).toEqual(['DATA-SHADOWED-PORTAL-ROUTE']);
  });

  it('should keep portal-only and dual-owned desktop route scopes distinct', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'route-owner-portal',
        title: 'Route owner portal',
        routeName: 'routeOwnerPortal',
        routePath: '/route-owner-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const mobileLayout = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const dualOwnedCreateResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'dual owned page',
        schemaUid: 'dual-owned-page',
        uiLayouts: [mobileLayout?.get('uid')],
        children: [
          {
            type: 'tabs',
            title: 'dual owned tabs',
            schemaUid: 'dual-owned-tabs',
            hidden: true,
            uiLayouts: [mobileLayout?.get('uid')],
          },
        ],
      },
    });
    const portalOnlyCreateResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'portal only page',
        schemaUid: 'portal-only-page',
      },
    });
    const layoutCreateResponse = await rootAgent.resource('desktopRoutes').create({
      layout: mobileLayout?.get('uid'),
      values: {
        type: 'flowPage',
        title: 'layout owned page',
        schemaUid: 'layout-owned-page',
        children: [
          {
            type: 'tabs',
            title: 'layout owned tabs',
            schemaUid: 'layout-owned-tabs',
            hidden: true,
          },
        ],
      },
    });
    const portalUpsertResponse = await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: portal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'tabs',
        title: 'portal dual owned upsert tab',
        schemaUid: 'portal-dual-owned-upsert-tab',
        uiLayouts: [mobileLayout?.get('uid')],
      },
    });
    const crossScopeLayoutResponse = await rootAgent.resource('desktopRoutes').create({
      layout: mobileLayout?.get('uid'),
      values: {
        type: 'flowPage',
        title: 'cross scope page',
        schemaUid: 'cross-scope-page',
      },
    });
    const crossScopePortalResponse = await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: portal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'flowPage',
        title: 'cross scope portal page',
        schemaUid: 'cross-scope-page',
      },
    });
    const [mobileLayoutListResponse, portalListResponse] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({
        layout: mobileLayout?.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      }),
    ]);

    expect(dualOwnedCreateResponse.status).toBe(200);
    expect(portalOnlyCreateResponse.status).toBe(200);
    expect(layoutCreateResponse.status).toBe(200);
    expect(portalUpsertResponse.status).toBe(200);
    expect(crossScopeLayoutResponse.status).toBe(200);
    expect(crossScopePortalResponse.status).toBe(200);
    expect(mobileLayoutListResponse.status).toBe(200);
    expect(portalListResponse.status).toBe(200);

    const [dualOwnedRoute, portalOnlyRoute, layoutRoute, upsertRoute, crossScopeRoute] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: dualOwnedCreateResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts', 'children.multiPortals', 'children.uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: portalOnlyCreateResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts', 'children.multiPortals', 'children.uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: layoutCreateResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts', 'children.multiPortals', 'children.uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filter: {
          schemaUid: 'portal-dual-owned-upsert-tab',
        },
        appends: ['multiPortals', 'uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filter: {
          schemaUid: 'cross-scope-page',
        },
        appends: ['multiPortals', 'uiLayouts'],
      }),
    ]);
    const dualOwnedChildRoute = dualOwnedRoute?.get('children')?.[0];
    const layoutChildRoute = layoutRoute?.get('children')?.[0];
    const mobileLayoutRouteTitles = collectRouteTitles(mobileLayoutListResponse.body.data as RouteResponseItem[]);
    const portalRouteTitles = collectRouteTitles(portalListResponse.body.data as RouteResponseItem[]);

    expect(dualOwnedRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(dualOwnedRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(dualOwnedChildRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(dualOwnedChildRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(portalOnlyRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalOnlyRoute?.get('uiLayouts')).toEqual([]);
    expect(upsertRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(upsertRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(crossScopeRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(crossScopeRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(layoutRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(layoutRoute?.get('multiPortals')).toEqual([]);
    expect(layoutChildRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(layoutChildRoute?.get('multiPortals')).toEqual([]);
    expect(mobileLayoutRouteTitles).toEqual(expect.arrayContaining(['dual owned page', 'layout owned page']));
    expect(mobileLayoutRouteTitles).not.toContain('portal only page');
    expect(mobileLayoutRouteTitles).toContain('cross scope portal page');
    expect(portalRouteTitles).toEqual(
      expect.arrayContaining(['dual owned page', 'portal only page', 'cross scope portal page']),
    );
    expect(portalRouteTitles).not.toContain('layout owned page');
  });

  it('should create portal-scoped link routes without leaking into the default layout', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'portal-link-route-owner',
        title: 'Portal link route owner',
        routeName: 'portalLinkRouteOwner',
        routePath: '/portal-link-route-owner',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const mobileLayout = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const portalOnlyLinkResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'link',
        title: 'portal only docs link',
        options: {
          href: '/docs',
          params: {
            q: 'portal',
          },
        },
      },
    });
    const portalOnlyGroupResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'group',
        title: 'portal only link group',
        children: [
          {
            type: 'link',
            title: 'portal only child docs link',
            options: {
              href: '/docs/child',
            },
          },
        ],
      },
    });
    const dualOwnedLinkResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'link',
        title: 'dual owned docs link',
        options: {
          href: '/mobile-docs',
        },
        uiLayouts: [mobileLayout?.get('uid')],
      },
    });
    const portalOnlyUpsertResponse = await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: portal.get('uid'),
      filterKeys: ['title'],
      values: {
        type: 'link',
        title: 'portal only upsert docs link',
        options: {
          href: '/docs/upsert',
          params: {
            source: 'portal',
          },
        },
      },
    });

    expect(portalOnlyLinkResponse.status).toBe(200);
    expect(portalOnlyGroupResponse.status).toBe(200);
    expect(dualOwnedLinkResponse.status).toBe(200);
    expect(portalOnlyUpsertResponse.status).toBe(200);

    const [portalOnlyLink, portalOnlyGroup, dualOwnedLink, portalOnlyUpsert] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: portalOnlyLinkResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: portalOnlyGroupResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts', 'children.multiPortals', 'children.uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: dualOwnedLinkResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filter: {
          title: 'portal only upsert docs link',
        },
        appends: ['multiPortals', 'uiLayouts'],
      }),
    ]);
    const portalOnlyChildLink = portalOnlyGroup?.get('children')?.[0];
    const [adminLayoutListResponse, mobileLayoutListResponse, portalListResponse] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      rootAgent.get('/desktopRoutes:listAccessible').query({
        layout: mobileLayout?.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      }),
    ]);
    const adminLayoutRouteTitles = collectRouteTitles(adminLayoutListResponse.body.data as RouteResponseItem[]);
    const mobileLayoutRouteTitles = collectRouteTitles(mobileLayoutListResponse.body.data as RouteResponseItem[]);
    const portalRouteTitles = collectRouteTitles(portalListResponse.body.data as RouteResponseItem[]);

    expect(portalOnlyLink?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalOnlyLink?.get('uiLayouts')).toEqual([]);
    expect(portalOnlyGroup?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalOnlyGroup?.get('uiLayouts')).toEqual([]);
    expect(portalOnlyChildLink?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalOnlyChildLink?.get('uiLayouts')).toEqual([]);
    expect(dualOwnedLink?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(dualOwnedLink?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(portalOnlyUpsert?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalOnlyUpsert?.get('uiLayouts')).toEqual([]);
    expect(adminLayoutRouteTitles).not.toEqual(
      expect.arrayContaining(['portal only docs link', 'portal only link group', 'portal only upsert docs link']),
    );
    expect(mobileLayoutRouteTitles).toContain('dual owned docs link');
    expect(mobileLayoutRouteTitles).not.toContain('portal only docs link');
    expect(portalRouteTitles).toEqual(
      expect.arrayContaining([
        'portal only docs link',
        'portal only link group',
        'portal only child docs link',
        'dual owned docs link',
        'portal only upsert docs link',
      ]),
    );
  });

  it('should grant new portal routes by the portal route default policy', async () => {
    app = await createMultiPortalAclMockServer();

    const portalRepository = app.db.getRepository('multiPortals');
    const firstPortal = await portalRepository.create({
      values: {
        uid: 'route-default-policy-first-portal',
        title: 'Route default policy first portal',
        routeName: 'routeDefaultPolicyFirstPortal',
        routePath: '/route-default-policy-first-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const secondPortal = await portalRepository.create({
      values: {
        uid: 'route-default-policy-second-portal',
        title: 'Route default policy second portal',
        routeName: 'routeDefaultPolicySecondPortal',
        routePath: '/route-default-policy-second-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const allowedRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-allowed-role',
      },
    });
    const deniedRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-denied-role',
      },
    });
    const missingPolicyRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-missing-role',
      },
    });
    const otherPortalRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-other-portal-role',
      },
    });
    const portalAccessRepository = app.db.getRepository('rolesMultiPortals');
    for (const roleName of [allowedRole, deniedRole, missingPolicyRole].map((role) => role.get('name'))) {
      await portalAccessRepository.create({
        values: {
          roleName,
          multiPortalUid: firstPortal.get('uid'),
        },
      });
    }
    await portalAccessRepository.create({
      values: {
        roleName: otherPortalRole.get('name'),
        multiPortalUid: secondPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: allowedRole.get('name'),
        multiPortalUid: firstPortal.get('uid'),
        allowNewMenu: true,
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: deniedRole.get('name'),
        multiPortalUid: firstPortal.get('uid'),
        allowNewMenu: false,
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: otherPortalRole.get('name'),
        multiPortalUid: secondPortal.get('uid'),
        allowNewMenu: true,
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const createResponse = await rootAgent.resource('desktopRoutes').create({
      portal: firstPortal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'route default policy created page',
        schemaUid: 'route-default-policy-created-page',
      },
    });
    const upsertResponse = await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: firstPortal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'flowPage',
        title: 'route default policy upserted page',
        schemaUid: 'route-default-policy-upserted-page',
      },
    });
    await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: firstPortal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'flowPage',
        title: 'route default policy upserted page renamed',
        schemaUid: 'route-default-policy-upserted-page',
      },
    });

    expect(createResponse.status).toBe(200);
    expect(upsertResponse.status).toBe(200);

    const upsertRoute = await app.db.getRepository('desktopRoutes').findOne({
      filter: {
        schemaUid: 'route-default-policy-upserted-page',
      },
    });
    const routePermissions = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        desktopRouteId: [createResponse.body.data.id, upsertRoute?.get('id')],
        roleName: [
          allowedRole.get('name'),
          deniedRole.get('name'),
          missingPolicyRole.get('name'),
          otherPortalRole.get('name'),
        ],
      },
      sort: ['desktopRouteId', 'roleName', 'multiPortalUid'],
    });
    const permissionKeys = routePermissions.map((permission) => [
      permission.get('desktopRouteId'),
      permission.get('roleName'),
      permission.get('multiPortalUid'),
    ]);

    expect(permissionKeys).toEqual([
      [createResponse.body.data.id, allowedRole.get('name'), firstPortal.get('uid')],
      [upsertRoute?.get('id'), allowedRole.get('name'), firstPortal.get('uid')],
    ]);
  });

  it('should keep default route grants isolated between ui layouts and portals', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'default-grant-isolation-portal',
        title: 'Default grant isolation portal',
        routeName: 'defaultGrantIsolationPortal',
        routePath: '/default-grant-isolation-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'default-grant-isolation-role',
        allowNewMenu: true,
      },
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        allowNewMenu: true,
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const portalRouteResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'default grant isolation portal page',
        schemaUid: 'default-grant-isolation-portal-page',
      },
    });
    const layoutRouteResponse = await rootAgent.resource('desktopRoutes').create({
      layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      values: {
        type: 'flowPage',
        title: 'default grant isolation layout page',
        schemaUid: 'default-grant-isolation-layout-page',
      },
    });
    const portalRouteId = portalRouteResponse.body.data.id;
    const layoutRouteId = layoutRouteResponse.body.data.id;

    const layoutRoutePermissions = await app.db.getRepository('rolesDesktopRoutes').find({
      filter: {
        roleName: role.get('name'),
        desktopRouteId: [portalRouteId, layoutRouteId],
      },
      sort: ['desktopRouteId'],
    });
    const portalRoutePermissions = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        roleName: role.get('name'),
        desktopRouteId: [portalRouteId, layoutRouteId],
      },
      sort: ['desktopRouteId', 'multiPortalUid'],
    });

    expect(
      layoutRoutePermissions.map((permission) => [permission.get('desktopRouteId'), permission.get('roleName')]),
    ).toEqual([[layoutRouteId, role.get('name')]]);
    expect(
      portalRoutePermissions.map((permission) => [permission.get('desktopRouteId'), permission.get('multiPortalUid')]),
    ).toEqual([[portalRouteId, portal.get('uid')]]);
  });

  it('should enforce role portal access before listing portal routes', async () => {
    app = await createMultiPortalAclMockServer();

    const repository = app.db.getRepository('multiPortals');
    const allowedPortal = await repository.create({
      values: {
        uid: 'allowed-permission-portal',
        title: 'Allowed permission portal',
        routeName: 'allowedPermissionPortal',
        routePath: '/allowed-permission-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const deniedPortal = await repository.create({
      values: {
        uid: 'denied-permission-portal',
        title: 'Denied permission portal',
        routeName: 'deniedPermissionPortal',
        routePath: '/denied-permission-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-PERMISSION-ROUTE',
        schemaUid: 'portal-permission-route',
        hidden: false,
        sort: 10,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-permission-member',
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [allowedPortal.get('uid'), deniedPortal.get('uid')],
    });
    await app.db.getRepository('rolesDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        desktopRouteId: route.get('id'),
      },
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: allowedPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: allowedPortal.get('uid'),
        desktopRouteId: route.get('id'),
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const memberAgent = await app.agent().login(memberUser);

    const [allowedListResponse, deniedListResponse, allowedGetResponse, deniedGetResponse, rootDeniedListResponse] =
      await Promise.all([
        memberAgent.get('/desktopRoutes:listAccessible').query({
          portal: allowedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:listAccessible').query({
          portal: deniedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: route.get('id'),
          portal: allowedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: route.get('id'),
          portal: deniedPortal.get('uid'),
        }),
        rootAgent.get('/desktopRoutes:listAccessible').query({
          portal: deniedPortal.get('uid'),
        }),
      ]);

    expect(allowedListResponse.status).toBe(200);
    expect(deniedListResponse.status).toBe(200);
    expect(allowedGetResponse.status).toBe(200);
    expect([200, 204]).toContain(deniedGetResponse.status);
    expect(rootDeniedListResponse.status).toBe(200);
    expect(allowedListResponse.body.data.map((item) => item.title)).toEqual(['DATA-PORTAL-PERMISSION-ROUTE']);
    expect(deniedListResponse.body.data).toEqual([]);
    expect(allowedGetResponse.body.data.title).toBe('DATA-PORTAL-PERMISSION-ROUTE');
    expect(deniedGetResponse.body.data ?? null).toBeNull();
    expect(rootDeniedListResponse.body.data.map((item) => item.title)).toContain('DATA-PORTAL-PERMISSION-ROUTE');
  });

  it('should deny portal routes without role portal access even when route permissions exist', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'route-permission-without-portal-access',
        title: 'Route permission without portal access',
        routeName: 'routePermissionWithoutPortalAccess',
        routePath: '/route-permission-without-portal-access',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-NO-PORTAL-ACCESS-ROUTE',
        schemaUid: 'portal-no-portal-access-route',
        hidden: false,
        sort: 10,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-route-only-member',
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        desktopRouteId: route.get('id'),
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        allowNewMenu: true,
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const memberAgent = await app.agent().login(memberUser);

    const [memberListResponse, memberGetResponse, rootListResponse, rootGetResponse] = await Promise.all([
      memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        portal: portal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      }),
      rootAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        portal: portal.get('uid'),
      }),
    ]);

    expect(memberListResponse.status).toBe(200);
    expect([200, 204]).toContain(memberGetResponse.status);
    expect(rootListResponse.status).toBe(200);
    expect(rootGetResponse.status).toBe(200);
    expect(memberListResponse.body.data).toEqual([]);
    expect(memberGetResponse.body.data ?? null).toBeNull();
    expect(rootListResponse.body.data.map((item) => item.title)).toEqual(['DATA-PORTAL-NO-PORTAL-ACCESS-ROUTE']);
    expect(rootGetResponse.body.data.title).toBe('DATA-PORTAL-NO-PORTAL-ACCESS-ROUTE');
  });

  it('should scope route access to the requested portal when portals share one ui layout', async () => {
    app = await createMultiPortalAclMockServer();

    const repository = app.db.getRepository('multiPortals');
    const firstPortal = await repository.create({
      values: {
        uid: 'first-shared-layout-portal',
        title: 'First shared layout portal',
        routeName: 'firstSharedLayoutPortal',
        routePath: '/first-shared-layout-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const secondPortal = await repository.create({
      values: {
        uid: 'second-shared-layout-portal',
        title: 'Second shared layout portal',
        routeName: 'secondSharedLayoutPortal',
        routePath: '/second-shared-layout-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-SCOPED-ROUTE',
        schemaUid: 'portal-scoped-route',
        hidden: false,
        sort: 10,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-route-permission-member',
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [firstPortal.get('uid'), secondPortal.get('uid')],
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: firstPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: secondPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: firstPortal.get('uid'),
        desktopRouteId: route.get('id'),
      },
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const memberAgent = await app.agent().login(memberUser);

    const [firstListResponse, secondListResponse, firstGetResponse, secondGetResponse] = await Promise.all([
      memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: firstPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: secondPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        portal: firstPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        portal: secondPortal.get('uid'),
      }),
    ]);

    expect(firstListResponse.status).toBe(200);
    expect(secondListResponse.status).toBe(200);
    expect(firstGetResponse.status).toBe(200);
    expect([200, 204]).toContain(secondGetResponse.status);
    expect(firstListResponse.body.data.map((item) => item.title)).toEqual(['DATA-PORTAL-SCOPED-ROUTE']);
    expect(secondListResponse.body.data).toEqual([]);
    expect(firstGetResponse.body.data.title).toBe('DATA-PORTAL-SCOPED-ROUTE');
    expect(secondGetResponse.body.data ?? null).toBeNull();
  });

  it('should keep ui layout route permissions and multi-portal route permissions isolated', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'permission-isolation-portal',
        title: 'Permission isolation portal',
        routeName: 'permissionIsolationPortal',
        routePath: '/permission-isolation-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const uiLayoutRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-UI-LAYOUT-ISOLATED-ROUTE',
        schemaUid: 'ui-layout-isolated-route',
        hidden: false,
        sort: 10,
      },
    });
    const firstPortalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-ISOLATED-ROUTE-1',
        schemaUid: 'portal-isolated-route-1',
        hidden: false,
        sort: 20,
      },
    });
    const secondPortalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-ISOLATED-ROUTE-2',
        schemaUid: 'portal-isolated-route-2',
        hidden: false,
        sort: 30,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'permission-isolation-member',
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', uiLayoutRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
    });
    for (const route of [firstPortalRoute, secondPortalRoute]) {
      await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
        tk: [portal.get('uid')],
      });
    }
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        desktopRouteId: firstPortalRoute.get('id'),
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const memberAgent = await app.agent().login(memberUser);
    const roleName = role.get('name');
    const portalUid = portal.get('uid');

    await rootAgent.resource('roles.desktopRoutes', roleName).add({
      values: [uiLayoutRoute.get('id')],
    });

    const portalPermissionsAfterUiLayoutChange = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        roleName,
        multiPortalUid: portalUid,
      },
      sort: ['desktopRouteId'],
    });
    expect(portalPermissionsAfterUiLayoutChange.map((record) => record.get('desktopRouteId'))).toEqual([
      firstPortalRoute.get('id'),
    ]);

    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName,
        multiPortalUid: portalUid,
        desktopRouteId: secondPortalRoute.get('id'),
      },
    });

    const uiLayoutPermissionsAfterPortalChange = await app.db.getRepository('rolesDesktopRoutes').find({
      filter: {
        roleName,
      },
      sort: ['desktopRouteId'],
    });
    expect(uiLayoutPermissionsAfterPortalChange.map((record) => record.get('desktopRouteId'))).toEqual([
      uiLayoutRoute.get('id'),
    ]);

    const [uiLayoutListResponse, portalListResponse, uiLayoutPortalRouteGetResponse, portalUiLayoutRouteGetResponse] =
      await Promise.all([
        memberAgent.get('/desktopRoutes:listAccessible').query({
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        }),
        memberAgent.get('/desktopRoutes:listAccessible').query({
          portal: portalUid,
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: firstPortalRoute.get('id'),
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: uiLayoutRoute.get('id'),
          portal: portalUid,
        }),
      ]);

    expect(uiLayoutListResponse.status).toBe(200);
    expect(portalListResponse.status).toBe(200);
    expect([200, 204]).toContain(uiLayoutPortalRouteGetResponse.status);
    expect([200, 204]).toContain(portalUiLayoutRouteGetResponse.status);
    expect(collectRouteTitles(uiLayoutListResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-UI-LAYOUT-ISOLATED-ROUTE',
    ]);
    expect(collectRouteTitles(portalListResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-ISOLATED-ROUTE-1',
      'DATA-PORTAL-ISOLATED-ROUTE-2',
    ]);
    expect(uiLayoutPortalRouteGetResponse.body.data ?? null).toBeNull();
    expect(portalUiLayoutRouteGetResponse.body.data ?? null).toBeNull();
  });

  it('should enforce explicit route parent chain inside portal permissions', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'explicit-parent-chain-portal',
        title: 'Explicit parent chain portal',
        routeName: 'explicitParentChainPortal',
        routePath: '/explicit-parent-chain-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const parentRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-PARENT-ROUTE',
        schemaUid: 'portal-parent-route',
        hidden: false,
        sort: 10,
      },
    });
    const childRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-CHILD-ROUTE',
        schemaUid: 'portal-child-route',
        parentId: parentRoute.get('id'),
        hidden: false,
        sort: 20,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-parent-chain-member',
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', parentRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', childRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberAgent = await app.agent().login(memberUser);
    const rootAgent = await app.agent().login(rootUser);
    const routePermissionsRepository = app.db.getRepository('rolesMultiPortalDesktopRoutes');

    const resetRoutePermissions = async (desktopRouteIds: unknown[]) => {
      await routePermissionsRepository.destroy({
        filter: {
          roleName: role.get('name'),
          multiPortalUid: portal.get('uid'),
        },
      });

      for (const desktopRouteId of desktopRouteIds) {
        await routePermissionsRepository.create({
          values: {
            roleName: role.get('name'),
            multiPortalUid: portal.get('uid'),
            desktopRouteId,
          },
        });
      }
    };
    const listAccessibleRouteTitles = async () => {
      const response = await memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      });

      expect(response.status).toBe(200);
      return collectRouteTitles(response.body.data as RouteResponseItem[]);
    };

    await resetRoutePermissions([childRoute.get('id')]);
    const childOnlyChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      portal: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual([]);
    expect(childOnlyChildGetResponse.body.data ?? null).toBeNull();

    await resetRoutePermissions([parentRoute.get('id')]);
    const parentOnlyParentGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: parentRoute.get('id'),
      portal: portal.get('uid'),
    });
    const parentOnlyChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      portal: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual(['DATA-PORTAL-PARENT-ROUTE']);
    expect(parentOnlyParentGetResponse.body.data.title).toBe('DATA-PORTAL-PARENT-ROUTE');
    expect(parentOnlyChildGetResponse.body.data ?? null).toBeNull();

    await resetRoutePermissions([parentRoute.get('id'), childRoute.get('id')]);
    const parentAndChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      portal: portal.get('uid'),
    });
    const rootListResponse = await rootAgent.get('/desktopRoutes:listAccessible').query({
      portal: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual(['DATA-PORTAL-PARENT-ROUTE', 'DATA-PORTAL-CHILD-ROUTE']);
    expect(parentAndChildGetResponse.body.data.title).toBe('DATA-PORTAL-CHILD-ROUTE');
    expect(rootListResponse.status).toBe(200);
    expect(collectRouteTitles(rootListResponse.body.data as RouteResponseItem[])).toContain('DATA-PORTAL-PARENT-ROUTE');
    expect(collectRouteTitles(rootListResponse.body.data as RouteResponseItem[])).toContain('DATA-PORTAL-CHILD-ROUTE');
  });

  it('should expose enabled portal manifests for runtime registration', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'disabled-backing-layout',
        title: 'Disabled backing layout',
        layoutType: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
        routeName: 'disabledBackingLayout',
        routePath: '/disabled-backing-layout',
        authCheck: true,
        enabled: false,
      },
    });
    const repository = app.db.getRepository('multiPortals');
    await repository.create({
      values: {
        uid: 'desktop-runtime-portal',
        title: 'Desktop runtime portal',
        icon: 'desktopoutlined',
        developmentMode: 'no-code',
        routeName: 'desktopRuntimePortal',
        routePath: '/desktop-runtime-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'mobile-runtime-portal',
        title: 'Mobile runtime portal',
        icon: 'mobileoutlined',
        developmentMode: 'ai',
        routeName: 'mobileRuntimePortal',
        routePath: '/mobile-runtime-portal',
        authCheck: false,
        enabled: true,
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'disabled-runtime-portal',
        title: 'Disabled runtime portal',
        routeName: 'disabledRuntimePortal',
        routePath: '/disabled-runtime-portal',
        authCheck: true,
        enabled: false,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'disabled-layout-runtime-portal',
        title: 'Disabled layout runtime portal',
        routeName: 'disabledLayoutRuntimePortal',
        routePath: '/disabled-layout-runtime-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'disabled-backing-layout',
      },
    });

    const response = await app
      .agent()
      .get('/multiPortals:listEnabled')
      .query({
        filter: {
          enabled: false,
        },
        fields: ['uid'],
        appends: ['uiLayout.routeName'],
        sort: '-uid',
        page: 1,
        pageSize: 1,
      });
    const portals = response.body.data as Array<Record<string, unknown>>;

    expect(response.status).toBe(200);
    expect(portals.map((portal) => portal.uid)).toEqual(['desktop-runtime-portal', 'mobile-runtime-portal']);
    for (const portal of portals) {
      expect(portal.enabled).toBe(true);
      expect(Object.keys(portal).sort()).toEqual([...MULTI_PORTAL_RUNTIME_FIELDS].sort());
      expect(portal).not.toHaveProperty('icon');
      expect(Object.keys(portal.uiLayout as Record<string, unknown>).sort()).toEqual(['layoutType']);
    }
    expect(portals[0]).toMatchObject({
      title: 'Desktop runtime portal',
      developmentMode: 'no-code',
      routeName: 'desktopRuntimePortal',
      routePath: '/desktop-runtime-portal',
      uiLayout: {
        layoutType: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
      },
    });
    expect(portals[1]).toMatchObject({
      title: 'Mobile runtime portal',
      developmentMode: 'ai',
      routeName: 'mobileRuntimePortal',
      routePath: '/mobile-runtime-portal',
      authCheck: false,
      uiLayout: {
        layoutType: DEFAULT_MOBILE_UI_LAYOUT.layoutType,
      },
    });
  });

  it('should expose accessible portal manifests for logged-in roles only', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: 'allow-use-union',
      },
    });
    await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'accessible-disabled-backing-layout',
        title: 'Accessible disabled backing layout',
        layoutType: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
        routeName: 'accessibleDisabledBackingLayout',
        routePath: '/accessible-disabled-backing-layout',
        authCheck: true,
        enabled: false,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'portal-access-role-a',
        allowNewMultiPortal: false,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'portal-access-role-b',
        allowNewMultiPortal: false,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'portal-access-role-empty',
        allowNewMultiPortal: false,
      },
    });

    const repository = app.db.getRepository('multiPortals');
    await repository.create({
      values: {
        uid: 'accessible-alpha-portal',
        title: 'Accessible alpha portal',
        icon: 'appstoreoutlined',
        routeName: 'accessibleAlphaPortal',
        routePath: '/accessible-alpha-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'accessible-beta-portal',
        title: 'Accessible beta portal',
        icon: null,
        developmentMode: 'ai',
        routeName: 'accessibleBetaPortal',
        routePath: '/accessible-beta-portal',
        authCheck: false,
        enabled: true,
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'accessible-gamma-portal',
        title: 'Accessible gamma portal',
        icon: 'globaloutlined',
        routeName: 'accessibleGammaPortal',
        routePath: '/accessible-gamma-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'accessible-disabled-portal',
        title: 'Accessible disabled portal',
        icon: 'stopoutlined',
        routeName: 'accessibleDisabledPortal',
        routePath: '/accessible-disabled-portal',
        authCheck: true,
        enabled: false,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'accessible-disabled-layout-portal',
        title: 'Accessible disabled layout portal',
        icon: 'layoutoutlined',
        routeName: 'accessibleDisabledLayoutPortal',
        routePath: '/accessible-disabled-layout-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'accessible-disabled-backing-layout',
      },
    });
    const portalAccessRepository = app.db.getRepository('rolesMultiPortals');
    await portalAccessRepository.create({
      values: {
        roleName: 'portal-access-role-a',
        multiPortalUid: 'accessible-alpha-portal',
      },
    });
    await portalAccessRepository.create({
      values: {
        roleName: 'portal-access-role-a',
        multiPortalUid: 'accessible-disabled-portal',
      },
    });
    await portalAccessRepository.create({
      values: {
        roleName: 'portal-access-role-a',
        multiPortalUid: 'accessible-disabled-layout-portal',
      },
    });
    await portalAccessRepository.create({
      values: {
        roleName: 'portal-access-role-b',
        multiPortalUid: 'accessible-alpha-portal',
      },
    });
    await portalAccessRepository.create({
      values: {
        roleName: 'portal-access-role-b',
        multiPortalUid: 'accessible-beta-portal',
      },
    });

    const roleAUser = await app.db.getRepository('users').create({
      values: {
        roles: ['portal-access-role-a'],
      },
    });
    const unionUser = await app.db.getRepository('users').create({
      values: {
        roles: ['portal-access-role-a', 'portal-access-role-b'],
      },
    });
    const noAccessUser = await app.db.getRepository('users').create({
      values: {
        roles: ['portal-access-role-empty'],
      },
    });
    const roleAAgent = await app.agent().login(roleAUser, 'portal-access-role-a');
    const unionAgent = await app.agent().login(unionUser, '__union__');
    const noAccessAgent = await app.agent().login(noAccessUser, 'portal-access-role-empty');

    const unauthenticatedResponse = await app.agent().get('/multiPortals:listAccessible');
    const rootResponse = await rootAgent.get('/multiPortals:listAccessible').query({
      filter: {
        enabled: false,
      },
      fields: ['uid'],
      appends: ['uiLayout.routeName'],
      sort: '-uid',
      page: 1,
      pageSize: 1,
    });
    const roleAResponse = await roleAAgent.get('/multiPortals:listAccessible');
    const unionResponse = await unionAgent.get('/multiPortals:listAccessible');
    const noAccessResponse = await noAccessAgent.get('/multiPortals:listAccessible');
    const rootPortals = rootResponse.body.data as Array<Record<string, unknown>>;
    const roleAPortals = roleAResponse.body.data as Array<Record<string, unknown>>;
    const unionPortals = unionResponse.body.data as Array<Record<string, unknown>>;
    const noAccessPortals = noAccessResponse.body.data as Array<Record<string, unknown>>;

    expect(unauthenticatedResponse.status).toBe(401);
    expect(rootResponse.status).toBe(200);
    expect(roleAResponse.status).toBe(200);
    expect(unionResponse.status).toBe(200);
    expect(noAccessResponse.status).toBe(200);
    expect(rootPortals.map((portal) => portal.uid)).toEqual([
      'accessible-alpha-portal',
      'accessible-beta-portal',
      'accessible-gamma-portal',
    ]);
    expect(roleAPortals.map((portal) => portal.uid)).toEqual(['accessible-alpha-portal']);
    expect(unionPortals.map((portal) => portal.uid)).toEqual(['accessible-alpha-portal', 'accessible-beta-portal']);
    expect(noAccessPortals).toEqual([]);
    for (const portal of [...rootPortals, ...roleAPortals, ...unionPortals]) {
      expect(portal.enabled).toBe(true);
      expect(Object.keys(portal).sort()).toEqual([...MULTI_PORTAL_ACCESSIBLE_FIELDS].sort());
      expect(Object.keys(portal.uiLayout as Record<string, unknown>).sort()).toEqual(['layoutType']);
    }
    expect(rootPortals[0]).toMatchObject({
      uid: 'accessible-alpha-portal',
      icon: 'appstoreoutlined',
      uiLayout: {
        layoutType: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
      },
    });
    expect(rootPortals[1]).toMatchObject({
      uid: 'accessible-beta-portal',
      icon: null,
      developmentMode: 'ai',
      authCheck: false,
      uiLayout: {
        layoutType: DEFAULT_MOBILE_UI_LAYOUT.layoutType,
      },
    });
  });

  it('should register the pm.multi-portal ACL snippet with management actions only', async () => {
    app = await createMultiPortalAclMockServer();

    const snippet = app.acl.snippetManager.snippets.get('pm.multi-portal');
    const roleSnippet = app.acl.snippetManager.snippets.get('pm.acl.roles');

    expect(snippet).toBeDefined();
    expect(snippet?.actions.sort()).toEqual([...MULTI_PORTAL_MANAGEMENT_ACTIONS].sort());
    expect(snippet?.actions).not.toContain('multiPortals:listEnabled');
    expect(snippet?.actions).not.toContain('multiPortals:listAccessible');
    expect(snippet?.actions).not.toContain('rolesMultiPortalRoutePolicies:*');
    expect(roleSnippet).toBeDefined();
    expect(roleSnippet?.actions).toEqual(expect.arrayContaining(ROLE_MULTI_PORTAL_PERMISSION_ACTIONS));
  });

  it('should keep multiPortals management actions behind plugin configuration snippets', async () => {
    app = await createMultiPortalAclMockServer();

    const repository = app.db.getRepository('multiPortals');
    const deniedPortal = await repository.create({
      values: {
        uid: 'management-denied-portal',
        title: 'Management denied portal',
        routeName: 'managementDeniedPortal',
        routePath: '/management-denied-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-no-snippet',
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-pm-all',
        snippets: ['pm.*'],
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-negated',
        snippets: ['pm.*', '!pm.multi-portal'],
      },
    });
    const noSnippetUser = await app.db.getRepository('users').create({
      values: {
        roles: ['multi-portal-no-snippet'],
      },
    });
    const pmAllUser = await app.db.getRepository('users').create({
      values: {
        roles: ['multi-portal-pm-all'],
      },
    });
    const negatedUser = await app.db.getRepository('users').create({
      values: {
        roles: ['multi-portal-negated'],
      },
    });
    const noSnippetAgent = await app.agent().login(noSnippetUser);
    const pmAllAgent = await app.agent().login(pmAllUser);
    const negatedAgent = await app.agent().login(negatedUser);

    const noSnippetResponses = [
      await noSnippetAgent.resource('multiPortals').list(),
      await noSnippetAgent.resource('multiPortals').get({
        filterByTk: deniedPortal.get('uid'),
      }),
      await noSnippetAgent.resource('multiPortals').getLog({
        filterByTk: deniedPortal.get('uid'),
      }),
      await noSnippetAgent.resource('multiPortals').create({
        values: {
          uid: 'management-no-snippet-portal',
          title: 'Management no snippet portal',
          routeName: 'management-no-snippet-portal',
          routePath: '/management-no-snippet-portal',
          authCheck: true,
          enabled: true,
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      }),
      await noSnippetAgent.resource('multiPortals').update({
        filterByTk: deniedPortal.get('uid'),
        values: {
          title: 'Management no snippet portal updated',
        },
      }),
      await noSnippetAgent.resource('multiPortals').firstOrCreate({
        filterKeys: ['uid'],
        values: {
          uid: 'management-no-snippet-first-or-create-portal',
          title: 'Management no snippet first or create portal',
          routeName: 'management-no-snippet-first-or-create-portal',
          routePath: '/management-no-snippet-first-or-create-portal',
          authCheck: true,
          enabled: true,
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      }),
      await noSnippetAgent.resource('multiPortals').destroy({
        filterByTk: deniedPortal.get('uid'),
      }),
    ];

    expect(noSnippetResponses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403, 403, 403]);

    const createResponse = await pmAllAgent.resource('multiPortals').create({
      values: {
        uid: 'management-allowed-portal',
        title: 'Management allowed portal',
        routeName: 'management-allowed-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    expect(createResponse.status).toBe(200);
    const createdPortalUid = createResponse.body.data.uid;
    const managementResponses = [
      await pmAllAgent.resource('multiPortals').list(),
      await pmAllAgent.resource('multiPortals').get({
        filterByTk: createdPortalUid,
      }),
      createResponse,
      await pmAllAgent.resource('multiPortals').update({
        filterByTk: createdPortalUid,
        values: {
          title: 'Management allowed portal updated',
        },
      }),
      await pmAllAgent.resource('multiPortals').firstOrCreate({
        filterKeys: ['uid'],
        values: {
          uid: 'management-allowed-first-or-create-portal',
          title: 'Management allowed first or create portal',
          routeName: 'management-allowed-first-or-create-portal',
          routePath: '/management-allowed-first-or-create-portal',
          authCheck: true,
          enabled: true,
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      }),
      await pmAllAgent.resource('multiPortals').destroy({
        filterByTk: createdPortalUid,
      }),
    ];

    expect(managementResponses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200, 200]);

    const negatedResponses = await Promise.all([
      negatedAgent.resource('multiPortals').list(),
      negatedAgent.resource('multiPortals').get({
        filterByTk: deniedPortal.get('uid'),
      }),
      negatedAgent.resource('multiPortals').getLog({
        filterByTk: deniedPortal.get('uid'),
      }),
      negatedAgent.resource('multiPortals').create({
        values: {
          uid: 'management-negated-portal',
          title: 'Management negated portal',
          routeName: 'management-negated-portal',
          routePath: '/management-negated-portal',
          authCheck: true,
          enabled: true,
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      }),
      negatedAgent.resource('multiPortals').update({
        filterByTk: deniedPortal.get('uid'),
        values: {
          title: 'Management denied portal updated',
        },
      }),
      negatedAgent.resource('multiPortals').firstOrCreate({
        filterKeys: ['uid'],
        values: {
          uid: 'management-negated-first-or-create-portal',
          title: 'Management negated first or create portal',
          routeName: 'management-negated-first-or-create-portal',
          routePath: '/management-negated-first-or-create-portal',
          authCheck: true,
          enabled: true,
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      }),
      negatedAgent.resource('multiPortals').destroy({
        filterByTk: deniedPortal.get('uid'),
      }),
    ]);

    expect(negatedResponses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403, 403, 403]);
  });
});

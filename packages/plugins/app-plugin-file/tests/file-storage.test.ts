// @vitest-environment node
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { createDriveManager, type AppDriveConfig } from '@nocobase/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ServerFileRepositoryManager } from '../server/repository.js';
import { defineFileRepositoryApiRoutes } from '../server/routes.js';
import { storageRoutes } from '../server/storage-routes.js';
import { describeDisks, runCheck } from '../server/storage.js';
import { serverFileRepositoryManagerToken } from '../server/token.js';
import { FileUsageRegistry } from '../server/usages.js';

const SECRET = 'TOP-SECRET-ACCESS-KEY-9f2c';
const KEY_ID = 'AKIA-FAKE-KEY-ID-1234';

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const fn of cleanup.splice(0).reverse()) await fn();
});

/** The default template's two disks, with credentials filled in so a leak would be visible. */
function templateDrive(root: string): AppDriveConfig {
  return {
    default: 'local',
    disks: {
      local: {
        driver: 'fs',
        location: path.join(root, 'storage'),
        visibility: 'private',
      },
      s3: {
        driver: 's3',
        bucket: '',
        region: 'us-east-1',
        endpoint: `https://user:${SECRET}@minio.example.test:9000/path`,
        credentials: { accessKeyId: KEY_ID, secretAccessKey: SECRET },
        visibility: 'private',
      },
    },
  };
}

async function createFileTable(db: DatabaseManager, name: string) {
  await db.builder().createCollection(name, (collection) => {
    collection.uuid('id').primary().notNull();
    collection.string('disk', { length: 255 }).notNull();
    collection.text('key').notNull();
    collection.text('filename').notNull();
    collection.string('ext', { length: 32 }).notNull();
    collection.string('mimeType', { length: 255 }).notNull();
    collection.bigInt('size').notNull();
    collection.datetime('createdAt').notNull();
    collection.datetime('updatedAt').notNull();
  });
}

async function fixture(
  options: {
    authenticated?: boolean;
    page?: boolean;
    check?: boolean;
    drive?: (root: string) => AppDriveConfig;
    config?: Record<string, unknown>;
  } = {},
) {
  const root = await mkdtemp(path.join(tmpdir(), 'file-storage-'));
  cleanup.push(() => rm(root, { recursive: true, force: true }));
  const testDatabase = await createTestDatabase();
  cleanup.push(() => testDatabase.destroy());
  const db = testDatabase.database;
  const drive = (options.drive ?? templateDrive)(root);
  // What the application's Drive provider does: an S3 disk without a bucket is never loaded.
  const loaded: AppDriveConfig = {
    ...drive,
    disks: Object.fromEntries(
      Object.entries(drive.disks).filter(
        ([, disk]) =>
          typeof disk === 'function' || disk.driver !== 's3' || disk.bucket,
      ),
    ),
  };
  const values: Record<string, unknown> = { drive, ...options.config };
  const config = {
    get: <T>(key: string): T | undefined =>
      key
        .split('.')
        .reduce<unknown>(
          (value, segment) =>
            value && typeof value === 'object'
              ? (value as Record<string, unknown>)[segment]
              : undefined,
          values,
        ) as T | undefined,
    layers: () => ({
      defaults: { drive },
      overrides: { drive: { disks: { local: { maxFileSizeMb: 50 } } } },
    }),
  };
  const container = new ServiceContainer();
  // Created on first use, as the application does; it throws when the default disk is one that was dropped.
  container.singleton(driveManagerToken, () => createDriveManager(loaded));
  const manager = new ServerFileRepositoryManager(
    db,
    () => container.resolve(driveManagerToken),
    config,
  );
  container.instance(serverFileRepositoryManagerToken, manager);
  const can = vi.fn(async ({ resource }: { resource: { type: string } }) =>
    resource.type === 'page' ? (options.page ?? true) : (options.check ?? true),
  );
  container.instance(authenticationToken, {
    required: () => async (context, next) => {
      if (options.authenticated === false)
        return context.json({ error: 'Authentication required.' }, 401);
      await next();
    },
  } as unknown as Auth);
  container.instance(authorizationToken, {
    middleware: () => async (context, next) => {
      context.set('authz', { can });
      await next();
    },
  } as unknown as Authorization);
  const router = await storageRoutes.createRouter({
    appName: 'test',
    publicBasePath: '',
    paths: { rootDir: root } as never,
    config,
    router: new Hono(),
    container,
  } as unknown as AppPluginApplication);
  return { root, db, manager, router, can };
}

async function json(response: Response): Promise<any> {
  return response.json();
}

describe('file usages', () => {
  it('resolves fixed, default and configured disks against the configuration', () => {
    const registry = new FileUsageRegistry();
    registry.register({
      id: 'a',
      title: 'A',
      collection: 'a',
      disk: { name: 'archive' },
      download: 'public',
    });
    registry.register({
      id: 'b',
      title: 'B',
      collection: 'b',
      disk: { default: true },
      download: 'authenticated',
    });
    registry.register({
      id: 'c',
      title: 'C',
      collection: 'c',
      disk: { config: 'knowledge.disk' },
      download: 'authenticated',
    });
    const values: Record<string, unknown> = {
      drive: { default: 's3' },
      'knowledge.disk': undefined,
    };
    const config = { get: <T>(key: string) => values[key] as T };
    expect(
      registry.describe(config).map(({ id, disk, followsDefault }) => ({
        id,
        disk,
        followsDefault,
      })),
    ).toEqual([
      { id: 'a', disk: 'archive', followsDefault: false },
      { id: 'b', disk: 's3', followsDefault: true },
      { id: 'c', disk: 's3', followsDefault: true },
    ]);
    values['knowledge.disk'] = 'archive';
    expect(registry.describe(config)[2]).toMatchObject({
      disk: 'archive',
      diskSource: 'config',
      configPath: 'knowledge.disk',
      followsDefault: false,
    });
  });

  it('keeps one registration per id and refuses an id that names another Collection', () => {
    const registry = new FileUsageRegistry();
    const usage = {
      id: 'x',
      title: 'X',
      collection: 'x',
      disk: { default: true },
      download: 'public',
    } as const;
    registry.register(usage);
    registry.register(usage);
    expect(registry.list()).toHaveLength(1);
    expect(() => registry.register({ ...usage, collection: 'y' })).toThrow(
      /already registered/,
    );
    expect(() =>
      registry.register({ ...usage, id: 'z', download: 'open' as never }),
    ).toThrow(/download/);
  });

  it('registers every exposure of defineFileRepositoryApiRoutes as a public link', async () => {
    const { manager, db } = await fixture();
    await createFileTable(db, 'avatars');
    const container = new ServiceContainer();
    container.instance(serverFileRepositoryManagerToken, manager);
    container.instance(databaseManagerToken, db);
    for (const contribution of defineFileRepositoryApiRoutes({
      repositories: [
        {
          name: 'avatars',
          disk: 'local',
          policy: { read: true, create: false, update: false, delete: false },
          actions: { findMany: {} },
        },
      ],
    }))
      await contribution.createRouter({ container, publicBasePath: '' });
    expect(manager.describeUsages()).toEqual([
      expect.objectContaining({
        id: 'avatars',
        collection: 'avatars',
        disk: 'local',
        diskSource: 'name',
        download: 'public',
      }),
    ]);
  });
});

describe('describeDisks', () => {
  it('summarizes the default template: local is the default, s3 is incomplete, nothing secret or absolute', () => {
    const root = '/srv/apps/acme';
    const drive = templateDrive(root);
    const disks = describeDisks({
      drive,
      layers: {
        defaults: { drive },
        overrides: { drive: { disks: { local: { maxFileSizeMb: 50 } } } },
      },
      rootDir: root,
      loaded: ['local'],
    });
    expect(disks).toEqual([
      expect.objectContaining({
        name: 'local',
        driver: 'fs',
        isDefault: true,
        complete: true,
        location: expect.objectContaining({
          path: 'storage/',
          outsideApp: false,
        }),
        visibility: 'private',
        urls: 'application',
        sources: {
          driver: 'code',
          location: 'code',
          visibility: 'code',
          maxFileSizeMb: 'config',
        },
      }),
      expect.objectContaining({
        name: 's3',
        driver: 's3',
        isDefault: false,
        complete: false,
        problems: ['BUCKET_MISSING'],
        location: expect.objectContaining({
          bucket: null,
          region: 'us-east-1',
          endpointHost: 'minio.example.test:9000',
        }),
        maxFileSizeMb: 20,
        sources: expect.objectContaining({ maxFileSizeMb: 'default' }),
      }),
    ]);
    const text = JSON.stringify(disks);
    for (const forbidden of [SECRET, KEY_ID, root, 'user:'])
      expect(text).not.toContain(forbidden);
  });

  it('only flags a local directory outside the application directory', () => {
    const [disk] = describeDisks({
      drive: {
        default: 'local',
        disks: {
          local: {
            driver: 'fs',
            location: '/var/lib/files',
            visibility: 'public',
          },
        },
      },
      rootDir: '/srv/apps/acme',
      loaded: ['local'],
    });
    expect(disk.location).toMatchObject({ path: null, outsideApp: true });
    expect(JSON.stringify(disk)).not.toContain('/var/lib');
  });
});

describe('file storage routes', () => {
  it('requires sign-in and the file storage page grant', async () => {
    const anonymous = await fixture({ authenticated: false });
    expect((await anonymous.router.request('/file/storage')).status).toBe(401);
    const denied = await fixture({ page: false });
    for (const [method, url] of [
      ['GET', '/file/storage'],
      ['POST', '/file/disks/local/check'],
    ]) {
      const response = await denied.router.request(url, { method });
      expect(response.status).toBe(403);
      expect((await json(response)).error).toMatchObject({
        reason: 'FILE_STORAGE_ACCESS_REQUIRED',
        domain: 'file',
      });
    }
    expect(denied.can).toHaveBeenCalledWith({
      resource: { type: 'page', id: 'file-storage' },
      action: 'access',
    });
  });

  it('lists disks and features with their counts, and leaves out credentials and absolute paths', async () => {
    const { router, manager, db, root } = await fixture({
      config: { knowledge: {} },
    });
    await createFileTable(db, 'kbFiles');
    const now = new Date();
    await db.repository('kbFiles').createMany({
      values: [100, 250].map((size, index) => ({
        id: `00000000-0000-4000-8000-00000000000${index}`,
        disk: 'local',
        key: `objects/${index}`,
        filename: `${index}.txt`,
        ext: 'txt',
        mimeType: 'text/plain',
        size,
        createdAt: now,
        updatedAt: now,
      })),
    });
    manager.registerUsage({
      id: 'knowledge.files',
      title: { key: 'fileUsage', ns: '@nocobase/app-plugin-knowledge' },
      plugin: '@nocobase/app-plugin-knowledge',
      collection: 'kbFiles',
      disk: { config: 'knowledge.disk' },
      download: 'authenticated',
    });
    // A feature whose table is missing fails its own row only.
    manager.registerUsage({
      id: 'broken',
      title: 'Broken',
      collection: 'missingTable',
      disk: { default: true },
      download: 'authenticated',
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await router.request('/file/storage');
    expect(response.status).toBe(200);
    const text = await response.text();
    for (const forbidden of [SECRET, KEY_ID, root, 'user:'])
      expect(text).not.toContain(forbidden);
    const { data } = JSON.parse(text);
    expect(data.defaultDisk).toBe('local');
    expect(data.canCheck).toBe(true);
    expect(
      data.disks.map((disk: any) => [disk.name, disk.isDefault, disk.complete]),
    ).toEqual([
      ['local', true, true],
      ['s3', false, false],
    ]);
    expect(data.usages).toEqual([
      expect.objectContaining({
        id: 'knowledge.files',
        disk: 'local',
        diskSource: 'config',
        configPath: 'knowledge.disk',
        followsDefault: true,
        download: 'authenticated',
        stats: { files: 2, bytes: 350 },
      }),
      expect.objectContaining({ id: 'broken', stats: null }),
    ]);
  });

  it('answers with an empty feature list when nothing stores files', async () => {
    const { router } = await fixture();
    const { data } = await json(await router.request('/file/storage'));
    expect(data.usages).toEqual([]);
    expect(data.disks).toHaveLength(2);
  });

  it('checks the local disk in four steps and leaves no file behind', async () => {
    const { router, root } = await fixture();
    const response = await router.request('/file/disks/local/check', {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    const { data } = await json(response);
    expect(data).toMatchObject({ disk: 'local', ok: true });
    expect(data.steps.map((step: any) => [step.step, step.status])).toEqual([
      ['write', 'passed'],
      ['read', 'passed'],
      ['url', 'passed'],
      ['delete', 'passed'],
    ]);
    expect(data.steps[0].detail).toMatch(/^nocobase-check\/[0-9a-f-]+\.txt$/);
    expect(data.steps[2].detail).toBe('APPLICATION');
    // The directory was written to, and holds nothing afterwards.
    expect(await readdir(path.join(root, 'storage', 'nocobase-check'))).toEqual(
      [],
    );
    // The result is shown on the list until the instance restarts.
    const list = await json(await router.request('/file/storage'));
    expect(list.data.disks[0].lastCheck).toMatchObject({ ok: true });
    expect(list.data.disks[1].lastCheck).toBeNull();
  });

  it('still lists disks and answers CONFIG_INCOMPLETE when the default disk is an S3 disk without a bucket', async () => {
    const { router, manager } = await fixture({
      drive: (root) => ({ ...templateDrive(root), default: 's3' }),
    });
    // Declaring a usage does not need Drive, which cannot be created now.
    manager.registerUsage({
      id: 'x',
      title: 'X',
      collection: 'missingTable',
      disk: { default: true },
      download: 'authenticated',
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const list = await router.request('/file/storage');
    expect(list.status).toBe(200);
    const { data } = await json(list);
    expect(data.defaultDisk).toBe('s3');
    expect(
      data.disks.map((disk: any) => [disk.name, disk.isDefault, disk.problems]),
    ).toEqual([
      ['local', false, ['NOT_LOADED']],
      ['s3', true, ['BUCKET_MISSING']],
    ]);
    expect(data.usages).toEqual([
      expect.objectContaining({ id: 'x', disk: 's3' }),
    ]);
    const check = await router.request('/file/disks/s3/check', {
      method: 'POST',
    });
    expect(check.status).toBe(200);
    expect((await json(check)).data.steps[0]).toMatchObject({
      status: 'failed',
      reason: 'CONFIG_INCOMPLETE',
      detail: 'BUCKET_MISSING',
    });
  });

  it('reports an incomplete disk without contacting it, and keeps credentials out of the answer', async () => {
    const { router } = await fixture();
    const response = await router.request('/file/disks/s3/check', {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain(KEY_ID);
    const { data } = JSON.parse(text);
    expect(data.ok).toBe(false);
    expect(data.steps).toEqual([
      expect.objectContaining({
        step: 'write',
        status: 'failed',
        reason: 'CONFIG_INCOMPLETE',
        detail: 'BUCKET_MISSING',
      }),
      expect.objectContaining({ step: 'read', status: 'skipped' }),
      expect.objectContaining({ step: 'url', status: 'skipped' }),
      expect.objectContaining({ step: 'delete', status: 'skipped' }),
    ]);
  });

  it('requires the check grant to check, and answers 404 for a disk that does not exist', async () => {
    const denied = await fixture({ check: false });
    const refused = await denied.router.request('/file/disks/local/check', {
      method: 'POST',
    });
    expect(refused.status).toBe(403);
    expect((await json(refused)).error.reason).toBe(
      'FILE_STORAGE_CHECK_REQUIRED',
    );
    expect(denied.can).toHaveBeenCalledWith({
      resource: { type: 'settings', id: 'file-storage' },
      action: 'check',
    });
    // Reading still works without the check grant, and tells the page to hide the check.
    const read = await denied.router.request('/file/storage');
    expect(read.status).toBe(200);
    expect((await json(read)).data.canCheck).toBe(false);
    const { router } = await fixture();
    const missing = await router.request('/file/disks/nowhere/check', {
      method: 'POST',
    });
    expect(missing.status).toBe(404);
    expect((await json(missing)).error.reason).toBe('DISK_NOT_FOUND');
  });

  it('declares both routes in the API document', async () => {
    const { router } = await fixture();
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'test', version: '0.0.0' },
    });
    expect(await findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      Object.entries(document.paths ?? {}).flatMap(([url, item]) =>
        Object.entries(item ?? {}).map(
          ([method, operation]) =>
            `${method.toUpperCase()} ${url} ${(operation as { operationId?: string }).operationId}`,
        ),
      ),
    ).toEqual([
      'GET /api/file/storage fileGetStorage',
      'POST /api/file/disks/{disk}/check fileCheckDisk',
    ]);
  });
});

function localDisk() {
  return describeDisks({
    drive: {
      default: 'local',
      disks: {
        local: { driver: 'fs', location: '/tmp/x', visibility: 'private' },
      },
    },
    rootDir: '/tmp',
    loaded: ['local'],
  })[0];
}

/** Drive over a driver whose operations a test scripts, behind Drive's own disk wrapper. */
function scriptedDrive(driver: Record<string, unknown>) {
  return createDriveManager({
    default: 'local',
    disks: { local: () => driver as never },
  });
}

describe('runCheck', () => {
  it('reports a failing write by a fixed reason and a known code, and logs neither message nor unknown code', async () => {
    const log = vi.fn();
    const failure = Object.assign(new Error(`denied for key ${SECRET}`), {
      name: 'AccessDenied',
    });
    const result = await runCheck({
      disk: localDisk(),
      drive: scriptedDrive({
        put: async () => {
          throw failure;
        },
        delete: async () => {},
      }),
      log,
    });
    expect(result.ok).toBe(false);
    expect(result.steps[0]).toMatchObject({
      step: 'write',
      status: 'failed',
      reason: 'WRITE_FAILED',
      errorName: 'AccessDenied',
    });
    expect(JSON.stringify(result)).not.toContain(SECRET);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]).toHaveLength(1);
    expect(log.mock.calls[0][0]).toContain('WRITE_FAILED (AccessDenied)');
    expect(log.mock.calls[0][0]).not.toContain(SECRET);
  });

  it('reports no code from nested causes that are not known ones, however they look', async () => {
    const log = vi.fn();
    // An identifier-shaped credential two causes deep, under codes that are not on the known list either.
    const failure = Object.assign(new Error('outer'), {
      code: 'CustomWrapper',
      cause: Object.assign(new Error(`inner ${SECRET}`), {
        name: 'VendorError',
        cause: { code: KEY_ID.replaceAll('-', '_'), message: SECRET },
      }),
    });
    const result = await runCheck({
      disk: localDisk(),
      drive: scriptedDrive({
        put: async () => {
          throw failure;
        },
        delete: async () => {},
      }),
      log,
    });
    // Only Drive's own wrapper code is known; nothing from the causes is reported.
    expect(result.steps[0]).toMatchObject({
      reason: 'WRITE_FAILED',
      errorName: 'E_CANNOT_WRITE_FILE',
    });
    const text = JSON.stringify(result) + String(log.mock.calls[0][0]);
    for (const forbidden of [
      SECRET,
      KEY_ID.replaceAll('-', '_'),
      'VendorError',
      'CustomWrapper',
    ])
      expect(text).not.toContain(forbidden);
  });

  it('cleans up after a partial write and says so', async () => {
    const files = new Map<string, string>();
    const result = await runCheck({
      disk: localDisk(),
      drive: scriptedDrive({
        put: async (key: string) => {
          files.set(key, 'partial');
          throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
        },
        delete: async (key: string) => {
          files.delete(key);
        },
      }),
    });
    expect(result.steps.map((step) => [step.step, step.status])).toEqual([
      ['write', 'failed'],
      ['read', 'skipped'],
      ['url', 'skipped'],
      ['delete', 'passed'],
    ]);
    expect(result.steps[0].errorName).toBe('ENOSPC');
    expect(files.size).toBe(0);
  });

  it('reports DELETE_FAILED when the cleanup after a partial write fails too', async () => {
    const result = await runCheck({
      disk: localDisk(),
      drive: scriptedDrive({
        put: async () => {
          throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
        },
        delete: async () => {
          throw Object.assign(new Error('read-only'), { code: 'EROFS' });
        },
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.steps[3]).toMatchObject({
      step: 'delete',
      status: 'failed',
      reason: 'DELETE_FAILED',
      errorName: 'EROFS',
      detail: expect.stringMatching(/^nocobase-check\//),
    });
  });
});

describe('OSS disks', () => {
  const oss = (overrides: Record<string, unknown>) =>
    describeDisks({
      drive: {
        default: 'local',
        disks: {
          local: { driver: 'fs', location: '/tmp/x', visibility: 'private' },
          oss: {
            driver: 'oss',
            bucket: 'files',
            region: 'oss-cn-hangzhou',
            visibility: 'private',
            credentials: { accessKeyId: KEY_ID, accessKeySecret: SECRET },
            ...overrides,
          } as never,
        },
      },
      rootDir: '/tmp',
      loaded: ['local', 'oss'],
    })[1];

  it('is complete only as the OSS driver accepts it', () => {
    expect(oss({})).toMatchObject({ complete: true, problems: [] });
    expect(oss({ region: 'us-east-1' }).problems).toEqual(['REGION_INVALID']);
    expect(
      oss({
        credentials: {
          provider: 'aliyun-ecs-ram-role',
          accessKeyId: KEY_ID,
        },
      }).problems,
    ).toEqual(['CREDENTIALS_INVALID']);
    expect(
      oss({ credentials: { provider: 'aliyun-ecs-ram-role' } }).problems,
    ).toEqual([]);
    expect(oss({ credentials: { accessKeyId: KEY_ID } }).problems).toEqual([
      'CREDENTIALS_MISSING',
    ]);
    expect(oss({ domain: 'http://files.example.test' }).problems).toEqual([
      'SETTINGS_INVALID',
    ]);
    expect(oss({ timeout: 0 }).problems).toEqual(['SETTINGS_INVALID']);
    expect(JSON.stringify(oss({}))).not.toContain(SECRET);
  });
});

// @vitest-environment node
import path from 'node:path';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import {
  databaseManagerToken,
  type DatabaseManager,
  type RepositoryPolicy,
} from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createDriveManager } from '@nocobase/drive';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { createPublicBasePathAdapter } from '@nocobase/app-server/runtime';
import { ServiceContainer } from '@nocobase/service-provider';
import { createApiClient } from '@nocobase/api-client';
import {
  ServerFileRepositoryManager,
  uploadPolicy,
} from '../server/repository.js';
import {
  defineFileRepositoryApiRoutes,
  type FileRepositoryApiExposure,
} from '../server/routes.js';
import { serverFileRepositoryManagerToken } from '../server/token.js';
import { ClientFileRepositoryManager } from '../client/manager.js';
import { FileRepositoryServiceProvider } from '../server/providers/index.js';
import { ClientFileRepositoryServiceProvider } from '../client/providers/index.js';
import { clientFileRepositoryManagerToken } from '../client/token.js';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

/** Every action allowed; a test that restricts one declares its own Policy. */
const openPolicy: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: true,
};

/**
 * Stand in for the Repository an upload writes through.
 *
 * The manager binds a derived Policy for uploads, so a stub has to sit on the
 * instance `withPolicy` returns rather than on the one the manager was handed.
 */
function stubUploadRepository(db: DatabaseManager): {
  repository: ReturnType<DatabaseManager['repository']>;
  writable: ReturnType<ReturnType<DatabaseManager['repository']>['withPolicy']>;
} {
  const repository = db.repository('attachments');
  const writable = repository.withPolicy(uploadPolicy(openPolicy));
  vi.spyOn(repository, 'withPolicy').mockReturnValue(writable);
  vi.spyOn(db, 'repository').mockReturnValue(repository);
  return { repository, writable };
}

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const fn of cleanup.splice(0).reverse()) await fn();
});
async function fixture(
  overrides: Partial<FileRepositoryApiExposure> = {},
  {
    publicBasePath = '/main',
    storageUrl = 'https://cdn.example.test/storage',
    databaseSize,
    databaseJsonField,
  }: {
    publicBasePath?: string;
    storageUrl?: string;
    databaseSize?: (value: unknown) => unknown;
    databaseJsonField?: string;
  } = {},
) {
  const root = await mkdtemp(path.join(tmpdir(), 'file-repository-'));
  cleanup.push(() => rm(root, { recursive: true, force: true }));
  const testDatabase = await createTestDatabase();
  cleanup.push(() => testDatabase.destroy());
  const db = testDatabase.database;
  await db.builder().createCollection('attachments', (collection) => {
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
  if (databaseSize) {
    // Exercise driver return types through real Repository queries and routes.
    const knex = await db.connection().client<{
      client: { config: { postProcessResponse?: (value: unknown) => unknown } };
    }>();
    const decode = (row: unknown): unknown => {
      if (!row || typeof row !== 'object') return row;
      const result =
        'size' in row ? { ...row, size: databaseSize(row.size) } : row;
      if (databaseJsonField && databaseJsonField in result) {
        const json: unknown = Reflect.get(result, databaseJsonField);
        if (typeof json === 'string')
          return {
            ...result,
            [databaseJsonField]: JSON.parse(json) as unknown,
          };
      }
      return result;
    };
    knex.client.config.postProcessResponse = (value) =>
      Array.isArray(value) ? value.map(decode) : decode(value);
  }
  const drive = createDriveManager({
    default: 'local',
    disks: {
      local: { driver: 'fs', location: root, visibility: 'private' },
      public: {
        driver: 'fs',
        location: path.join(root, 'public'),
        visibility: 'public',
        url: storageUrl,
      },
    },
  });
  const manager = new ServerFileRepositoryManager(db, drive);
  const files = manager.repository('attachments', {
    disk: overrides.disk ?? 'local',
    accessPath: overrides.accessPath ?? '/uploads/attachments',
    policy: overrides.policy ?? openPolicy,
  });
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, db);
  container.instance(driveManagerToken, drive);
  container.instance(serverFileRepositoryManagerToken, manager);
  const appRouter = new Hono();
  appRouter.onError((error, c) =>
    c.json({ code: 'TEST_ERROR', message: error.message }, 500),
  );
  for (const contribution of defineFileRepositoryApiRoutes({
    repositories: [
      {
        name: 'attachments',
        disk: 'local',
        policy: openPolicy,
        actions: {
          findMany: {},
          findOne: {},
          count: {},
          exists: {},
          createOne: {},
          updateOne: {},
          deleteOne: {},
          uploadOne: {},
          uploadMany: {},
        },
        ...overrides,
      },
    ],
  })) {
    appRouter.route(
      contribution.scope === 'api' ? '/api' : '/',
      await contribution.createRouter({ container, publicBasePath }),
    );
  }
  const mounted = createPublicBasePathAdapter(
    { fetch: (request) => Promise.resolve(appRouter.fetch(request)) },
    publicBasePath,
  );
  const router = new Hono();
  router.all('*', (c) => mounted.fetch(c.req.raw));
  const api = createApiClient({
    baseURL: `http://example.test${publicBasePath}/api`,
    fetch: (input, init) => router.fetch(new Request(input, init)),
  });
  const client = new ClientFileRepositoryManager(api).repository('attachments');
  return { root, db, drive, manager, files, router, api, client };
}
const file = (name = 'hello.txt', text = 'hello'): File =>
  new File([text], name, { type: 'text/plain' });

describe('server repository and Client API', () => {
  it.each(['string', 'bigint'])(
    'normalizes %s sizes for Server uploads, queries and mutations',
    async (representation) => {
      const { files, db } = await fixture(
        {},
        {
          databaseSize: (value) =>
            representation === 'string' ? String(value) : BigInt(String(value)),
        },
      );
      const { record } = await files.uploadOne({ file: file() });
      expect(record.size).toBe(5);
      expect(
        typeof (
          await db
            .repository('attachments')
            .findOne({ filter: { id: record.id } })
        )?.size,
      ).toBe('string');
      expect(
        (await files.uploadMany({ files: [file()] })).records[0]?.size,
      ).toBe(5);
      expect((await files.findOne({ filter: { id: record.id } }))?.size).toBe(
        5,
      );
      expect((await files.findMany())[0]?.size).toBe(5);
      for await (const row of files.findMany({
        select: (s) => s.fields('size'),
      }))
        expect(row).toEqual({ size: 5 });
      const updated = await files.updateOne({
        filter: { id: record.id },
        values: { filename: 'renamed.txt' },
      });
      expect(updated.record.size).toBe(5);
      const deleted = await files.deleteOne({
        filter: { id: record.id },
        select: (s) => s.fields('size'),
      });
      expect(deleted.record?.size).toBe(5);
    },
  );
  it.each(['record', 'records'])(
    'preserves the custom %s field while normalizing file metadata',
    async (field) => {
      const { files, client, db } = await fixture(
        {
          policy: {
            read: true,
            create: true,
            update: { scope: true, fields: ['filename'] },
            delete: false,
          },
          actions: {
            findOne: {},
            findMany: {},
            updateOne: {},
          },
        },
        { databaseSize: String, databaseJsonField: field },
      );
      await db.builder().alterCollection('attachments', (collection) => {
        collection.json(field);
      });
      const { record } = await files.uploadOne({ file: file() });
      const businessValue = { size: 'business-size' };
      await db.repository('attachments').updateOne({
        filter: { id: record.id },
        values: { [field]: businessValue },
      });
      const stored = await db
        .repository('attachments')
        .findOne({ filter: { id: record.id } });
      expect(stored?.size).toBe('5');
      const storedBusinessValue = stored?.[field];
      expect(storedBusinessValue).toEqual(businessValue);
      expect(await files.findOne({ filter: { id: record.id } })).toMatchObject({
        size: 5,
        [field]: storedBusinessValue,
      });
      expect(
        await files.findOne({
          filter: { id: record.id },
          select: (s) => s.fields(field),
        }),
      ).toEqual({ [field]: storedBusinessValue });
      expect(
        await client.findOne({
          filter: { id: record.id },
          select: (s) => s.fields(field),
        }),
      ).toEqual({ [field]: storedBusinessValue });
      const streamed = [];
      for await (const row of client.findMany({
        select: (s) => s.fields('size', field),
      }))
        streamed.push(row);
      expect(streamed).toEqual([{ size: 5, [field]: storedBusinessValue }]);
      const clientUpdated = await client.updateOne({
        filter: { id: record.id },
        values: { filename: 'client-renamed.txt' },
        select: (s) => s.fields('size', field),
      });
      expect(clientUpdated.record).toEqual({
        size: 5,
        [field]: storedBusinessValue,
      });
      const updated = await files.updateOne({
        filter: { id: record.id },
        values: { filename: 'renamed.txt' },
      });
      expect(updated.record).toMatchObject({
        size: 5,
        [field]: storedBusinessValue,
      });
      const deleted = await files.deleteMany({
        filter: { id: record.id },
        select: (s) => s.fields('size', field),
      });
      expect(deleted.records).toEqual([
        { size: 5, [field]: storedBusinessValue },
      ]);
    },
  );
  it('normalizes PostgreSQL-style string sizes in HTTP queries and NDJSON projections', async () => {
    const { client } = await fixture({}, { databaseSize: String });
    const { record } = await client.uploadOne({ file: file() });
    expect(record.size).toBe(5);
    expect(
      (await client.uploadMany({ files: [file()] })).records[0]?.size,
    ).toBe(5);
    expect((await client.findOne({ filter: { id: record.id } }))?.size).toBe(5);
    expect((await client.findMany())[0]?.size).toBe(5);
    expect(await client.findMany({ select: (s) => s.fields('size') })).toEqual([
      { size: 5 },
      { size: 5 },
    ]);
    for await (const row of client.findMany({
      select: (s) => s.fields('size'),
    }))
      expect(row).toEqual({ size: 5 });
    const deleted = await client.deleteOne({
      filter: { id: record.id },
      select: (s) => s.fields('size'),
    });
    expect(deleted.record?.size).toBe(5);
  });
  it.each(['-1', '9007199254740992', 'not-a-size'])(
    'rejects invalid database file size %s',
    async (size) => {
      const { files, client, db } = await fixture(
        {},
        { databaseSize: () => size },
      );
      await expect(files.uploadOne({ file: file() })).rejects.toMatchObject({
        code:
          size === 'not-a-size'
            ? 'INVALID_STORED_VALUE'
            : 'INVALID_FILE_METADATA',
      });
      expect(await db.repository('attachments').count()).toBe(
        size === 'not-a-size' ? 0 : 1,
      );
      if (size === 'not-a-size') {
        await expect(client.findMany()).resolves.toEqual([]);
      } else {
        await expect(client.findMany()).rejects.toMatchObject({
          reason: 'INVALID_FILE_METADATA',
        });
      }
    },
  );
  it('uploads through the client, lists, streams, and deletes metadata only', async () => {
    const { client, files, router, drive } = await fixture();
    const { record } = await client.uploadOne({ file: file('../你好.TXT') });
    expect(record).toMatchObject({
      filename: '你好.TXT',
      ext: 'txt',
      size: 5,
      disk: 'local',
      mimeType: 'text/plain',
    });
    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(record.key).toBe(`objects/${record.id}.txt`);
    expect(record.contentUrl).toBe(
      `/main/uploads/attachments/${record.id}.txt`,
    );
    expect(files.getUrl(record)).toBe(`/uploads/attachments/${record.id}.txt`);
    const response = await router.request(record.contentUrl!);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain');
    expect(response.headers.get('content-length')).toBe('5');
    expect(response.headers.get('content-disposition')).toContain(
      "filename*=UTF-8''",
    );
    expect(await response.text()).toBe('hello');
    expect(
      (await router.request(`/main/api/uploads/attachments/${record.id}.txt`))
        .status,
    ).toBe(404);
    expect(
      (await router.request(`/main/uploads/attachments/${record.id}.jpg`))
        .status,
    ).toBe(404);
    expect(await client.count()).toBe(1);
    expect(await client.exists({ filter: { id: record.id } })).toBe(true);
    expect((await client.findMany())[0]?.contentUrl).toBe(record.contentUrl);
    const streamed = [];
    for await (const row of client.findMany()) streamed.push(row);
    expect(streamed[0]?.contentUrl).toBe(record.contentUrl);
    const selected = await client.findMany({
      select: (s) => s.fields('filename'),
    });
    expect(selected).toEqual([{ filename: '你好.TXT' }]);
    await client.deleteOne({ filter: { id: record.id } });
    expect(await drive.use('local').exists(record.key)).toBe(true);
    expect((await router.request(record.contentUrl!)).status).toBe(404);
  });
  it('uploads many in one createMany and supports extensionless files', async () => {
    const { client, router } = await fixture();
    const result = await client.uploadMany({
      files: [file('README'), file('second.txt')],
    });
    expect(result.createdCount).toBe(2);
    expect(result.records).toHaveLength(2);
    const record = result.records.find((row) => row.filename === 'README')!;
    expect(record.ext).toBe('');
    expect(record.contentUrl).toBe(`/main/uploads/attachments/${record.id}`);
    expect((await router.request(record.contentUrl!)).status).toBe(200);
  });
  it('keeps server findMany lazy and async iterable', async () => {
    const { files } = await fixture();
    const query = files.findMany();
    await files.uploadOne({ file: file() });
    const rows = [];
    for await (const row of query) rows.push(row);
    expect(rows).toHaveLength(1);
  });
  it('refuses a create the Policy does not grant and does not expose unconfigured actions', async () => {
    const { client, router } = await fixture({
      policy: {
        read: true,
        create: false,
        update: true,
        delete: true,
      },
    });
    await expect(client.createOne({ values: {} })).rejects.toMatchObject({
      reason: 'WRITE_FORBIDDEN',
    });
    expect(
      (
        await router.request('/main/api/attachments:createMany', {
          method: 'POST',
        })
      ).status,
    ).toBe(404);
  });
  it('validates schema before storage and guards CRUD/content access', async () => {
    const { db, files, drive, client, router } = await fixture();
    await db.builder().dropCollection('attachments');
    await db.builder().createCollection('attachments', (c) => {
      c.uuid('id').primary();
    });
    const put = vi.spyOn(drive.use('local'), 'putStream');
    await expect(files.uploadOne({ file: file() })).rejects.toMatchObject({
      code: 'INVALID_FILE_COLLECTION',
    });
    expect(put).not.toHaveBeenCalled();
    await expect(client.findMany()).rejects.toMatchObject({
      reason: 'INVALID_FILE_COLLECTION',
    });
    expect(
      (
        await router.request(
          '/main/uploads/attachments/00000000-0000-0000-0000-000000000000.txt',
        )
      ).status,
    ).toBe(500);
  });
  it('cleans every object when batch metadata or DB insertion fails', async () => {
    const { files, drive, root, db } = await fixture();
    const disk = drive.use('local');
    vi.spyOn(disk, 'getMetaData').mockRejectedValueOnce(
      new Error('metadata unavailable'),
    );
    await expect(files.uploadMany({ files: [file(), file()] })).rejects.toThrow(
      'metadata unavailable',
    );
    expect(await readdir(path.join(root, 'objects'))).toEqual([]);
    vi.restoreAllMocks();
    await db.builder().alterCollection('attachments', {
      addFields: [
        { name: 'requiredBusinessField', type: 'string', nullable: false },
      ],
    });
    await expect(
      files.uploadMany({ files: [file(), file()] }),
    ).rejects.toThrow();
    expect(await readdir(path.join(root, 'objects'))).toEqual([]);
    expect(await files.count()).toBe(0);
  });
  it('reports failed compensation without hiding the upload failure', async () => {
    const { files, drive } = await fixture();
    vi.spyOn(drive.use('local'), 'getMetaData').mockRejectedValueOnce(
      new Error('metadata unavailable'),
    );
    vi.spyOn(drive.use('local'), 'delete').mockRejectedValueOnce(
      new Error('delete unavailable'),
    );
    await expect(files.uploadOne({ file: file() })).rejects.toMatchObject({
      code: 'FILE_CLEANUP_FAILED',
      cause: expect.any(AggregateError),
    });
  });
});

describe('upload boundary and access modes', () => {
  it('rejects oversized multipart before storage and accepts only File fields', async () => {
    const { client, router, drive } = await fixture({
      actions: { uploadOne: { maxSize: 512 }, uploadMany: { maxSize: 700 } },
    });
    const put = vi.spyOn(drive.use('local'), 'putStream');
    await expect(
      client.uploadOne({ file: file('large.txt', 'x'.repeat(1024)) }),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      client.uploadMany({
        files: [file('a', 'x'.repeat(400)), file('b', 'x'.repeat(400))],
      }),
    ).rejects.toMatchObject({ status: 413 });
    expect(put).not.toHaveBeenCalled();
    const body = new FormData();
    body.append('file', file());
    body.append('file', file());
    expect(
      (
        await router.request('/main/api/attachments:uploadOne', {
          method: 'POST',
          body,
        })
      ).status,
    ).toBe(400);
    await expect(client.uploadMany({ files: [] })).rejects.toMatchObject({
      status: 400,
    });
    const textBody = new FormData();
    textBody.append('file', 'text');
    expect(
      (
        await router.request('/main/api/attachments:uploadMany', {
          method: 'POST',
          body: textBody,
        })
      ).status,
    ).toBe(400);
  });
  it('redirects public objects and fails explicitly for unavailable private URLs', async () => {
    const { files, client, router } = await fixture({
      accessMode: 'redirect',
      disk: 'public',
    });
    const { record } = await client.uploadOne({ file: file() });
    const response = await router.request(record.contentUrl!);
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      await files.getStorageUrl(record),
    );
    expect(response.headers.get('location')).toContain(
      'https://cdn.example.test/storage/objects/',
    );
    const privateFixture = await fixture({ accessMode: 'redirect' });
    const privateUpload = await privateFixture.client.uploadOne({
      file: file(),
    });
    const failure = await privateFixture.router.request(
      privateUpload.record.contentUrl!,
    );
    expect(failure.status).toBe(500);
    expect(await failure.json()).toMatchObject({
      code: 'STORAGE_URL_UNAVAILABLE',
    });
  });
  it('uses record.disk and signed URLs, with no-store and no redirect loops', async () => {
    const { files, client, router, drive } = await fixture({
      accessMode: 'redirect',
    });
    const { record } = await client.uploadOne({ file: file() });
    const signed = vi
      .spyOn(drive.use('local'), 'getSignedUrl')
      .mockResolvedValue('https://storage.example.test/private?signature=test');
    expect(
      (await router.request(record.contentUrl!)).headers.get('cache-control'),
    ).toBe('private, no-store');
    expect(signed).toHaveBeenCalledWith(record.key, { expiresIn: '5 mins' });
    signed.mockResolvedValue(`http://localhost${record.contentUrl}`);
    expect((await router.request(record.contentUrl!)).status).toBe(500);
    const publicUrl = vi
      .spyOn(drive.use('public'), 'getUrl')
      .mockResolvedValue('https://cdn.example.test/file');
    vi.spyOn(drive.use('public'), 'getVisibility').mockResolvedValue('public');
    expect(await files.getStorageUrl({ ...record, disk: 'public' })).toBe(
      'https://cdn.example.test/file',
    );
    expect(publicUrl).toHaveBeenCalledWith(record.key);
  });
  it.each(['', '/review-files'])(
    'rejects a storage URL that redirects into the file route with base path "%s"',
    async (publicBasePath) => {
      const { client, router } = await fixture(
        {
          accessMode: 'redirect',
          accessPath: '/uploads/objects',
          disk: 'public',
        },
        { publicBasePath, storageUrl: '/uploads' },
      );
      const { record } = await client.uploadOne({ file: file() });
      const response = await router.request(record.contentUrl!);
      expect(response.status).toBe(500);
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(await response.json()).toMatchObject({
        code: 'STORAGE_URL_UNAVAILABLE',
      });
    },
  );
  it.each<[string, string | null]>([
    ['/review-files/uploads', null],
    ['http://localhost/review-files/uploads', null],
    ['/storage', '/review-files/storage'],
    ['/review-files/storage', '/review-files/storage'],
    ['http://localhost/storage', 'http://localhost/storage'],
    ['http://localhost/uploads', 'http://localhost/uploads'],
    [
      'https://cdn.example.test/review-files/uploads',
      'https://cdn.example.test/review-files/uploads',
    ],
  ])(
    'checks the final hosted redirect target for storage URL %s',
    async (storageUrl, expectedBase) => {
      const { client, router } = await fixture(
        {
          accessMode: 'redirect',
          accessPath: '/uploads/objects',
          disk: 'public',
        },
        { publicBasePath: '/review-files', storageUrl },
      );
      const { record } = await client.uploadOne({ file: file() });
      const response = await router.request(record.contentUrl!);
      if (expectedBase === null) {
        expect(response.status).toBe(500);
        expect(response.headers.get('location')).toBeNull();
        expect(await response.json()).toMatchObject({
          code: 'STORAGE_URL_UNAVAILABLE',
        });
      } else {
        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toBe(
          `${expectedBase}/${record.key}`,
        );
      }
    },
  );
  it('validates access paths and upload configuration', () => {
    const entry = {
      name: 'attachments',
      disk: 'local',
      policy: openPolicy,
      actions: {},
    };
    expect(() =>
      defineFileRepositoryApiRoutes({
        repositories: [
          entry,
          { ...entry, name: 'second', accessPath: '/uploads/attachments' },
        ],
      }),
    ).toThrow('Conflicting');
    expect(() =>
      defineFileRepositoryApiRoutes({
        repositories: [{ ...entry, accessPath: '/uploads/:name' }],
      }),
    ).toThrow('accessPath');
    expect(() =>
      defineFileRepositoryApiRoutes({
        repositories: [{ ...entry, actions: { uploadOne: { maxSize: 0 } } }],
      }),
    ).toThrow('maxSize');
  });
});

describe('service providers and uncertain commits', () => {
  it('registers lazy singleton managers using application-owned tokens', async () => {
    const { db, drive, api } = await fixture();
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, db);
    container.instance(driveManagerToken, drive);
    container.instance(apiClientToken, api);
    new FileRepositoryServiceProvider({
      container,
    } as AppPluginApplication).register();
    new ClientFileRepositoryServiceProvider({
      container,
    } as ClientApplication).register();
    expect(
      container.resolveIfCreated(serverFileRepositoryManagerToken),
    ).toBeUndefined();
    const manager = container.resolve(serverFileRepositoryManagerToken);
    expect(container.resolve(serverFileRepositoryManagerToken)).toBe(manager);
    const client = container.resolve(clientFileRepositoryManagerToken);
    expect(container.resolve(clientFileRepositoryManagerToken)).toBe(client);
    const result = await client
      .repository('attachments')
      .uploadOne({ file: file() });
    expect(
      await manager
        .repository('attachments', {
          disk: 'local',
          accessPath: '/uploads/attachments',
          policy: openPolicy,
        })
        .exists({ filter: { id: result.record.id } }),
    ).toBe(true);
  });
  it('keeps an object when createOne committed before reporting an error', async () => {
    const { db, manager, root } = await fixture();
    const { repository, writable } = stubUploadRepository(db);
    const create = writable.createOne.bind(writable);
    vi.spyOn(writable, 'createOne').mockImplementation(async (input) => {
      await create(input);
      throw new Error('commit acknowledgement lost');
    });
    const files = manager.repository('attachments', {
      disk: 'local',
      accessPath: '/uploads/attachments',
      policy: openPolicy,
    });
    await expect(files.uploadOne({ file: file() })).rejects.toThrow(
      'commit acknowledgement lost',
    );
    expect(await readdir(path.join(root, 'objects'))).toHaveLength(1);
    expect(await repository.count()).toBe(1);
  });
  it('retains objects if the database cannot verify commit status', async () => {
    const { db, manager, root } = await fixture();
    const { repository, writable } = stubUploadRepository(db);
    vi.spyOn(writable, 'createMany').mockRejectedValue(
      new Error('database disconnected'),
    );
    vi.spyOn(repository, 'exists').mockRejectedValue(
      new Error('database disconnected'),
    );
    const files = manager.repository('attachments', {
      disk: 'local',
      accessPath: '/uploads/attachments',
      policy: openPolicy,
    });
    await expect(
      files.uploadMany({ files: [file(), file()] }),
    ).rejects.toMatchObject({ code: 'FILE_COMMIT_UNCERTAIN' });
    expect(await readdir(path.join(root, 'objects'))).toHaveLength(2);
  });
  it('does not remove committed objects when URL decoration fails', async () => {
    const { db, manager, root } = await fixture();
    const { repository, writable } = stubUploadRepository(db);
    const create = writable.createOne.bind(writable);
    vi.spyOn(writable, 'createOne').mockImplementation(async (input) => {
      const result = await create(input);
      return { ...result, record: { ...result.record, id: '\ud800' } };
    });
    await expect(
      manager
        .repository('attachments', {
          disk: 'local',
          accessPath: '/uploads/attachments',
          policy: openPolicy,
        })
        .uploadOne({ file: file() }),
    ).rejects.toThrow(URIError);
    expect(await readdir(path.join(root, 'objects'))).toHaveLength(1);
    expect(await repository.count()).toBe(1);
  });
});

// db-test-portability: sqlite-only — a fake Database Manager under a configuration that names SQLite; opens no database
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes, DATABASE_EXPLORER_PAGE } from '../server/routes/index.js';

const CONNECTIONS_PATH = '/databaseExplorer/connections';
const COLLECTIONS_PATH = `${CONNECTIONS_PATH}/main/collections`;
const DETAIL_PATH = `${COLLECTIONS_PATH}/orders`;
const PHYSICAL_PATH = `${DETAIL_PATH}/physicalSchema`;
const EVERY_PATH = [
  CONNECTIONS_PATH,
  COLLECTIONS_PATH,
  DETAIL_PATH,
  PHYSICAL_PATH,
];

describe('@nocobase/app-plugin-database-explorer API routes', () => {
  it('rejects anonymous requests before reading any database', async () => {
    const database = fakeDatabase();
    const router = await apiRoutes.createRouter(
      application({ identity: 'anonymous', database }),
    );

    for (const path of EVERY_PATH) {
      expect((await router.request(path)).status).toBe(401);
    }
    expect(database.connection).not.toHaveBeenCalled();
  });

  it('rejects an authenticated caller without the page grant', async () => {
    const database = fakeDatabase();
    const can = vi.fn().mockResolvedValue(false);
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database, can }),
    );

    const response = await router.request(CONNECTIONS_PATH);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: expect.objectContaining({
        code: 403,
        status: 'PERMISSION_DENIED',
        reason: 'DATABASE_EXPLORER_FORBIDDEN',
        domain: 'databaseExplorer',
        message: expect.any(String),
      }),
    });
    expect(can).toHaveBeenCalledWith({
      resource: { type: 'page', id: DATABASE_EXPLORER_PAGE },
      action: 'access',
    });
  });

  it('answers every path with 503 when the application has no database', async () => {
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated' }),
    );

    for (const path of EVERY_PATH) {
      const response = await router.request(path);
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        error: {
          status: 'UNAVAILABLE',
          reason: 'DATABASE_UNAVAILABLE',
          domain: 'databaseExplorer',
        },
      });
    }
  });

  it('lists every configured connection while all of them are unreachable', async () => {
    // The isolation that matters: one dead database must not cost the list.
    const database = fakeDatabase();
    database.connection.mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 10.0.0.4:5432');
    });
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(CONNECTIONS_PATH);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        {
          name: 'crm',
          isDefault: false,
          dialect: 'postgres',
          schemaManagement: 'external',
          databaseName: 'crm',
        },
        {
          name: 'main',
          isDefault: true,
          dialect: 'sqlite',
          schemaManagement: 'managed',
        },
      ],
      meta: { total: 2 },
    });
    expect(database.connection).not.toHaveBeenCalled();
  });

  it.each(['toString', 'constructor', '__proto__'])(
    'reports the inherited name %s as an unconfigured connection',
    async (name) => {
      // `name in connections` is true for every prototype member, so an `in`
      // check would send these to the Manager and answer 503 instead of 404.
      const database = fakeDatabase();
      const router = await apiRoutes.createRouter(
        application({ identity: 'authenticated', database }),
      );

      const response = await router.request(
        `${CONNECTIONS_PATH}/${name}/collections`,
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { reason: 'CONNECTION_NOT_FOUND' },
      });
      expect(database.connection).not.toHaveBeenCalled();
    },
  );

  it('never writes a driver error into the log either', async () => {
    // The response withholds the cause; a log file is the easier of the two to
    // paste into an issue, so it must withhold it too.
    const database = fakeDatabase();
    database.collections.list.mockRejectedValue(
      inspectorError(
        'SCHEMA_INSPECTION_FAILED',
        new Error('connect ECONNREFUSED 10.0.0.4:5432 password "hunter2"'),
      ),
    );
    const logger = { warn: vi.fn(), info: vi.fn() };
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database, logger }),
    );

    await router.request(COLLECTIONS_PATH);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(logger.warn.mock.calls[0]);
    expect(logged).not.toContain('hunter2');
    expect(logged).not.toContain('10.0.0.4');
    // The classification survives, which is what an operator acts on.
    expect(logged).toContain('SCHEMA_INSPECTION_FAILED');
  });

  it('reports an unconfigured connection as not found', async () => {
    const database = fakeDatabase();
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(
      `${CONNECTIONS_PATH}/nope/collections`,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'NOT_FOUND',
        reason: 'CONNECTION_NOT_FOUND',
        domain: 'databaseExplorer',
      },
    });
    expect(database.connection).not.toHaveBeenCalled();
  });

  it('reports a missing collection as not found', async () => {
    const database = fakeDatabase();
    database.collections.getResolution.mockResolvedValue(undefined);
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(DETAIL_PATH);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { reason: 'COLLECTION_NOT_FOUND' },
    });
  });

  it('never repeats a driver error back to the caller', async () => {
    const database = fakeDatabase();
    database.collections.list.mockRejectedValue(
      inspectorError(
        'SCHEMA_INSPECTION_FAILED',
        new Error(
          'connect ECONNREFUSED 10.0.0.4:5432 (user "svc_app", password "hunter2")',
        ),
      ),
    );
    const logger = { warn: vi.fn(), info: vi.fn() };
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database, logger }),
    );

    const response = await router.request(COLLECTIONS_PATH);
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(body).toContain('CONNECTION_UNREACHABLE');
    expect(body).not.toContain('hunter2');
    expect(body).not.toContain('10.0.0.4');
    expect(body).not.toContain('svc_app');
    // The detail is kept, just not on the wire.
    expect(logger.warn).toHaveBeenCalled();
  });

  it('separates a denied schema read from an unreachable database', async () => {
    const database = fakeDatabase();
    database.collections.list.mockRejectedValue(
      inspectorError('SCHEMA_INSPECTION_PERMISSION_DENIED'),
    );
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(COLLECTIONS_PATH);

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { status: 'UNAVAILABLE', reason: 'SCHEMA_READ_DENIED' },
    });
  });

  it('blames the caller for a page token that belongs to another listing', async () => {
    const database = fakeDatabase();
    database.collections.list.mockRejectedValue(
      inspectorError('SCHEMA_INSPECTION_INVALID_CURSOR'),
    );
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(
      `${COLLECTIONS_PATH}?pageToken=stale`,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_CURSOR' },
    });
  });

  it.each([
    'pageSize=0',
    'pageSize=-1',
    'pageSize=abc',
    'pageSize=101',
    'pageToken=',
  ])('refuses %s without touching the database', async (query) => {
    const database = fakeDatabase();
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(`${COLLECTIONS_PATH}?${query}`);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_INPUT',
        fieldViolations: [{ field: query.split('=')[0] }],
      },
    });
    expect(database.collections.list).not.toHaveBeenCalled();
  });

  it('passes a page token back to the database exactly as it was issued', async () => {
    const database = fakeDatabase();
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    await router.request(
      `${COLLECTIONS_PATH}?pageSize=5&pageToken=opaque%2Bblob%3D`,
    );

    expect(database.collections.list).toHaveBeenCalledWith({
      limit: 5,
      cursor: 'opaque+blob=',
    });
  });

  it('lists a page of collections with the token for the next one', async () => {
    const database = fakeDatabase();
    database.collections.list.mockResolvedValue({
      items: [
        { name: 'orders', tableName: 'orders', schema: 'main', kind: 'table' },
      ],
      nextCursor: 'next',
    });
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(COLLECTIONS_PATH);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        { name: 'orders', tableName: 'orders', schema: 'main', kind: 'table' },
      ],
      meta: { nextPageToken: 'next' },
    });
    expect(database.collections.list).toHaveBeenCalledWith({ limit: 20 });
  });

  it('returns a collection definition with its resolution warnings', async () => {
    const database = fakeDatabase();
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(DETAIL_PATH);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        collection: {
          name: 'orders',
          collection: { name: 'orders', fields: [{ name: 'id' }] },
          warnings: [
            { code: 'UNMAPPED_COLUMN', message: 'A column was skipped.' },
          ],
        },
        metadata: null,
      },
    });
    expect(database.collections.getPhysical).not.toHaveBeenCalled();
  });

  it('reads the physical schema only when it is asked for', async () => {
    const database = fakeDatabase();
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(PHYSICAL_PATH);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { schema: { name: 'orders', physical: { tableName: 'orders' } } },
    });
    expect(database.collections.getResolution).not.toHaveBeenCalled();
  });
});

describe('API document', () => {
  it('declares every route with a unique operation', async () => {
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database: fakeDatabase() }),
    );

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'test', version: '0.0.0' },
    });
    const operations = Object.entries(document.paths ?? {}).flatMap(
      ([path, item]) =>
        Object.values(item ?? {}).map((operation) => [
          path,
          (operation as { operationId?: string; tags?: string[] }).operationId,
          (operation as { tags?: string[] }).tags,
        ]),
    );
    expect(operations).toEqual([
      [
        '/api/databaseExplorer/connections',
        'databaseExplorerListConnections',
        ['DatabaseExplorer'],
      ],
      [
        '/api/databaseExplorer/connections/{connection}/collections',
        'databaseExplorerListCollections',
        ['DatabaseExplorer'],
      ],
      [
        '/api/databaseExplorer/connections/{connection}/collections/{collection}',
        'databaseExplorerGetCollection',
        ['DatabaseExplorer'],
      ],
      [
        '/api/databaseExplorer/connections/{connection}/collections/{collection}/physicalSchema',
        'databaseExplorerGetPhysicalSchema',
        ['DatabaseExplorer'],
      ],
    ]);
    expect(document.components?.schemas).toHaveProperty(
      'DatabaseExplorerConnection',
    );
  });
});

function inspectorError(code: string, cause?: unknown): Error {
  const error = new Error('Database schema inspection failed.', { cause });
  error.name = 'SchemaInspectorError';
  return Object.assign(error, { code });
}

function fakeDatabase() {
  const collections = {
    list: vi.fn().mockResolvedValue({ items: [], nextCursor: undefined }),
    getResolution: vi.fn().mockResolvedValue({
      collection: {
        name: 'orders',
        fields: [{ name: 'id', type: 'increments' }],
      },
      inspection: { aspects: {}, warnings: [] },
      warnings: [{ code: 'UNMAPPED_COLUMN', message: 'A column was skipped.' }],
    }),
    getPhysical: vi.fn().mockResolvedValue({
      tableName: 'orders',
      schema: 'main',
      kind: 'table',
      columns: [],
      uniqueConstraints: [],
      indexes: [],
      foreignKeys: [],
      checkConstraints: [],
      inspection: { aspects: {}, warnings: [] },
    }),
  };
  return {
    collections,
    connection: vi.fn().mockReturnValue({
      collections,
      collectionMetadata: { get: vi.fn().mockResolvedValue(undefined) },
    }),
  };
}

interface ApplicationOptions {
  readonly identity: 'anonymous' | 'authenticated';
  readonly database?: ReturnType<typeof fakeDatabase>;
  readonly can?: ReturnType<typeof vi.fn>;
  readonly logger?: { warn: unknown; info: unknown };
}

function application(options: ApplicationOptions): AppPluginApplication {
  const container = new ServiceContainer();
  container.singleton(authenticationToken, () => ({
    required:
      () => async (context: { json: unknown }, next: () => Promise<void>) => {
        if (options.identity === 'anonymous') {
          return (
            context as { json: (body: unknown, status: number) => unknown }
          ).json({ code: 'UNAUTHENTICATED' }, 401);
        }
        await next();
        return undefined;
      },
  }));
  container.singleton(authorizationToken, () => ({
    middleware:
      () =>
      async (
        context: { set: (key: string, value: unknown) => void },
        next: () => Promise<void>,
      ) => {
        context.set('authz', {
          can: options.can ?? vi.fn().mockResolvedValue(true),
        });
        await next();
      },
  }));
  if (options.database) {
    container.singleton(databaseManagerToken, () => options.database);
  }
  if (options.logger) {
    container.singleton(loggingToken, () => ({
      getLogger: () => options.logger,
    }));
  }
  return {
    container,
    config: {
      get: (key: string) =>
        key === 'database'
          ? {
              default: 'main',
              connections: {
                main: { dialect: 'sqlite', filename: ':memory:' },
                crm: {
                  dialect: 'postgres',
                  host: 'crm.internal',
                  database: 'crm',
                  username: 'reader',
                  password: 'hunter2',
                  schemaManagement: 'external',
                },
              },
            }
          : undefined,
    },
  } as unknown as AppPluginApplication;
}

// db-test-portability: sqlite-only — a fake Database Manager under a configuration that names SQLite; opens no database
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes, DATABASE_EXPLORER_PAGE } from '../server/routes/index.js';

const COLLECTIONS_PATH = '/database-explorer/connections/main/collections';
const DETAIL_PATH = `${COLLECTIONS_PATH}/orders`;
const PHYSICAL_PATH = `${DETAIL_PATH}/physical`;
const EVERY_PATH = [
  '/database-explorer/connections',
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

    const response = await router.request('/database-explorer/connections');

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: 'DATABASE_EXPLORER_FORBIDDEN',
      message: expect.any(String),
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
        code: 'DATABASE_UNAVAILABLE',
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

    const response = await router.request('/database-explorer/connections');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        default: 'main',
        items: [
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
      },
    });
    expect(database.connection).not.toHaveBeenCalled();
  });

  it.each(['toString', 'constructor', '__proto__'])(
    'reports the inherited name %s as an unconfigured connection',
    async (name) => {
      // `name in connections` is true for every prototype member, so an `in`
      // check would send these to the Manager and answer 502 instead of 404.
      const database = fakeDatabase();
      const router = await apiRoutes.createRouter(
        application({ identity: 'authenticated', database }),
      );

      const response = await router.request(
        `/database-explorer/connections/${name}/collections`,
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        code: 'CONNECTION_NOT_FOUND',
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
      '/database-explorer/connections/nope/collections',
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: 'CONNECTION_NOT_FOUND',
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
      code: 'COLLECTION_NOT_FOUND',
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

    expect(response.status).toBe(502);
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

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: 'SCHEMA_READ_DENIED' });
  });

  it('blames the caller for a cursor that belongs to another listing', async () => {
    const database = fakeDatabase();
    database.collections.list.mockRejectedValue(
      inspectorError('SCHEMA_INSPECTION_INVALID_CURSOR'),
    );
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    const response = await router.request(`${COLLECTIONS_PATH}?cursor=stale`);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'INVALID_CURSOR' });
  });

  it.each(['0', '-1', 'abc', '201'])(
    'refuses limit=%s without touching the database',
    async (limit) => {
      const database = fakeDatabase();
      const router = await apiRoutes.createRouter(
        application({ identity: 'authenticated', database }),
      );

      const response = await router.request(
        `${COLLECTIONS_PATH}?limit=${limit}`,
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: 'INVALID_LIST_OPTIONS',
      });
      expect(database.collections.list).not.toHaveBeenCalled();
    },
  );

  it('passes a cursor back to the database exactly as it was issued', async () => {
    const database = fakeDatabase();
    const router = await apiRoutes.createRouter(
      application({ identity: 'authenticated', database }),
    );

    await router.request(`${COLLECTIONS_PATH}?limit=5&cursor=opaque%2Bblob%3D`);

    expect(database.collections.list).toHaveBeenCalledWith({
      limit: 5,
      cursor: 'opaque+blob=',
    });
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

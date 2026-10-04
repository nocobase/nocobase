// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  databaseManagerToken,
  SchemaManagementNotAllowedError,
} from '@nocobase/db';
import sqlite, { type SqliteConnectionConfig } from '@nocobase/db-sqlite';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import { createAppPaths } from '@nocobase/app-server/config';
import {
  createAppDatabaseManager,
  type AppDatabaseConfig,
} from '@nocobase/app-server/database';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureExternalCrmSampleDatabase } from '../../server/providers/external-crm-sample.js';
import { externalCrmRoutes } from '../../server/routes/external-crm.js';

let directory: string;
let database: NonNullable<ReturnType<typeof createAppDatabaseManager>>;

// Resolving paths against the template root is what makes the default
// metadata source database/externalCrm/metadata/<name>.json — the
// committed files — apply, exactly as it does for the running application.
const paths = createAppPaths({
  rootDir: path.resolve(import.meta.dirname, '../..'),
});

beforeEach(async () => {
  directory = mkdtempSync(
    path.join(tmpdir(), 'nocobase-examples-external-crm-'),
  );
  const config: AppDatabaseConfig<SqliteConnectionConfig> = {
    default: 'main',
    drivers: { sqlite },
    connections: {
      main: { dialect: 'sqlite', filename: ':memory:' },
      externalCrm: {
        dialect: 'sqlite',
        filename: path.join(directory, 'crm.sqlite'),
        schemaManagement: 'external',
        naming: { underscored: true, tablePrefix: 'crm_' },
      },
    },
  };
  database = createAppDatabaseManager(config, paths)!;
  // The provider does this at boot; here the test plays the foreign system.
  const created = await ensureExternalCrmSampleDatabase(
    database.connection('externalCrm'),
  );
  if (!created) throw new Error('expected the stand-in CRM to be created');
});

afterEach(async () => {
  await database.destroy();
  rmSync(directory, { recursive: true, force: true });
});

describe('external CRM example', () => {
  it('creates the stand-in database once and leaves it alone afterwards', async () => {
    expect(
      await ensureExternalCrmSampleDatabase(database.connection('externalCrm')),
    ).toBe(false);
    const orders = await database
      .repository('orders', 'externalCrm')
      .findMany({ sort: (sort) => sort.field('id').asc() });
    expect(orders.map((order) => order.orderNo)).toEqual([
      'CRM-1001',
      'CRM-1002',
      'CRM-1003',
      'CRM-1004',
    ]);
  });

  it('resolves the CRM tables to Collections through naming and metadata', async () => {
    const orders = await database.collections('externalCrm').get('orders');
    // Title, field titles and the relation all come from the committed
    // database/externalCrm/metadata/orders.json.
    expect(orders).toMatchObject({
      name: 'orders',
      title: 'CRM orders',
      naming: { underscored: true, tablePrefix: 'crm_' },
    });
    expect(orders?.fields?.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        'id',
        'customerId',
        'orderNo',
        'totalAmount',
        'status',
        'placedAt',
        'customer',
      ]),
    );
    expect(
      orders?.fields?.find((field) => field.name === 'customer'),
    ).toMatchObject({
      type: 'belongsTo',
      target: 'customers',
      title: 'Customer',
    });
    expect(
      orders?.fields?.find((field) => field.name === 'orderNo'),
    ).toMatchObject({ title: 'Order number' });
  });

  it('refuses schema changes on the external connection', async () => {
    await expect(
      database
        .builder('externalCrm')
        .createCollection('notes', (collection) => {
          collection.increments('id');
        }),
    ).rejects.toBeInstanceOf(SchemaManagementNotAllowedError);
  });

  it('exposes read-only repository routes that require a signed-in user', async () => {
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    const auth = new Auth({
      connection: database.connection(),
      secret: 'external-crm-test-secret-at-least-32-characters',
      baseURL: 'http://example.test',
    });
    vi.spyOn(auth, 'getSession').mockImplementation(async (headers) =>
      headers.get('x-test-user')
        ? {
            user: {
              id: 'tester',
              name: 'Tester',
              email: 'tester@example.test',
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            session: {
              id: 'session',
              token: 'token',
              userId: 'tester',
              expiresAt: new Date(Date.now() + 60000),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          }
        : null,
    );
    container.instance(authenticationToken, auth);
    const router = new Hono();
    router.route(
      '/main/api',
      await externalCrmRoutes.createRouter({ container } as Application),
    );
    const post = (action: string, body: unknown, signedIn = true) =>
      router.request(`/main/api/${action}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(signedIn ? { 'x-test-user': 'tester' } : {}),
        },
        body: JSON.stringify(body),
      });

    // Every exposed action rejects an anonymous caller.
    for (const name of ['crmCustomers', 'crmOrders'])
      for (const action of [
        'findMany',
        'findOne',
        'count',
        'exists',
        'aggregate',
        'groupBy',
      ]) {
        const anonymous = await post(`${name}/${action}`, {}, false);
        expect(anonymous.status).toBe(401);
        expect(
          ((await anonymous.json()) as { error: { status: string } }).error
            .status,
        ).toBe('UNAUTHENTICATED');
      }

    const listed = await post('crmOrders/findMany', {
      filter: { status: 'paid' },
      sort: {
        kind: 'sort',
        version: 1,
        items: [{ kind: 'field', path: ['id'], direction: 'asc' }],
      },
      select: {
        kind: 'select',
        version: 1,
        root: {
          kind: 'selection',
          fields: ['id', 'orderNo', 'totalAmount'],
          includes: [
            {
              kind: 'include',
              relation: 'customer',
              select: { kind: 'selection', fields: ['id', 'displayName'] },
            },
          ],
        },
      },
    });
    expect(listed.status).toBe(200);
    const payload = (await listed.json()) as {
      data: Array<Record<string, unknown>>;
    };
    expect(payload.data.map((order) => order.orderNo)).toEqual([
      'CRM-1001',
      'CRM-1003',
    ]);
    expect(payload.data[0].customer).toMatchObject({
      displayName: 'Ada Lovelace',
    });

    const counted = await post('crmCustomers/count', {});
    expect(counted.status).toBe(200);
    expect(((await counted.json()) as { data: unknown }).data).toBe(3);

    // Writes are not exposed at all rather than exposed and denied.
    expect(
      (await post('crmOrders/createOne', { values: { orderNo: 'x' } })).status,
    ).toBe(404);
  });

  it('answers 503 DATABASE_UNAVAILABLE without a database', async () => {
    const unavailable = await externalCrmRoutes.createRouter({
      container: new ServiceContainer(),
    } as Application);
    const response = await unavailable.request('/crmOrders/findMany', {
      method: 'POST',
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'UNAVAILABLE',
        reason: 'DATABASE_UNAVAILABLE',
        domain: 'app',
      },
    });
  });
});

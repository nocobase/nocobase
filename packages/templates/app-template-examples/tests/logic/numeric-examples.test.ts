// @vitest-environment node
import path from 'node:path';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { numericExamplesRoutes } from '../../server/routes/numeric-examples.js';

let testDatabase: TestDatabase;
let database: DatabaseManager;
let router: Hono;
const source = (kind: string) => ({
  connection: 'main',
  directory: path.resolve(import.meta.dirname, '../../database/main', kind),
  packageName: 'analytics-test',
});
beforeEach(async () => {
  testDatabase = await createTestDatabase();
  database = testDatabase.database;
  await database.createMigrator(source('migrations')).latest();
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  const auth = new Auth({
    connection: database.connection(),
    secret: 'analytics-test-secret-at-least-32-characters',
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
  router = new Hono();
  router.route(
    '/main/api',
    await numericExamplesRoutes.createRouter({ container } as Application),
  );
  router.get('/main/api/unrelated', (c) => c.text('public'));
});
afterEach(async () => {
  await testDatabase?.destroy();
});

function request(source = 'query', sample = 'all', authenticated = true) {
  return router.request(
    `/main/api/numericExamples?source=${source}&sample=${sample}`,
    {
      headers: authenticated ? { 'x-test-user': 'tester' } : {},
    },
  );
}

it('creates numeric schema and metadata and reverses the migration', async () => {
  const collections = database.connection().collections;
  const physical = await collections.getPhysical('numericExamples');
  expect(physical?.columns.map((column) => column.columnName)).toEqual([
    'id',
    'sample',
    'integer_value',
    'bigint_value',
    'decimal_value',
    'float_value',
    'double_value',
  ]);
  expect(physical?.indexes).toContainEqual(
    expect.objectContaining({
      unique: true,
      keys: [expect.objectContaining({ columnName: 'sample' })],
    }),
  );
  expect((await collections.get('numericExamples'))?.fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'bigintValue', type: 'bigInt' }),
      expect.objectContaining({
        name: 'decimalValue',
        type: 'decimal',
        nullable: true,
      }),
    ]),
  );
  expect(
    (await database.createMigrator(source('migrations')).latest()).executed,
  ).toEqual([]);
  await database.createMigrator(source('migrations')).rollback();
  expect(await collections.getPhysical('numericExamples')).toBeUndefined();
  expect(await collections.get('numericExamples')).toBeUndefined();
});

it('seeds exact adjacent integers and preserves edits on repeat runs', async () => {
  const seeder = database.createSeeder(source('seeds'));
  await seeder.run();
  const repository = database.repository('numericExamples');
  expect(await repository.count()).toBe(7);
  expect(
    await repository.findOne({ filter: { sample: 'adjacent' } }),
  ).toMatchObject({ bigintValue: '9007199254740993', decimalValue: '0.125' });
  await repository.updateOne({
    filter: { sample: 'small' },
    values: { integerValue: 99 },
  });
  expect((await seeder.run()).executed).toEqual([]);
  await database
    .createSeeder({ ...source('seeds'), tableName: 'numericReplayHistory' })
    .run();
  expect(await repository.count()).toBe(7);
  expect(
    await repository.findOne({ filter: { sample: 'small' } }),
  ).toMatchObject({ integerValue: 99 });
  await expect(
    repository.createOne({ values: { sample: 'small' } }),
  ).rejects.toThrow();
});

it('requires authentication, validates options, and exposes no writes', async () => {
  expect((await request('query', 'all', false)).status).toBe(401);
  const invalid = await request('raw');
  expect(invalid.status).toBe(400);
  expect(await invalid.json()).toMatchObject({
    error: {
      reason: 'INVALID_INPUT',
      fieldViolations: [expect.objectContaining({ field: 'source' })],
    },
  });
  expect((await request('query', 'unknown')).status).toBe(400);
  // `orderBy` is AIP-132: known fields only, each at most once, ` desc` the only suffix.
  for (const orderBy of ['sample', 'id asc', 'id desc,id', 'id,', '-id']) {
    const refused = await router.request(
      `/main/api/numericExamples?orderBy=${encodeURIComponent(orderBy)}`,
      { headers: { 'x-test-user': 'tester' } },
    );
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'orderBy' })],
      },
    });
  }
  expect(
    (
      await router.request('/main/api/numericExamples', {
        method: 'POST',
        headers: { 'x-test-user': 'tester' },
      })
    ).status,
  ).toBe(404);
  expect((await router.request('/main/api/unrelated')).status).toBe(200);
  const unavailable = await numericExamplesRoutes.createRouter({
    container: new ServiceContainer(),
  } as Application);
  const response = await unavailable.request('/numericExamples');
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({
    error: {
      status: 'UNAVAILABLE',
      reason: 'DATABASE_UNAVAILABLE',
      domain: 'examples',
    },
  });
});

it.each(['query', 'repository'])(
  'returns real JSON numeric types and aggregates through %s',
  async (sourceName) => {
    await database.createSeeder(source('seeds')).run();
    const response = await request(sourceName);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({
      data: {
        dialect: testDatabase.dialect,
        source: sourceName,
        rows: expect.arrayContaining([
          expect.objectContaining({
            sample: 'small',
            integerValue: 42,
            bigintValue: '42',
            decimalValue: '42',
            floatValue: 42,
            doubleValue: 42,
          }),
          expect.objectContaining({
            sample: 'adjacent',
            bigintValue: '9007199254740993',
          }),
          expect.objectContaining({
            sample: 'large',
            bigintValue: '9007199254740992',
            decimalValue: '100000000000000.25',
          }),
        ]),
        aggregates: expect.arrayContaining([
          {
            field: 'bigintValue',
            count: 6,
            sum: '18014398509481986',
            avg: '3002399751580331',
            min: '-42',
            max: '9007199254740993',
          },
          expect.objectContaining({
            field: 'integerValue',
            count: 6,
            sum: '0',
            min: -2147483648,
            max: 2147483647,
          }),
          expect.objectContaining({
            field: 'floatValue',
            count: 6,
            min: -42.5,
            max: 42,
          }),
          expect.objectContaining({
            field: 'doubleValue',
            count: 6,
            min: -42.5,
            max: 42,
          }),
        ]),
      },
    });
  },
);

it.each(['query', 'repository'])(
  'distinguishes null fields from empty input through %s',
  async (sourceName) => {
    await database.createSeeder(source('seeds')).run();
    const nullResponse = await (await request(sourceName, 'null')).json();
    expect(nullResponse.data.rows).toHaveLength(1);
    expect(nullResponse.data.aggregates).toContainEqual({
      field: 'decimalValue',
      count: 0,
      sum: null,
      avg: null,
      min: null,
      max: null,
    });
    expect(nullResponse.data.aggregates).toContainEqual(
      expect.objectContaining({ field: 'id', count: 1 }),
    );
    const emptyResponse = await (await request(sourceName, 'empty')).json();
    expect(emptyResponse.data.rows).toEqual([]);
    expect(emptyResponse.data.aggregates).toHaveLength(6);
    for (const aggregate of emptyResponse.data.aggregates)
      expect(aggregate).toMatchObject({
        count: 0,
        sum: null,
        avg: null,
        min: null,
        max: null,
      });
  },
);

it.each(['query', 'repository'])(
  'orders by every key of an AIP-132 orderBy through %s',
  async (sourceName) => {
    await database.createSeeder(source('seeds')).run();
    const response = await router.request(
      `/main/api/numericExamples?source=${sourceName}&orderBy=${encodeURIComponent('integerValue desc,id')}`,
      { headers: { 'x-test-user': 'tester' } },
    );
    expect(response.status).toBe(200);
    const { rows } = (await response.json()).data as {
      rows: { id: number | string; integerValue: number | null }[];
    };
    const ranked = rows.filter((row) => row.integerValue !== null);
    expect(ranked.map((row) => row.integerValue)).toEqual(
      [...ranked.map((row) => row.integerValue)].sort(
        (left, right) => (right ?? 0) - (left ?? 0),
      ),
    );
  },
);

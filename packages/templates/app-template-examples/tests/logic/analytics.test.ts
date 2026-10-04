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
import { analyticsRoutes } from '../../server/routes/analytics.js';

let testDatabase: TestDatabase;
let database: DatabaseManager;
let router: Hono;
const source = (kind: string) => ({
  connection: 'analytics',
  directory: path.resolve(
    import.meta.dirname,
    '../../database/analytics',
    kind,
  ),
  packageName: 'analytics-test',
});
beforeEach(async () => {
  testDatabase = await createTestDatabase({
    connections: ['main', 'analytics'],
  });
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
    await analyticsRoutes.createRouter({ container } as Application),
  );
  router.get('/main/api/unrelated', (c) => c.text('public'));
});
afterEach(async () => {
  await testDatabase?.destroy();
});

function request(
  repository: string,
  action: string,
  input: object = {},
  authenticated = true,
) {
  return router.request(`/main/api/${repository}/${action}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authenticated ? { 'x-test-user': 'tester' } : {}),
    },
    body: JSON.stringify(input),
  });
}

it('keeps database-disabled application routes available without plugin services', async () => {
  const unavailable = await analyticsRoutes.createRouter({
    container: new ServiceContainer(),
  } as Application);
  unavailable.get('/unrelated', (c) => c.text('public'));
  const response = await unavailable.request('/analyticsChannels/findMany', {
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
  expect((await unavailable.request('/unrelated')).status).toBe(200);
});

it('creates physical schema and relation metadata only in analytics and rolls back', async () => {
  const collections = database.connection('analytics').collections;
  expect(
    await database.connection().collections.getPhysical('channels'),
  ).toBeUndefined();
  const channels = await collections.getPhysical('channels');
  expect(channels?.indexes).toContainEqual(
    expect.objectContaining({
      unique: true,
      keys: [expect.objectContaining({ columnName: 'code' })],
    }),
  );
  const campaigns = await collections.getPhysical('campaigns');
  expect(campaigns?.foreignKeys).toContainEqual(
    expect.objectContaining({ columns: ['channel_id'], onDelete: 'restrict' }),
  );
  const metrics = await collections.getPhysical('dailyMetrics');
  expect(metrics?.columns).toContainEqual(
    expect.objectContaining({
      columnName: 'spend_cents',
      dataType: 'integer',
      nullable: false,
    }),
  );
  expect(metrics?.indexes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        unique: true,
        keys: [
          expect.objectContaining({ columnName: 'campaign_id' }),
          expect.objectContaining({ columnName: 'date' }),
        ],
      }),
      expect.objectContaining({
        keys: [expect.objectContaining({ columnName: 'date' })],
      }),
    ]),
  );
  expect(metrics?.foreignKeys).toContainEqual(
    expect.objectContaining({ columns: ['campaign_id'], onDelete: 'cascade' }),
  );
  expect((await collections.get('campaigns'))?.fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'channel',
        type: 'belongsTo',
        target: 'channels',
      }),
      expect.objectContaining({
        name: 'dailyMetrics',
        type: 'hasMany',
        target: 'dailyMetrics',
      }),
    ]),
  );
  const migrator = database.createMigrator(source('migrations'));
  expect((await migrator.latest()).executed).toEqual([]);
  expect((await migrator.rollback()).rolledBack).toEqual([
    '202609090001_create_analytics',
  ]);
  for (const name of ['channels', 'campaigns', 'dailyMetrics']) {
    expect(await collections.get(name)).toBeUndefined();
    expect(await collections.getPhysical(name)).toBeUndefined();
  }
});

it('seeds deterministic records, preserves edits on replay, and enforces uniqueness', async () => {
  const seeder = database.createSeeder(source('seeds'));
  expect((await seeder.run()).executed).toHaveLength(1);
  const channels = database.repository('channels', 'analytics');
  const campaigns = database.repository('campaigns', 'analytics');
  const metrics = database.repository('dailyMetrics', 'analytics');
  expect(await channels.count()).toBe(3);
  expect(await campaigns.count()).toBe(4);
  expect(await metrics.count()).toBe(12);
  await channels.updateOne({
    filter: { id: 'channel-search' },
    values: { name: 'Edited' },
  });
  await metrics.deleteOne({ filter: { id: 'campaign-draft-2026-09-06' } });
  expect((await seeder.run()).executed).toEqual([]);
  expect(await metrics.count()).toBe(11);
  await database
    .createSeeder({ ...source('seeds'), tableName: 'replayedSeedHistory' })
    .run();
  expect(await channels.count()).toBe(3);
  expect(await metrics.count()).toBe(12);
  expect(
    await channels.findOne({ filter: { id: 'channel-search' } }),
  ).toMatchObject({ name: 'Edited' });
  await expect(
    channels.createOne({
      values: { id: 'duplicate', name: 'Duplicate', code: 'search' },
    }),
  ).rejects.toThrow();
  await expect(
    metrics.createOne({
      values: {
        id: 'duplicate',
        campaignId: 'campaign-search',
        date: '2026-09-06',
      },
    }),
  ).rejects.toThrow();
});

it('guards all actions, rejects forbidden writes, and leaves unrelated resources unexposed', async () => {
  for (const repository of [
    'analyticsChannels',
    'analyticsCampaigns',
    'analyticsDailyMetrics',
  ]) {
    for (const action of [
      'findMany',
      'findOne',
      'count',
      'exists',
      'aggregate',
      'groupBy',
      'createOne',
      'updateOne',
      'deleteOne',
    ]) {
      expect((await request(repository, action, {}, false)).status).toBe(401);
    }
  }
  expect((await router.request('/main/api/unrelated')).status).toBe(200);
  expect((await request('channels', 'findMany')).status).toBe(404);
  expect((await request('users', 'findMany')).status).toBe(404);
  expect(
    (await request('analyticsChannels', 'findMany', { limit: 101 })).status,
  ).toBe(400);
  expect(
    (
      await request('analyticsChannels', 'createOne', {
        values: { id: 'bad', name: 'Bad', code: 'bad', secret: 'unknown' },
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request('analyticsCampaigns', 'createOne', {
        values: { id: 'bad', name: 'Bad', channelId: 'channel-search' },
      })
    ).status,
  ).toBe(403);
});

it('reads relations, aggregates and groups seeded metrics through the analytics HTTP endpoints', async () => {
  await database.createSeeder(source('seeds')).run();
  // A same-named collection in main must never be used by these endpoints.
  await database.builder().createCollection('channels', (c) => {
    c.string('id').primary();
    c.string('name');
  });
  await database
    .query()
    .insertInto('channels')
    .values({ id: 'main-only', name: 'Main' })
    .execute();
  expect(await (await request('analyticsChannels', 'count')).json()).toEqual({
    data: 3,
  });
  expect(
    await (
      await request('analyticsCampaigns', 'exists', {
        filter: { id: 'campaign-draft' },
      })
    ).json(),
  ).toEqual({ data: true });
  const selected = await request('analyticsCampaigns', 'findOne', {
    filter: { id: 'campaign-search' },
    select: {
      kind: 'select',
      version: 1,
      root: {
        kind: 'selection',
        fields: ['id', 'name'],
        includes: [
          {
            kind: 'include',
            relation: 'channel',
            select: { kind: 'selection', fields: ['code'] },
          },
          {
            kind: 'include',
            relation: 'dailyMetrics',
            select: { kind: 'selection', fields: ['date', 'clicks'] },
          },
        ],
      },
    },
  });
  expect(selected.status).toBe(200);
  expect(await selected.json()).toMatchObject({
    data: {
      channel: { code: 'search' },
      dailyMetrics: expect.arrayContaining([
        { date: '2026-09-06', clicks: 480 },
      ]),
    },
  });
  const aggregate = {
    kind: 'aggregate',
    version: 1,
    items: [
      { kind: 'count', alias: 'count' },
      { kind: 'sum', field: 'spendCents', alias: 'spendCents' },
      { kind: 'sum', field: 'revenueCents', alias: 'revenueCents' },
    ],
  };
  expect(
    await (
      await request('analyticsDailyMetrics', 'aggregate', { aggregate })
    ).json(),
  ).toEqual({
    data: { count: 12, spendCents: '186000', revenueCents: '1344000' },
  });
  const grouped = await request('analyticsDailyMetrics', 'groupBy', {
    by: ['campaignId'],
    aggregate,
  });
  expect(grouped.status).toBe(200);
  expect(await grouped.json()).toMatchObject({
    data: expect.arrayContaining([
      {
        campaignId: 'campaign-search',
        count: 3,
        spendCents: '108000',
        revenueCents: '576000',
      },
      {
        campaignId: 'campaign-draft',
        count: 3,
        spendCents: '0',
        revenueCents: '0',
      },
    ]),
  });
  expect(await database.repository('channels').count()).toBe(1);
});

it('creates, edits and deletes related records with server-owned write policies', async () => {
  expect(
    (
      await request('analyticsChannels', 'createOne', {
        values: { id: 'c', name: 'Test', code: 'test' },
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request('analyticsCampaigns', 'createOne', {
        values: { id: 'p', name: 'Test', channel: { connect: { id: 'c' } } },
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request('analyticsDailyMetrics', 'createOne', {
        values: {
          id: 'm',
          date: '2026-09-09',
          clicks: 10,
          campaign: { connect: { id: 'p' } },
        },
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request('analyticsDailyMetrics', 'updateOne', {
        filter: { id: 'm' },
        values: { clicks: 20 },
      })
    ).status,
  ).toBe(200);
  expect(
    await (
      await request('analyticsDailyMetrics', 'findMany', {
        filter: { id: 'm' },
      })
    ).json(),
  ).toMatchObject({
    data: [expect.objectContaining({ clicks: 20, campaignId: 'p' })],
  });
  expect(
    (
      await request('analyticsDailyMetrics', 'updateOne', {
        filter: { id: 'm' },
        values: { id: 'renamed' },
      })
    ).status,
  ).toBe(403);
  expect(
    (await request('analyticsCampaigns', 'deleteOne', { filter: { id: 'p' } }))
      .status,
  ).toBe(200);
  expect(
    await (await request('analyticsDailyMetrics', 'count')).json(),
  ).toEqual({ data: 0 });
  expect(
    (await request('analyticsChannels', 'deleteOne', { filter: { id: 'c' } }))
      .status,
  ).toBe(200);
});

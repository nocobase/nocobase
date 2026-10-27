import { randomUUID } from 'node:crypto';
import { ServiceContainer } from '@nocobase/service-provider';
import { databaseManagerToken, type DatabaseConnection } from '@nocobase/db';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/db-testing';
import { Hono } from 'hono';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  executeIdempotentMutation,
  pruneMutationReceipts,
  defineRepositoryApiRoutes,
  ApiError,
} from '../src/router/index.js';

const key = () => `${Date.now()}.${randomUUID()}`;
describe('transactional operation receipts', () => {
  let provisioned: ProvisionedTestDatabases;
  let fixture: TestDatabase;
  let connection: DatabaseConnection;
  beforeAll(async () => {
    provisioned = await provisionTestDatabases();
  });
  afterAll(async () => {
    await provisioned?.drop();
  });
  beforeEach(async () => {
    fixture = await provisioned.open();
    connection = fixture.database.connection();
    await connection.builder.createCollection('mutationReceipts', (c) => {
      c.string('id', { length: 64 }).primary();
      c.string('digest', { length: 64 }).notNull();
      c.json('result').nullable();
      c.datetime('expiresAt').notNull();
      c.index('expiresAt');
    });
    await connection.builder.createCollection('orders', (c) => {
      c.string('id').primary();
      c.string('status').notNull();
    });
    await connection.builder.createCollection('effects', (c) => {
      c.string('id').primary();
    });
  });
  afterEach(async () => {
    await fixture?.destroy();
  });
  function operation(operationKey = key()) {
    return {
      connection,
      key: operationKey,
      principal: 'alice',
      operation: 'orders/createOne',
      input: { status: 'draft' },
      authorize: () => undefined,
      authorizeReplay: () => undefined,
      execute: async (tx: DatabaseConnection) => {
        const id = randomUUID();
        await tx
          .repository('orders')
          .createOne({ values: { id, status: 'draft' } });
        await tx.repository('effects').createOne({ values: { id } });
        return { id };
      },
    };
  }
  it('commits one write and effect for concurrent attempts and a lost-response retry', async () => {
    const request = operation();
    const attempts = await Promise.all(
      Array.from({ length: 8 }, () => executeIdempotentMutation(request)),
    );
    expect(new Set(attempts.map((r) => r.data.id)).size).toBe(1);
    expect(attempts.filter((r) => !r.replayed)).toHaveLength(1);
    expect(await connection.repository('orders').count()).toBe(1);
    expect(await connection.repository('effects').count()).toBe(1);
    expect(await executeIdempotentMutation(request)).toEqual({
      data: attempts[0].data,
      replayed: true,
    });
    await executeIdempotentMutation(operation());
    expect(await connection.repository('orders').count()).toBe(2);
  });
  it('rolls back the receipt, business data and effect together and permits retry', async () => {
    const request = operation();
    await expect(
      executeIdempotentMutation({
        ...request,
        execute: async (tx) => {
          await request.execute(tx);
          throw new Error('Rejected');
        },
      }),
    ).rejects.toThrow('Rejected');
    expect(await connection.repository('orders').count()).toBe(0);
    expect(await connection.repository('effects').count()).toBe(0);
    expect(await connection.repository('mutationReceipts').count()).toBe(0);
    expect((await executeIdempotentMutation(request)).replayed).toBe(false);
  });
  it('isolates identities and operations, rejects changed payload and rechecks authorization', async () => {
    const request = operation();
    await executeIdempotentMutation(request);
    await expect(
      executeIdempotentMutation({ ...request, input: { status: 'different' } }),
    ).rejects.toMatchObject({ reason: 'OPERATION_CONFLICT' });
    await expect(
      executeIdempotentMutation({
        ...request,
        authorize: () => {
          throw new Error('Revoked');
        },
      }),
    ).rejects.toThrow('Revoked');
    await expect(
      executeIdempotentMutation({
        ...request,
        authorizeReplay: () => {
          throw new Error('Hidden');
        },
      }),
    ).rejects.toThrow('Hidden');
    await executeIdempotentMutation({ ...request, principal: 'bob' });
    await executeIdempotentMutation({ ...request, operation: 'other/action' });
    expect(await connection.repository('orders').count()).toBe(3);
  });
  it('rejects expired keys even after bounded cleanup and future or malformed keys', async () => {
    const request = operation();
    await executeIdempotentMutation(request);
    await connection.query
      .updateTable('mutationReceipts')
      .set({ expiresAt: new Date(0) })
      .where('expiresAt', '>', new Date(0))
      .execute();
    expect(await pruneMutationReceipts(connection, 1)).toBe(1);
    await expect(
      executeIdempotentMutation({
        ...request,
        key: `${Date.now() - 86_400_001}.${randomUUID()}`,
      }),
    ).rejects.toMatchObject({ reason: 'OPERATION_EXPIRED' });
    await expect(
      executeIdempotentMutation({
        ...request,
        key: `${Date.now() + 120_000}.${randomUUID()}`,
      }),
    ).rejects.toMatchObject({ reason: 'OPERATION_CLOCK_SKEW' });
    await expect(
      executeIdempotentMutation({ ...request, key: 'invalid' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
  it('stores results larger than a short text column without weakening atomicity', async () => {
    const request = operation();
    const large = { note: 'x'.repeat(70_000) };
    const result = await executeIdempotentMutation({
      ...request,
      execute: async (tx) => {
        await request.execute(tx);
        return large;
      },
    });
    expect(result.data.note).toHaveLength(70_000);
    expect(
      (
        await executeIdempotentMutation({
          ...request,
          execute: async () => large,
        })
      ).data,
    ).toEqual(large);
    expect(await connection.repository('orders').count()).toBe(1);
  });
  it('supports an explicit compatibility phase and isolates record targets in strict mode', async () => {
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, fixture.database);
    const make = async (required: boolean) =>
      new Hono().route(
        '/api',
        await defineRepositoryApiRoutes({
          idempotency: { required, principal: () => 'alice' },
          repositories: [
            {
              name: 'orders',
              policy: { read: true, create: true, update: true, delete: true },
              actions: { createOne: {}, updateOne: {}, deleteOne: {} },
            },
          ],
        }).createRouter({ container }),
      );
    const compatible = await make(false);
    const request = (
      router: Hono,
      action: string,
      input: unknown,
      operationKey?: string,
    ) =>
      router.request(`/api/orders/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(operationKey ? { 'Idempotency-Key': operationKey } : {}),
        },
        body: JSON.stringify(input),
      });
    expect(
      (
        await request(compatible, 'createOne', {
          values: { id: 'one', status: 'draft' },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(compatible, 'createOne', {
          values: { id: 'two', status: 'draft' },
        })
      ).status,
    ).toBe(200);
    expect(await connection.repository('mutationReceipts').count()).toBe(0);
    const strict = await make(true);
    const sharedKey = key();
    for (const id of ['one', 'two']) {
      const response = await request(
        strict,
        'updateOne',
        { filter: { id }, values: { status: 'updated' } },
        sharedKey,
      );
      expect(response.status).toBe(200);
    }
    const conflict = await request(
      strict,
      'updateOne',
      { filter: { id: 'one' }, values: { status: 'changed' } },
      sharedKey,
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: { reason: 'OPERATION_CONFLICT' },
    });
    const deleteKey = key();
    expect(
      (await request(strict, 'deleteOne', { filter: { id: 'two' } }, deleteKey))
        .status,
    ).toBe(200);
    expect(
      (
        await request(strict, 'deleteOne', { filter: { id: 'two' } }, deleteKey)
      ).headers.get('Idempotency-Replayed'),
    ).toBe('true');
    expect(await connection.repository('orders').count()).toBe(1);
  });
  it('refuses a historical response when the current read scope no longer contains its record', async () => {
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, fixture.database);
    const router = new Hono().route(
      '/api',
      await defineRepositoryApiRoutes({
        idempotency: { required: true, principal: () => 'alice' },
        repositories: [
          {
            name: 'orders',
            policy: {
              read: { scope: { status: 'draft' }, fields: ['id', 'status'] },
              create: true,
              update: true,
              delete: true,
            },
            actions: { createOne: {}, deleteOne: {} },
          },
        ],
      }).createRouter({ container }),
    );
    const operationKey = key();
    const request = () =>
      router.request('/api/orders/createOne', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': operationKey,
        },
        body: JSON.stringify({ values: { id: 'one', status: 'draft' } }),
      });
    expect((await request()).status).toBe(200);
    expect((await request()).headers.get('Idempotency-Replayed')).toBe('true');
    await connection
      .repository('orders')
      .updateOne({ filter: { id: 'one' }, values: { status: 'private' } });
    const response = await request();
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { reason: 'REPLAY_FORBIDDEN' },
    });
    await connection
      .repository('orders')
      .updateOne({ filter: { id: 'one' }, values: { status: 'draft' } });
    const deletionKey = key();
    const remove = () =>
      router.request('/api/orders/deleteOne', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': deletionKey,
        },
        body: JSON.stringify({ filter: { id: 'one' } }),
      });
    const deleted = await remove();
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ data: { deleted: true } });
    const repeated = await remove();
    expect(repeated.status).toBe(200);
    expect(await repeated.json()).toEqual({ data: { deleted: true } });
  });
  it('measures receipt work on fresh execution and replay without logging request data', async () => {
    const queries: string[] = [];
    const client = await connection.client<{
      on(event: string, listener: (query: { sql: string }) => void): void;
      removeListener(
        event: string,
        listener: (query: { sql: string }) => void,
      ): void;
    }>();
    const observe = ({ sql }: { sql: string }) => {
      queries.push(sql);
    };
    client.on('query', observe);
    try {
      const request = operation();
      await executeIdempotentMutation(request);
      const first = queries.filter((sql) => /mutation_?receipts/i.test(sql));
      expect(first.filter((sql) => /^select/i.test(sql))).toHaveLength(1);
      expect(first.filter((sql) => /^insert/i.test(sql))).toHaveLength(1);
      expect(first.filter((sql) => /^update/i.test(sql))).toHaveLength(1);
      const firstTransactions = queries.filter((sql) =>
        /^begin/i.test(sql),
      ).length;
      expect(firstTransactions).toBe(1);
      queries.length = 0;
      await executeIdempotentMutation(request);
      const replay = queries.filter((sql) => /mutation_?receipts/i.test(sql));
      expect(replay).toHaveLength(1);
      expect(replay[0]).toMatch(/^select/i);
      console.info(
        JSON.stringify({
          dialect: connection.dialect,
          receiptCost: {
            first: {
              selects: 1,
              inserts: 1,
              updates: 1,
              outerTransactions: firstTransactions,
            },
            replay: { selects: 1, writes: 0 },
          },
        }),
      );
    } finally {
      client.removeListener('query', observe);
    }
  });
  it('runs protected production repository routes with the effective policy in the receipt transaction', async () => {
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, fixture.database);
    let allowed = true;
    const contribution = defineRepositoryApiRoutes({
      idempotency: { required: true, principal: () => 'alice' },
      principal: () => 'alice',
      repositories: [
        {
          name: 'orders',
          policy: () => ({
            read: true,
            create: allowed,
            update: allowed,
            delete: allowed,
          }),
          actions: { createOne: {}, updateOne: {}, deleteOne: {} },
        },
      ],
    });
    const router = new Hono().route(
      '/api',
      await contribution.createRouter({ container }),
    );
    const request = (action: string, input: unknown, operationKey?: string) =>
      router.request(`/api/orders/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(operationKey ? { 'Idempotency-Key': operationKey } : {}),
        },
        body: JSON.stringify(input),
      });
    expect(
      (await request('createOne', { values: { id: 'one', status: 'draft' } }))
        .status,
    ).toBe(400);
    const createKey = key();
    const input = { values: { id: 'one', status: 'draft' } };
    const first = await request('createOne', input, createKey);
    expect(first.status).toBe(200);
    const replay = await request('createOne', input, createKey);
    expect(await replay.json()).toEqual(await first.json());
    expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
    const updateKey = key();
    const update = { filter: { id: 'one' }, values: { status: 'approved' } };
    expect((await request('updateOne', update, updateKey)).status).toBe(200);
    expect(
      (await request('updateOne', update, updateKey)).headers.get(
        'Idempotency-Replayed',
      ),
    ).toBe('true');
    allowed = false;
    expect((await request('createOne', input, createKey)).status).toBe(403);
    expect((await request('updateOne', update, key())).status).toBe(403);
    expect(await connection.repository('orders').count()).toBe(1);
  });
});

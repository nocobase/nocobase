// db-test-portability: dialect-specific — the pgvector store runs against a PostgreSQL server of its own, named by AGENTS_PGVECTOR_URL
/**
 * The pgvector store. Its configuration and availability run everywhere, against a mocked client; the store itself
 * runs against a real PostgreSQL with pgvector when `AGENTS_PGVECTOR_URL` is set to `postgres://user:password@host:port`
 * (for example a `pgvector/pgvector:pg17` container). Each run creates and drops its own database, which the store
 * reaches with its own connection settings while the vector registry stays in the application's test database.
 */
import path from 'node:path';

import { createTestDatabase } from '@nocobase/app-testing/server';
import { createDatabaseManager, type DatabaseManager } from '@nocobase/db';
import postgres from '@nocobase/db-postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTxRunner } from '../server/kernel/tx.js';
import {
  createPgvectorStore,
  createVectors,
  pgvectorConnectionOf,
  pgvectorTargetOf,
  type VectorStore,
} from '../server/vectors/index.js';

const URL_ENV = process.env.AGENTS_PGVECTOR_URL;
type Raw = { raw(sql: string): Promise<unknown> };
const paths = { root: '/app', storage: '/app/storage' };

describe('pgvector configuration', () => {
  it('takes its own connection settings, never the application database', () => {
    expect(pgvectorConnectionOf({})).toBeNull();
    expect(pgvectorConnectionOf({ connection: 'main' })).toBeNull();
    expect(
      pgvectorConnectionOf({
        url: 'postgres://vec:secret@db.internal:6543/vectors',
        ssl: true,
      }),
    ).toEqual({
      connectionString: 'postgres://vec:secret@db.internal:6543/vectors',
      ssl: true,
    });
    expect(
      pgvectorConnectionOf({
        host: 'db.internal',
        port: 6543,
        database: 'vectors',
        user: 'vec',
        password: 'secret',
        ssl: { rejectUnauthorized: false },
      }),
    ).toEqual({
      host: 'db.internal',
      port: 6543,
      database: 'vectors',
      user: 'vec',
      password: 'secret',
      ssl: { rejectUnauthorized: false },
    });
  });

  it('names its target without the password or the query', () => {
    expect(
      pgvectorTargetOf({
        url: 'postgres://vec:secret@db.internal:6543/vectors?sslpassword=x',
      }),
    ).toBe('postgres://vec@db.internal:6543/vectors');
    expect(
      pgvectorTargetOf({
        host: 'db.internal',
        database: 'vectors',
        user: 'vec',
        password: 'secret',
      }),
    ).toBe('postgres://vec@db.internal:5432/vectors');
    expect(pgvectorTargetOf({})).toBe('postgres://(not configured)');
  });

  it('says why it is unavailable with a code', async () => {
    expect(
      await createPgvectorStore({ config: {}, paths }).available(),
    ).toMatchObject({ ok: false, code: 'PGVECTOR_NOT_CONFIGURED' });

    const made: Record<string, unknown>[] = [];
    const client =
      (fail: 'connect' | 'extension' | null) =>
      (config: Record<string, unknown>) => {
        made.push(config);
        const raw = (sql: string) => {
          if (fail === 'connect')
            return Promise.reject(new Error('connect ECONNREFUSED'));
          if (sql.startsWith('select extversion'))
            return Promise.resolve({ rows: [] });
          return fail === 'extension'
            ? Promise.reject(new Error('extension "vector" is not available'))
            : Promise.resolve({ rows: [] });
        };
        return {
          raw,
          transaction: () => Promise.reject(new Error('unused')),
          destroy: () => Promise.resolve(),
        };
      };
    const config = { url: 'postgres://vec:secret@db.internal/vectors' };
    expect(
      await createPgvectorStore(
        { config, paths },
        client('connect'),
      ).available(),
    ).toMatchObject({ ok: false, code: 'PGVECTOR_CONNECTION_FAILED' });
    expect(
      await createPgvectorStore(
        { config, paths },
        client('extension'),
      ).available(),
    ).toMatchObject({ ok: false, code: 'PGVECTOR_EXTENSION_MISSING' });
    const store = createPgvectorStore({ config, paths }, client(null));
    expect(await store.available()).toEqual({ ok: true });
    expect(store.target).toBe('postgres://vec@db.internal:5432/vectors');
    expect(made.at(-1)).toMatchObject({
      client: 'pg',
      connection: { connectionString: config.url },
    });
  });
});

describe.skipIf(!URL_ENV)('pgvector store', () => {
  let admin: DatabaseManager;
  let database: DatabaseManager;
  let store: VectorStore;
  let vectorsUrl: string;
  const name = `agv_test_${process.pid}_${Date.now()}`;

  beforeAll(async () => {
    const url = new URL(URL_ENV!);
    const server = {
      dialect: 'postgres',
      host: url.hostname,
      port: Number(url.port || 5432),
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
    admin = createDatabaseManager({
      drivers: { postgres },
      connections: { main: { ...server, database: 'postgres' } },
    });
    await (
      await admin.connection().client<Raw>()
    ).raw(`create database ${name}`);
    database = createDatabaseManager({
      drivers: { postgres },
      connections: { main: { ...server, database: name } },
    });
    url.pathname = `/${name}`;
    vectorsUrl = url.toString();
    store = createPgvectorStore({ config: { url: vectorsUrl }, paths });
  });

  afterAll(async () => {
    await store?.close?.();
    await database?.destroy();
    await (
      await admin.connection().client<Raw>()
    ).raw(`drop database if exists ${name}`);
    await admin.destroy();
  });

  it('creates the extension, indexes, upserts, filters before the limit, updates and deletes', async () => {
    expect(await store.available()).toEqual({ ok: true });
    await store.createIndex({
      name: 'docs_abc',
      dimension: 3,
      metric: 'cosine',
      filterable: ['space'],
    });
    await store.createIndex({
      name: 'docs_abc',
      dimension: 3,
      metric: 'cosine',
      filterable: ['space'],
    });
    // Many close items in space b, one farther in space a: the filter must apply before topK.
    await store.upsert('docs_abc', [
      ...Array.from({ length: 50 }, (_, at) => ({
        id: `b${at}`,
        vector: [1, 0, at / 1000],
        metadata: { space: 'b', n: at },
      })),
      { id: 'a1', vector: [0, 1, 0], metadata: { space: 'a', n: 1 } },
      { id: 'a2', vector: [0.5, 0.5, 0], metadata: { space: 'a', n: 2 } },
    ]);
    const near = await store.query('docs_abc', { vector: [1, 0, 0], topK: 2 });
    expect(near.map((hit) => hit.id)).toEqual(['b0', 'b1']);
    expect(near[0]!.score).toBeCloseTo(1, 5);

    const scoped = await store.query('docs_abc', {
      vector: [1, 0, 0],
      topK: 1,
      filter: { space: { in: ['a'] } },
    });
    expect(scoped.map((hit) => hit.id)).toEqual(['a2']);
    expect(scoped[0]!.metadata).toEqual({ space: 'a', n: 2 });
    expect(
      await store.query('docs_abc', {
        vector: [1, 0, 0],
        topK: 1,
        filter: { space: { in: [] } },
      }),
    ).toEqual([]);

    await store.update('docs_abc', [
      { id: 'a2', metadata: { space: 'c', n: 2 } },
    ]);
    expect(
      (
        await store.query('docs_abc', {
          vector: [1, 0, 0],
          topK: 5,
          filter: { space: 'c' },
        })
      ).map((hit) => hit.id),
    ).toEqual(['a2']);

    await store.delete('docs_abc', { ids: ['a2'] });
    await store.delete('docs_abc', { filter: { space: 'b' } });
    expect(
      (await store.query('docs_abc', { vector: [1, 0, 0], topK: 100 })).map(
        (hit) => hit.id,
      ),
    ).toEqual(['a1']);
    await store.dropIndex('docs_abc');
    await expect(
      store.query('docs_abc', { vector: [1, 0, 0], topK: 1 }),
    ).rejects.toThrow();
  });

  it('scores by the metric and keeps large dimensions as halfvec', async () => {
    await store.createIndex({ name: 'l2_x', dimension: 2, metric: 'l2' });
    await store.upsert('l2_x', [
      { id: 'p', vector: [3, 4], metadata: {} },
      { id: 'q', vector: [0, 1], metadata: {} },
    ]);
    const l2 = await store.query('l2_x', { vector: [0, 0], topK: 2 });
    expect(l2.map((hit) => [hit.id, hit.score])).toEqual([
      ['q', -1],
      ['p', -5],
    ]);

    await store.createIndex({ name: 'ip_x', dimension: 2, metric: 'ip' });
    await store.upsert('ip_x', [
      { id: 'p', vector: [3, 4], metadata: {} },
      { id: 'q', vector: [1, 0], metadata: {} },
    ]);
    const ip = await store.query('ip_x', { vector: [1, 1], topK: 2 });
    expect(ip.map((hit) => [hit.id, hit.score])).toEqual([
      ['p', 7],
      ['q', 1],
    ]);

    await store.createIndex({ name: 'big', dimension: 2500, metric: 'cosine' });
    const vector = Array.from({ length: 2500 }, (_, at) => (at % 7) / 7);
    await store.upsert('big', [{ id: 'x', vector, metadata: { k: true } }]);
    const sql = await database.connection().client<Raw>();
    const type = (await sql.raw(
      "select format_type(atttypid, atttypmod) as type from pg_attribute where attrelid = 'agv_big'::regclass and attname = 'embedding'",
    )) as { rows: { type: string }[] };
    expect(type.rows[0]!.type).toBe('halfvec(2500)');
    const hits = await store.query('big', {
      vector,
      topK: 1,
      filter: { k: true },
    });
    expect(hits[0]!.id).toBe('x');
    expect(hits[0]!.score).toBeCloseTo(1, 2);
  });

  it('serves a collection whose registry is in another database', async () => {
    const testDatabase = await createTestDatabase();
    const registry = testDatabase.database;
    await registry
      .createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-agents',
      })
      .latest();
    let next = 0;
    const vectors = createVectors({
      tx: createTxRunner(registry, { emit: () => undefined }),
      config: { store: 'pgvector', url: vectorsUrl },
      paths,
      ids: { next: () => `v${(next += 1)}` },
      clock: { now: () => new Date() },
      embed: (request) =>
        Promise.resolve({
          embeddings: request.values.map((value) => [
            value.includes('apple') ? 1 : 0,
            value.includes('zebra') ? 1 : 0,
            0.1,
          ]),
          dimension: 3,
          model: request.model.model,
          tokens: 1,
        }),
      onError: (message, error) => console.error(message, error),
    });
    const collection = vectors.collection({
      name: 'kb',
      source: 'test',
      filterable: ['space'],
      model: () => Promise.resolve({ modelService: 'svc', model: 'm' }),
      async *items() {
        yield [
          { id: 'c1', text: 'apple', metadata: { space: 's1' } },
          { id: 'c2', text: 'zebra', metadata: { space: 's1' } },
          { id: 'c3', text: 'apple pie', metadata: { space: 's2' } },
        ];
      },
    });
    await collection.sync();
    await vectors.drain();
    expect((await collection.status()).active).toMatchObject({
      dimension: 3,
      status: 'ready',
    });
    const hits = await collection.search('apple', {
      topK: 2,
      filter: { space: { in: ['s1'] } },
    });
    expect(hits?.map((hit) => hit.id)).toEqual(['c1', 'c2']);
    await vectors.stop();
    await testDatabase.destroy();
  });
});

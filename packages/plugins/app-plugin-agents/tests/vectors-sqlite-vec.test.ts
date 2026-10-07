/**
 * The sqlite-vec store, the default: a SQLite file of its own with the sqlite-vec extension.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createTestDatabase } from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTxRunner } from '../server/kernel/tx.js';
import {
  createSqliteVecStore,
  createVectors,
  sqliteWhereOf,
  type VectorStore,
} from '../server/vectors/index.js';

describe('sqlite-vec store', () => {
  let root: string;
  let store: VectorStore;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'agv-sqlite-vec-'));
    store = createSqliteVecStore({
      config: {},
      paths: { root, storage: path.join(root, 'storage') },
    });
  });
  afterEach(async () => {
    await store.close?.();
    await rm(root, { recursive: true, force: true });
  });

  it('keeps its file under storage by default, or where the configuration says', () => {
    expect(store.type).toBe('sqlite-vec');
    expect(store.target).toBe('storage/vectors.sqlite');
    expect(
      createSqliteVecStore({
        config: { path: 'data/kb.sqlite' },
        paths: { root, storage: path.join(root, 'storage') },
      }).target,
    ).toBe('data/kb.sqlite');
    expect(
      createSqliteVecStore({
        config: { path: '/var/lib/acme/vectors.sqlite' },
        paths: { root, storage: path.join(root, 'storage') },
      }).target,
    ).toBe('/var/lib/acme/vectors.sqlite');
  });

  it('creates indexes, upserts, filters before the limit, updates and deletes', async () => {
    expect(await store.available()).toEqual({ ok: true });
    for (let twice = 0; twice < 2; twice += 1)
      await store.createIndex({
        name: 'docs_abc',
        dimension: 3,
        metric: 'cosine',
        filterable: ['gate', 'docId'],
      });
    // Many close items behind gate b, two farther behind gate a: the gate must apply before topK.
    await store.upsert('docs_abc', [
      ...Array.from({ length: 50 }, (_, at) => ({
        id: `b${at}`,
        vector: [1, 0, at / 1000],
        metadata: { gate: 'node:b', docId: 'd-b', n: at },
      })),
      {
        id: 'a1',
        vector: [0, 1, 0],
        metadata: { gate: 'space:a', docId: 'd-a', n: 1 },
      },
      {
        id: 'a2',
        vector: [0.5, 0.5, 0],
        metadata: { gate: 'space:a', docId: 'd-a', n: 2 },
      },
    ]);
    const near = await store.query('docs_abc', { vector: [1, 0, 0], topK: 2 });
    expect(near.map((hit) => hit.id)).toEqual(['b0', 'b1']);
    expect(near[0]!.score).toBeCloseTo(1, 5);

    const gated = await store.query('docs_abc', {
      vector: [1, 0, 0],
      topK: 1,
      filter: { gate: { in: ['space:a', 'space:c'] } },
    });
    expect(gated.map((hit) => hit.id)).toEqual(['a2']);
    expect(gated[0]!.metadata).toEqual({ gate: 'space:a', docId: 'd-a', n: 2 });
    expect(
      await store.query('docs_abc', {
        vector: [1, 0, 0],
        topK: 5,
        filter: { gate: { in: [] } },
      }),
    ).toEqual([]);
    expect(
      (
        await store.query('docs_abc', {
          vector: [1, 0, 0],
          topK: 5,
          filter: { n: 2 },
        })
      )
        .map((hit) => hit.id)
        .sort(),
    ).toEqual(['a2', 'b2']);

    await store.update('docs_abc', [
      { id: 'a2', metadata: { gate: 'space:c', docId: 'd-a', n: 2 } },
    ]);
    expect(
      (
        await store.query('docs_abc', {
          vector: [1, 0, 0],
          topK: 5,
          filter: { gate: 'space:c' },
        })
      ).map((hit) => hit.id),
    ).toEqual(['a2']);

    // Written again, an item is replaced rather than added.
    await store.upsert('docs_abc', [
      {
        id: 'a1',
        vector: [1, 0, 0],
        metadata: { gate: 'space:a', docId: 'd-a', n: 1 },
      },
    ]);
    const again = await store.query('docs_abc', {
      vector: [1, 0, 0],
      topK: 5,
      filter: { gate: 'space:a' },
    });
    expect(again.map((hit) => hit.id)).toEqual(['a1']);

    await store.delete('docs_abc', { ids: ['a2'] });
    await store.delete('docs_abc', { filter: { docId: 'd-b' } });
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

  it('scores by the metric', async () => {
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
  });

  it('keeps its vectors in the file across a restart', async () => {
    await store.createIndex({ name: 'kept', dimension: 2, metric: 'cosine' });
    await store.upsert('kept', [{ id: 'x', vector: [1, 0], metadata: {} }]);
    await store.close?.();
    const reopened = createSqliteVecStore({
      config: {},
      paths: { root, storage: path.join(root, 'storage') },
    });
    expect(
      (await reopened.query('kept', { vector: [1, 0], topK: 1 }))[0]?.id,
    ).toBe('x');
    await reopened.close?.();
  });

  it('says why it is unavailable when its file cannot be opened', async () => {
    await writeFile(path.join(root, 'blocked'), 'a file, not a directory');
    const blocked = createSqliteVecStore({
      config: { path: 'blocked/vectors.sqlite' },
      paths: { root, storage: path.join(root, 'storage') },
    });
    expect(await blocked.available()).toMatchObject({
      ok: false,
      code: 'SQLITE_VEC_OPEN_FAILED',
    });
  });

  it('compares filters as text, keeping only plain keys', () => {
    expect(sqliteWhereOf({ gate: { in: ['a', 1] }, flag: true })).toEqual({
      sql: `cast(json_extract(metadata, '$."gate"') as text) in (select value from json_each(?)) and cast(json_extract(metadata, '$."flag"') as text) = ?`,
      params: ['["a","1"]', '1'],
    });
    expect(() => sqliteWhereOf({ "x') or 1=1 --": 'y' })).toThrow();
  });
});

describe('vectors by default', () => {
  it('work out of the box in storage/vectors.sqlite, with the registry in the application database', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'agv-default-'));
    const testDatabase = await createTestDatabase();
    const database = testDatabase.database;
    try {
      await database
        .createMigrator({
          directory: path.resolve(
            import.meta.dirname,
            '../database/migrations',
          ),
          packageName: '@nocobase/app-plugin-agents',
        })
        .latest();
      let next = 0;
      const vectors = createVectors({
        tx: createTxRunner(database, { emit: () => undefined }),
        ids: { next: () => `v${(next += 1)}` },
        clock: { now: () => new Date() },
        paths: { root, storage: path.join(root, 'storage') },
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
        onError: () => undefined,
      });
      expect(await vectors.status()).toEqual({
        available: true,
        store: { type: 'sqlite-vec', target: 'storage/vectors.sqlite' },
        reason: null,
      });
      const collection = vectors.collection({
        name: 'kb',
        source: 'test',
        filterable: ['gate'],
        model: () => Promise.resolve({ modelService: 'svc', model: 'm' }),
        async *items() {
          yield [
            { id: 'c1', text: 'apple', metadata: { gate: 'space:1' } },
            { id: 'c2', text: 'zebra', metadata: { gate: 'space:1' } },
            { id: 'c3', text: 'apple pie', metadata: { gate: 'node:secret' } },
          ];
        },
      });
      await collection.sync();
      await vectors.drain();
      expect(await collection.status()).toMatchObject({
        available: true,
        store: { type: 'sqlite-vec', target: 'storage/vectors.sqlite' },
        active: { status: 'ready', indexed: 3, total: 3 },
      });
      const hits = await collection.search('apple', {
        topK: 1,
        filter: { gate: { in: ['space:1'] } },
      });
      expect(hits?.map((hit) => hit.id)).toEqual(['c1']);
      await vectors.stop();
    } finally {
      await testDatabase.destroy();
      await rm(root, { recursive: true, force: true });
    }
  });
});

/**
 * Vector collections and their embedding queue, over the test database, with a fake embedder and an in-memory store.
 */
import path from 'node:path';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { ModelRef } from '../shared/models.js';
import { createTxRunner } from '../server/kernel/tx.js';
import {
  BACKOFF_MS,
  createVectors,
  matches,
  MAX_ATTEMPTS,
  type Embedder,
  type VectorItem,
  type VectorMatch,
  type Vectors,
  type VectorSourceItem,
  type VectorStore,
} from '../server/vectors/index.js';

const MIGRATIONS = path.resolve(import.meta.dirname, '../database/migrations');

/** Letters counted into `dimension` buckets: texts sharing letters are close. */
function vectorOf(text: string, dimension: number): number[] {
  const vector = new Array<number>(dimension).fill(0);
  for (const char of text.toLowerCase())
    if (/[a-z]/u.test(char)) vector[char.charCodeAt(0) % dimension]! += 1;
  if (vector.every((value) => value === 0)) vector[0] = 1;
  return vector;
}

const cosine = (a: readonly number[], b: readonly number[]) => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  a.forEach((value, at) => {
    dot += value * b[at]!;
    na += value * value;
    nb += b[at]! * b[at]!;
  });
  return dot / Math.sqrt(na * nb);
};

function memoryStore(target = 'ram') {
  const indexes = new Map<string, Map<string, VectorItem>>();
  const store: VectorStore & { indexes: typeof indexes; ok: boolean } = {
    type: 'memory',
    target,
    indexes,
    ok: true,
    available: () =>
      Promise.resolve(
        store.ok
          ? { ok: true }
          : {
              ok: false,
              code: 'VECTOR_STORE_FAILED',
              message: 'No memory today.',
            },
      ),
    createIndex(spec) {
      if (!indexes.has(spec.name)) indexes.set(spec.name, new Map());
      return Promise.resolve();
    },
    dropIndex(name) {
      indexes.delete(name);
      return Promise.resolve();
    },
    upsert(index, items) {
      for (const item of items) indexes.get(index)!.set(item.id, item);
      return Promise.resolve();
    },
    update(index, items) {
      for (const item of items) {
        const found = indexes.get(index)!.get(item.id);
        if (found)
          indexes
            .get(index)!
            .set(item.id, { ...found, metadata: item.metadata });
      }
      return Promise.resolve();
    },
    query(index, request) {
      return Promise.resolve(
        [...indexes.get(index)!.values()]
          .filter(
            (item) => !request.filter || matches(item.metadata, request.filter),
          )
          .map((item): VectorMatch => ({
            id: item.id,
            score: cosine(item.vector, request.vector),
            metadata: item.metadata,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, request.topK),
      );
    },
    delete(index, target) {
      const items = indexes.get(index);
      if (!items) return Promise.resolve();
      for (const [id, item] of items)
        if (
          'ids' in target
            ? target.ids.includes(id)
            : matches(item.metadata, target.filter)
        )
          items.delete(id);
      return Promise.resolve();
    },
  };
  return store;
}

interface Fixture {
  readonly testDatabase: TestDatabase;
  readonly database: DatabaseManager;
  readonly vectors: Vectors;
  readonly store: ReturnType<typeof memoryStore>;
  readonly calls: { values: readonly string[]; model: string }[];
  readonly clock: { now(): Date; advance(ms: number): void };
  model: ModelRef | null;
  dimension: number;
  failing: boolean;
  items: VectorSourceItem[];
}

async function setup(): Promise<Fixture> {
  const testDatabase = await createTestDatabase();
  const database = testDatabase.database;
  await database
    .createMigrator({
      directory: MIGRATIONS,
      packageName: '@nocobase/app-plugin-agents',
    })
    .latest();
  let current = Date.parse('2026-10-05T00:00:00.000Z');
  let next = 0;
  const store = memoryStore();
  const fixture = {
    testDatabase,
    database,
    store,
    calls: [],
    clock: {
      now: () => new Date(current),
      advance: (ms: number) => {
        current += ms;
      },
    },
    model: { modelService: 'svc', model: 'small' },
    dimension: 8,
    failing: false,
    items: [],
  } as unknown as Fixture;
  const embed: Embedder = (request) => {
    if (fixture.failing)
      return Promise.reject(new Error('The provider is down.'));
    fixture.calls.push({ values: request.values, model: request.model.model });
    const dimension = request.model.model === 'large' ? 16 : fixture.dimension;
    return Promise.resolve({
      embeddings: request.values.map((value) => vectorOf(value, dimension)),
      dimension,
      model: request.model.model,
      tokens: request.values.length,
    });
  };
  const vectors = createVectors({
    tx: createTxRunner(database, { emit: () => undefined }),
    ids: { next: () => `e${(next += 1)}` },
    clock: fixture.clock,
    embed,
    dimensionsOf: (ref) => Promise.resolve(ref.model === 'large' ? 16 : 8),
    config: { store: 'memory' },
    onError: () => undefined,
  });
  vectors.stores.register({ type: 'memory', create: () => store });
  Object.assign(fixture, { vectors });
  return fixture;
}

function docs(fixture: Fixture) {
  return fixture.vectors.collection({
    name: 'docs',
    source: 'test',
    filterable: ['space'],
    model: () => Promise.resolve(fixture.model),
    async *items() {
      yield fixture.items;
    },
  });
}

const item = (id: string, text: string, space = 'a'): VectorSourceItem => ({
  id,
  text,
  metadata: { space },
});

describe('vector collections', () => {
  let fixture: Fixture;
  beforeEach(async () => {
    fixture = await setup();
  });
  afterEach(async () => {
    await fixture.vectors.stop();
    await fixture.testDatabase.destroy();
  });

  it('embeds queued items in batches and searches the ready index', async () => {
    const collection = docs(fixture);
    expect(await collection.search('apple', { topK: 3 })).toBeNull();
    await collection.sync();
    await collection.upsert([
      item('1', 'apple pie'),
      item('2', 'zebra zone'),
      item('3', 'apple tart', 'b'),
    ]);
    expect((await collection.status()).pending).toBe(3);
    await fixture.vectors.drain();
    const status = await collection.status();
    expect(status).toMatchObject({ pending: 0, failed: 0, building: null });
    expect(status.active).toMatchObject({
      model: 'small',
      dimension: 8,
      status: 'ready',
    });
    expect(fixture.calls.map((call) => call.values.length)).toEqual([3]);

    const hits = await collection.search('apple', { topK: 2 });
    expect(hits?.map((hit) => hit.id)).toEqual(
      expect.arrayContaining(['1', '3']),
    );
    const filtered = await collection.search('apple', {
      topK: 5,
      filter: { space: { in: ['a'] } },
    });
    expect(filtered?.map((hit) => hit.id).sort()).toEqual(['1', '2']);
  });

  it('skips unchanged text and only updates its metadata', async () => {
    const collection = docs(fixture);
    await collection.sync();
    await collection.upsert([item('1', 'apple pie')]);
    await fixture.vectors.drain();
    fixture.calls.length = 0;

    await collection.upsert([item('1', 'apple pie', 'b')]);
    expect((await collection.status()).pending).toBe(0);
    await fixture.vectors.drain();
    expect(fixture.calls).toEqual([]);
    const index = [...fixture.store.indexes.values()][0]!;
    expect(index.get('1')?.metadata).toEqual({ space: 'b' });

    await collection.upsert([item('1', 'apple crumble', 'b')]);
    await fixture.vectors.drain();
    expect(fixture.calls.map((call) => call.values)).toEqual([
      ['apple crumble'],
    ]);
  });

  it('replaces a scope and removes by id and by filter', async () => {
    const collection = docs(fixture);
    await collection.sync();
    await collection.upsert([
      item('1', 'one'),
      item('2', 'two'),
      item('3', 'three', 'b'),
    ]);
    await fixture.vectors.drain();
    await collection.replace({ space: 'a' }, [
      item('2', 'two'),
      item('4', 'four'),
    ]);
    await fixture.vectors.drain();
    const index = [...fixture.store.indexes.values()][0]!;
    expect([...index.keys()].sort()).toEqual(['2', '3', '4']);

    await collection.remove({ ids: ['4'] });
    await collection.remove({ filter: { space: 'b' } });
    expect([...index.keys()]).toEqual(['2']);
  });

  it('retries a failed embedding with a back-off, then marks it failed', async () => {
    const collection = docs(fixture);
    await collection.sync();
    fixture.failing = true;
    await collection.upsert([item('1', 'apple')]);
    await fixture.vectors.drain();
    expect((await collection.status()).pending).toBe(1);
    // Not due again before the back-off.
    fixture.failing = false;
    await fixture.vectors.drain();
    expect(fixture.calls).toEqual([]);
    fixture.clock.advance(BACKOFF_MS);
    await fixture.vectors.drain();
    expect(fixture.calls).toHaveLength(1);

    fixture.failing = true;
    await collection.upsert([item('2', 'pear')]);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      await fixture.vectors.drain();
      fixture.clock.advance(60 * 60_000);
    }
    expect(await collection.status()).toMatchObject({ pending: 0, failed: 1 });
    // Written again, it is queued again.
    fixture.failing = false;
    await collection.upsert([item('2', 'pear')]);
    await fixture.vectors.drain();
    expect(await collection.status()).toMatchObject({ pending: 0, failed: 0 });
  });

  it('answers each item’s state and the unfinished items of a filter', async () => {
    const collection = docs(fixture);
    expect(await collection.states(['1'])).toBeNull();
    expect(await collection.unfinished({ limit: 10 })).toBeNull();
    await collection.sync();
    await collection.upsert([item('1', 'apple'), item('2', 'pear', 'b')]);
    expect([
      ...((await collection.states(['1', '2', '9'])) ?? new Map()).values(),
    ]).toEqual([
      { id: '1', state: 'pending', error: null, metadata: { space: 'a' } },
      { id: '2', state: 'pending', error: null, metadata: { space: 'b' } },
    ]);
    await fixture.vectors.drain();
    expect((await collection.states(['1']))?.get('1')?.state).toBe('done');
    expect(await collection.unfinished({ limit: 10 })).toEqual([]);

    fixture.failing = true;
    await collection.upsert([item('3', 'plum'), item('4', 'fig', 'b')]);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      await fixture.vectors.drain();
      fixture.clock.advance(60 * 60_000);
    }
    await collection.upsert([item('5', 'kiwi')]);
    const open = await collection.unfinished({
      filter: { space: 'a' },
      limit: 10,
    });
    expect(open?.map((entry) => [entry.id, entry.state, entry.error])).toEqual([
      ['3', 'failed', 'The provider is down.'],
      ['5', 'pending', null],
    ]);
    expect(await collection.unfinished({ limit: 1 })).toHaveLength(1);
  });

  it('builds a new index when the model changes while the old one serves', async () => {
    const collection = docs(fixture);
    fixture.items = [item('1', 'apple pie'), item('2', 'zebra')];
    await collection.sync();
    await fixture.vectors.drain();
    const first = (await collection.status()).active!;
    expect(first.model).toBe('small');

    fixture.model = { modelService: 'svc', model: 'large' };
    fixture.items = [
      item('1', 'apple pie'),
      item('2', 'zebra'),
      item('3', 'apple'),
    ];
    await collection.sync();
    let status = await collection.status();
    expect(status.active?.name).toBe(first.name);
    expect(status.building).toMatchObject({ model: 'large', dimension: 16 });
    // A write meanwhile reaches both indexes.
    await collection.upsert([item('4', 'apple juice')]);
    expect((await collection.search('apple', { topK: 1 }))?.length).toBe(1);

    await fixture.vectors.drain();
    status = await collection.status();
    expect(status.active).toMatchObject({ model: 'large', status: 'ready' });
    expect(status.building).toBeNull();
    expect(fixture.store.indexes.has(first.name)).toBe(false);
    const hits = await collection.search('apple', { topK: 10 });
    expect(hits?.map((hit) => hit.id).sort()).toEqual(['1', '2', '3', '4']);
  });

  it('answers null and queues nothing when the store is unavailable or there is no model', async () => {
    const collection = docs(fixture);
    fixture.store.ok = false;
    expect(await fixture.vectors.status()).toMatchObject({
      available: false,
      store: { type: 'memory', target: 'ram' },
      reason: { code: 'VECTOR_STORE_FAILED' },
    });
    await collection.upsert([item('1', 'apple')]);
    expect(await collection.search('apple', { topK: 1 })).toBeNull();
    expect(await collection.status()).toMatchObject({
      available: false,
      pending: 0,
      active: null,
    });

    const other = await setup();
    try {
      other.model = null;
      const none = docs(other);
      await none.upsert([item('1', 'apple')]);
      expect(await none.search('apple', { topK: 1 })).toBeNull();
      expect((await none.status()).pending).toBe(0);
    } finally {
      await other.testDatabase.destroy();
    }
  });

  it('runs the worker in the background once started', async () => {
    const collection = docs(fixture);
    await collection.sync();
    fixture.vectors.start();
    await collection.upsert([item('1', 'apple')]);
    for (
      let wait = 0;
      wait < 50 && (await collection.status()).pending > 0;
      wait += 1
    )
      await new Promise((resolve) => setTimeout(resolve, 20));
    expect((await collection.status()).pending).toBe(0);
    await fixture.vectors.stop();
  });

  it('is off when the configuration turns vectors off', async () => {
    const vectors = createVectors({
      tx: createTxRunner(fixture.database, { emit: () => undefined }),
      ids: { next: () => 'x' },
      clock: fixture.clock,
      embed: () => Promise.reject(new Error('never')),
      config: { store: false },
    });
    expect(await vectors.status()).toEqual({
      available: false,
      store: null,
      reason: { code: 'VECTORS_OFF', message: 'Vectors are turned off.' },
    });
    const unknown = createVectors({
      tx: createTxRunner(fixture.database, { emit: () => undefined }),
      ids: { next: () => 'x' },
      clock: fixture.clock,
      embed: () => Promise.reject(new Error('never')),
      config: { store: 'qdrant' },
      onError: () => undefined,
    });
    expect(await unknown.status()).toMatchObject({
      available: false,
      store: { type: 'qdrant', target: null },
      reason: { code: 'VECTOR_STORE_UNKNOWN' },
    });
  });

  it('builds the index again in another store and retires the old one', async () => {
    const collection = docs(fixture);
    fixture.items = [item('1', 'apple pie'), item('2', 'zebra')];
    await collection.sync();
    await fixture.vectors.drain();
    const first = (await collection.status()).active!;
    expect(first).toMatchObject({ status: 'ready', indexed: 2, total: 2 });
    await fixture.vectors.stop();

    // The same application started again with the store pointed elsewhere.
    const elsewhere = memoryStore('disk');
    let next = 100;
    const vectors = createVectors({
      tx: createTxRunner(fixture.database, { emit: () => undefined }),
      ids: { next: () => `e${(next += 1)}` },
      clock: fixture.clock,
      embed: (request) =>
        Promise.resolve({
          embeddings: request.values.map((value) => vectorOf(value, 8)),
          dimension: 8,
          model: request.model.model,
          tokens: 1,
        }),
      dimensionsOf: () => Promise.resolve(8),
      config: { store: 'memory' },
      onError: () => undefined,
    });
    vectors.stores.register({ type: 'memory', create: () => elsewhere });
    const moved = vectors.collection({
      name: 'docs',
      source: 'test',
      filterable: ['space'],
      model: () => Promise.resolve(fixture.model),
      async *items() {
        yield fixture.items;
      },
    });
    // Nothing of the old store serves from the new one.
    expect(await moved.search('apple', { topK: 1 })).toBeNull();
    await moved.sync();
    let status = await moved.status();
    expect(status.store).toEqual({ type: 'memory', target: 'disk' });
    expect(status.active).toBeNull();
    expect(status.building).toMatchObject({ indexed: 0, total: 2 });
    expect(status.building!.name).not.toBe(first.name);
    await vectors.drain();
    status = await moved.status();
    expect(status.active).toMatchObject({
      status: 'ready',
      indexed: 2,
      total: 2,
    });
    expect(elsewhere.indexes.has(status.active!.name)).toBe(true);
    const records = await fixture.database
      .connection()
      .repository<{
        name: string;
        status: string;
        storeTarget: string;
      }>('agVectorIndexes')
      .findMany({});
    expect(
      records.map((record) => [record.storeTarget, record.status]).sort(),
    ).toEqual([
      ['disk', 'ready'],
      ['ram', 'retired'],
    ]);
    expect(
      (await moved.search('apple', { topK: 1 }))?.map((hit) => hit.id),
    ).toEqual(['1']);
    await vectors.stop();
  });
});

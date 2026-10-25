// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
import { READER } from './harness.js';
import { sqliteVecIndexingExtension } from '../server/extension/sqlite-vec/index.js';
import type {
  KnowledgeIndexingBackend,
  KnowledgeIndexingExtension,
} from '../server/indexing/types.js';
let fixture: IndexingFixture | undefined;
afterEach(async () => {
  vi.useRealTimers();
  await fixture?.close();
  fixture = undefined;
});
function observed() {
  const search = vi.fn<KnowledgeIndexingBackend['search']>();
  let backend: KnowledgeIndexingBackend | undefined;
  let delay: (() => Promise<void>) | undefined;
  const extension: KnowledgeIndexingExtension = {
    ...sqliteVecIndexingExtension,
    create(context) {
      backend = sqliteVecIndexingExtension.create(context);
      search.mockImplementation(async (...args) => {
        const rows = await backend!.search(...args);
        await delay?.();
        return rows;
      });
      return { ...backend, search };
    },
  };
  return {
    search,
    extension,
    backend: () => backend!,
    delay: (value: typeof delay) => {
      delay = value;
    },
  };
}
it('pre-filters document gates before native top-k, embeds the query once, and deduplicates text/vector fusion', async () => {
  const o = observed();
  const f = (fixture = await indexingFixture({
    extension: o.extension,
    embed: async ({ values, source }) => ({
      embeddings: values.map((text) =>
        source === 'knowledge.search' || text.includes('HIDDEN')
          ? [1, 0, 0]
          : [0.8, 0.6, 0],
      ),
      dimension: 3,
    }),
  }));
  f.h.levels.set('reader', READER);
  const hidden = await f.create('HIDDEN secret document.');
  const visible = await f.create('Visible handbook.');
  await f.h.knowledge.permissions.replace(f.h.user('admin'), hidden.id, {
    mode: 'custom',
    entries: [{ subject: { type: 'user', id: 'admin' }, level: 'read' }],
  });
  await f.enable();
  await f.settled(hidden.id);
  await f.settled(visible.id);
  f.embed.mockClear();
  const hits = await f.h.knowledge.docs.searchMany(
    f.h.user('reader'),
    [f.space],
    'semantic-only-unmatched',
    { limit: 1 },
  );
  expect(hits.map((row) => row.docId)).toEqual([visible.id]);
  expect(
    f.embed.mock.calls.filter(([input]) => input.source === 'knowledge.search'),
  ).toHaveLength(1);
  const args = o.search.mock.calls.at(-1)!;
  const restricted = await f.h.knowledge.chunksOf(
    f.h.database.connection(),
    hidden.id,
  );
  expect(args[1].scopes.flatMap((scope) => scope.gates)).not.toContain(
    restricted.doc?.gate,
  );
  const top = await o
    .backend()
    .search(args[0], { ...args[1], limit: 1 }, new AbortController().signal);
  const publicContent = await f.h.knowledge.chunksOf(
    f.h.database.connection(),
    visible.id,
  );
  expect(top.map((row) => row.chunkId)).toEqual([publicContent.chunks[0]!.id]);
  const fused = await f.h.knowledge.docs.searchMany(
    f.h.user('reader'),
    [f.space],
    'Visible',
  );
  expect(fused).toHaveLength(1);
  expect(fused[0]?.docId).toBe(visible.id);
});
it('discards the entire vector ranking if one authorized source changes while retrieval is in flight', async () => {
  const o = observed();
  const f = (fixture = await indexingFixture({ extension: o.extension }));
  const a = await f.create('Alpha document.');
  const b = await f.create('Beta document.');
  await f.enable();
  await f.settled(a.id);
  await f.settled(b.id);
  const entered = Promise.withResolvers<void>();
  const gate = Promise.withResolvers<void>();
  o.delay(async () => {
    entered.resolve();
    await gate.promise;
  });
  const searching = f.h.knowledge.docs.searchMany(
    f.h.user('admin'),
    [f.space],
    'unmatched-query',
  );
  try {
    await entered.promise;
    await f.h.knowledge.docs.update(f.h.user('admin'), a.id, {
      expectedVersion: 1,
      content: 'Changed alpha.',
    });
    gate.resolve();
    expect(await searching).toEqual([]);
    o.delay(undefined);
    await f.settled(a.id);
    expect(
      await f.h.knowledge.docs.searchMany(
        f.h.user('admin'),
        [f.space],
        'unmatched-query',
      ),
    ).toHaveLength(2);
  } finally {
    gate.resolve();
    await searching;
  }
});
it('returns contains after the five-second whole-branch budget even when the embedding provider ignores abort', async () => {
  const o = observed();
  const f = (fixture = await indexingFixture({ extension: o.extension }));
  const doc = await f.create('Fallback keyword.');
  await f.enable();
  await f.settled(doc.id);
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  f.embed.mockImplementation(async ({ values, source }) => {
    if (source === 'knowledge.search') {
      entered.resolve();
      await release.promise;
    }
    return { embeddings: values.map(() => [1, 0, 0]), dimension: 3 };
  });
  o.search.mockClear();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const searching = f.h.knowledge.docs.searchMany(
    f.h.user('admin'),
    [f.space],
    'Fallback',
  );
  try {
    await entered.promise;
    await vi.advanceTimersByTimeAsync(5000);
    const hits = await searching;
    expect(hits.map((hit) => hit.docId)).toEqual([doc.id]);
    expect(o.search).not.toHaveBeenCalled();
    release.resolve();
    await Promise.resolve();
  } finally {
    release.resolve();
    vi.useRealTimers();
    await searching;
  }
});

it.each(['active', 'failed-target'] as const)(
  'observes %s identity drift without calling embeddings or changing persistent index facts',
  async (phase) => {
    const o = observed();
    const f = (fixture = await indexingFixture({ extension: o.extension }));
    const doc = await f.create();
    if (phase === 'failed-target')
      f.embed.mockRejectedValueOnce(
        new Error('Fixture permanent model failure.'),
      );
    const receipt = await f.enable();
    if (phase === 'active') await f.settled(doc.id);
    else
      await expect
        .poll(
          async () => (await f.runtime.service.status(f.context)).target?.state,
        )
        .toBe('failed');
    expect((await f.runtime.service.status(f.context)).reason).toBeNull();
    expect((await f.runtime.service.status(f.context)).availability).toBe(
      phase === 'active' ? 'ready' : 'unavailable',
    );
    const before = await f.h.database
      .connection()
      .query.selectFrom('kbIndexGenerations')
      .selectAll()
      .execute();
    const beforeWork = await f.h.database
      .connection()
      .query.selectFrom('kbIndexWork')
      .selectAll()
      .execute();
    const beforeRequests = await f.h.database
      .connection()
      .query.selectFrom('kbIndexRequests')
      .selectAll()
      .execute();
    const calls = f.embed.mock.calls.length;
    const identity = vi
      .spyOn(f.model, 'identity')
      .mockResolvedValue({ hash: 'changed-provider-identity', dimensions: 3 });
    try {
      expect(await f.runtime.service.status(f.context)).toMatchObject({
        availability: 'unavailable',
        reason: 'INDEXING_MODEL_CHANGED',
      });
      await f.runtime.service.settings(f.context);
      await f.runtime.service.instances(f.context);
      await f.runtime.service.models(f.context);
      if (phase === 'failed-target') {
        await expect(
          f.runtime.service.retry(f.context, {
            requestId: crypto.randomUUID(),
            expectedRevision: receipt.revision,
            generationId: receipt.generationId!,
            acknowledgeFullRebuild: true,
          }),
        ).rejects.toMatchObject({ code: 'INDEXING_MODEL_CHANGED' });
      }
      expect(
        await f.h.database
          .connection()
          .query.selectFrom('kbIndexGenerations')
          .selectAll()
          .execute(),
      ).toEqual(before);
      expect(
        await f.h.database
          .connection()
          .query.selectFrom('kbIndexWork')
          .selectAll()
          .execute(),
      ).toEqual(beforeWork);
      expect(
        await f.h.database
          .connection()
          .query.selectFrom('kbIndexRequests')
          .selectAll()
          .execute(),
      ).toEqual(beforeRequests);
      expect(f.embed).toHaveBeenCalledTimes(calls);
    } finally {
      identity.mockRestore();
    }
    expect((await f.runtime.service.status(f.context)).reason).toBeNull();
    expect((await f.runtime.service.status(f.context)).availability).toBe(
      phase === 'active' ? 'ready' : 'unavailable',
    );
  },
);

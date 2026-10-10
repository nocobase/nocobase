// @vitest-environment node
/**
 * Knowledge search as Studio composes it: the settings' defaults, the vector index kept from the knowledge plugin's
 * `chunks.changed`, the vector search provider and the reranker, contextual retrieval's sentences, and the whole
 * knowledge an online agent gets when it is small. The agents plugin's vectors and gateway and the knowledge plugin are
 * fakes here; their own tests cover them.
 */
import type {
  ModelGateway,
  VectorCollection,
  VectorCollectionSpec,
  VectorFilter,
  VectorMetadata,
  VectorSourceItem,
  Vectors,
} from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Knowledge,
  KnowledgeIndexer,
  KnowledgeListener,
  KnowledgeSearchProvider,
  KnowledgeSearchReranker,
  KnowledgeSettingsSource,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import type { DatabaseManager } from '@nocobase/db';
import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_KNOWLEDGE_SEARCH,
  type KnowledgeSearchSettings,
} from '../../shared/knowledge.js';
import { estimateTokens, wholeSection } from '../../server/knowledge/brief.js';
import {
  bindKnowledgeTuning,
  recallOf,
} from '../../server/knowledge/tuning.js';
import {
  settingsOf,
  type KnowledgeSearchSettingsStore,
} from '../../server/knowledge/search-settings.js';
import {
  createKnowledgeVectors,
  KNOWLEDGE_COLLECTION,
  withContext,
} from '../../server/knowledge/vectors.js';

const SYSTEM = { scope: 'system', scopeId: '' } as const;

/** Whether metadata passes a filter, as the vector store applies it. */
function matches(metadata: VectorMetadata, filter: VectorFilter): boolean {
  return Object.entries(filter).every(([key, wanted]) => {
    const value = metadata[key];
    if (typeof wanted === 'object')
      return wanted.in.some((option) => String(option) === String(value));
    return String(value) === String(wanted);
  });
}

describe('the knowledge search settings', () => {
  it('fill what is missing with the defaults and drop what is not valid', () => {
    expect(settingsOf(null)).toEqual(DEFAULT_KNOWLEDGE_SEARCH);
    expect(
      settingsOf(
        JSON.stringify({
          embedding: {
            modelService: 'openai',
            model: 'text-embedding-3-small',
          },
          contextual: ['system:', 'system:'],
        }),
      ),
    ).toEqual({
      ...DEFAULT_KNOWLEDGE_SEARCH,
      embedding: { modelService: 'openai', model: 'text-embedding-3-small' },
      contextual: ['system:'],
    });
    expect(settingsOf({ wholeTokens: -1 })).toEqual(DEFAULT_KNOWLEDGE_SEARCH);
    // A chunking or recall that is no longer valid falls back alone.
    expect(
      settingsOf({
        wholeTokens: 5,
        chunking: { headingDepth: 9, target: 1, max: 1 },
      }),
    ).toEqual({ ...DEFAULT_KNOWLEDGE_SEARCH, wholeTokens: 5 });
  });
});

describe('whole knowledge for an online agent', () => {
  const knowledgeWith = (content: string, complete = true) =>
    ({
      texts: vi.fn(() =>
        Promise.resolve({
          spaces: [
            {
              space: SYSTEM,
              docs: [
                {
                  id: 'd1',
                  slug: 'conventions',
                  title: 'Conventions',
                  kind: 'article',
                  version: 2,
                  content,
                },
              ],
            },
          ],
          chars: content.length,
          complete,
        }),
      ),
    }) as unknown as Knowledge;

  it('estimates a token per CJK character and per four others', () => {
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(estimateTokens('知识库')).toBe(3);
  });

  it('puts the documents whole into the prompt below the threshold, and nothing above it', async () => {
    const small = knowledgeWith('# Conventions\n\nSmall commits.');
    const section = await wholeSection(
      small,
      {} as never,
      { spaces: [] } as never,
      1000,
    );
    expect(section).toContain('## Knowledge, whole');
    expect(section).toContain('slug="conventions"');
    expect(section).toContain('Small commits.');
    expect(section).toContain('url="/knowledge?doc=d1"');
    expect(small.texts).toHaveBeenCalledWith(
      {},
      { spaces: [] },
      { maxChars: 4000 },
    );

    expect(
      await wholeSection(
        knowledgeWith('x'.repeat(5000)),
        {} as never,
        {} as never,
        1000,
      ),
    ).toBeNull();
    expect(
      await wholeSection(
        knowledgeWith('short', false),
        {} as never,
        {} as never,
        1000,
      ),
    ).toBeNull();
    expect(
      await wholeSection(knowledgeWith('short'), {} as never, {} as never, 0),
    ).toBeNull();
  });
});

interface Section {
  readonly chunkId: string;
  readonly ordinal: number;
  readonly text: string;
}

function harness(initial: Partial<KnowledgeSearchSettings> = {}) {
  let settings: KnowledgeSearchSettings = {
    ...DEFAULT_KNOWLEDGE_SEARCH,
    embedding: { modelService: 'openai', model: 'embed' },
    ...initial,
  };
  const settingsListeners = new Set<
    (next: KnowledgeSearchSettings, previous: KnowledgeSearchSettings) => void
  >();
  const store: KnowledgeSearchSettingsStore = {
    get: () => Promise.resolve(settings),
    save(next) {
      const previous = settings;
      settings = next;
      for (const listener of settingsListeners) listener(next, previous);
      return Promise.resolve(next);
    },
    onChange(listener) {
      settingsListeners.add(listener);
      return () => settingsListeners.delete(listener);
    },
  };

  const docs = new Map<
    string,
    {
      archived: boolean;
      version: number;
      sections: Section[];
      /** Its access key: restricted when set. */
      aclKey?: string;
    }
  >();
  const gateOf = (doc: { aclKey?: string }) =>
    doc.aclKey ? `node:${doc.aclKey}` : 'space:space-1';
  const listeners = new Set<KnowledgeListener>();
  let provider: KnowledgeSearchProvider | undefined;
  let reranker: KnowledgeSearchReranker | undefined;
  let indexer: KnowledgeIndexer | undefined;
  const knowledge = {
    events: {
      on(listener: KnowledgeListener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    chunksOf: (_conn: unknown, docId: string) => {
      const doc = docs.get(docId);
      return Promise.resolve({
        doc: doc
          ? {
              id: docId,
              spaceId: 'space-1',
              space: SYSTEM,
              version: doc.version,
              title: docId,
              kind: 'article',
              archived: doc.archived,
              aclKey: doc.aclKey ?? null,
              gate: gateOf(doc),
            }
          : null,
        chunks:
          doc && !doc.archived
            ? doc.sections.map((section) => ({
                id: section.chunkId,
                ordinal: section.ordinal,
                text: section.text,
                headingPath: [],
                hash: section.text,
              }))
            : [],
      });
    },
    async *eachChunk() {
      for (const [docId, doc] of docs)
        yield doc.sections.map((section) => ({
          ...section,
          docId,
          spaceId: 'space-1',
          space: SYSTEM,
          version: doc.version,
          title: docId,
          headingPath: [],
          hash: section.text,
          aclKey: doc.aclKey ?? null,
          gate: gateOf(doc),
        }));
    },
    registerSearchProvider(next: KnowledgeSearchProvider) {
      provider = next;
      return () => undefined;
    },
    registerReranker(next: KnowledgeSearchReranker) {
      reranker = next;
      return () => undefined;
    },
    registerIndexer(next: KnowledgeIndexer) {
      indexer = next;
      return () => undefined;
    },
  } as unknown as Knowledge;

  let spec: VectorCollectionSpec | undefined;
  const replaced: { scope: unknown; items: readonly VectorSourceItem[] }[] = [];
  const collection: VectorCollection = {
    status: vi.fn<VectorCollection['status']>(() =>
      Promise.resolve({
        available: true,
        store: { type: 'sqlite-vec', target: 'storage/vectors.sqlite' },
        reason: null,
        model: settings.embedding,
        active: null,
        building: null,
        pending: 0,
        failed: 0,
      }),
    ),
    upsert: vi.fn(() => Promise.resolve()),
    replace: (scope, items) => {
      replaced.push({ scope, items });
      return Promise.resolve();
    },
    remove: () => Promise.resolve(),
    // The store's query: the items last given for each entry that pass the filter, before the top-k.
    search: vi.fn(
      (_query: string, options: { topK: number; filter?: VectorFilter }) => {
        const latest = new Map(
          replaced.map((entry) => [JSON.stringify(entry.scope), entry.items]),
        );
        const items = [...latest.values()].flat();
        const stored =
          items.length > 0
            ? items
            : [
                {
                  id: 'd1:0',
                  text: '',
                  metadata: {
                    spaceKey: 'space-1',
                    docId: 'd1',
                    version: 1,
                    chunkId: 'c1',
                    gate: 'space:space-1',
                  },
                },
              ];
        return Promise.resolve(
          stored
            .filter(
              (item) =>
                !options.filter || matches(item.metadata, options.filter),
            )
            .slice(0, options.topK)
            .map((item) => ({
              id: item.id,
              score: 0.9,
              metadata: item.metadata,
            })),
        );
      },
    ),
    sync: vi.fn(() => Promise.resolve()),
    states: vi.fn<VectorCollection['states']>((ids) =>
      Promise.resolve(
        new Map(
          ids.map((id) => [
            id,
            {
              id,
              state: id.endsWith(':1')
                ? ('failed' as const)
                : ('done' as const),
              error: id.endsWith(':1') ? 'Too long.' : null,
              metadata: {},
            },
          ]),
        ),
      ),
    ),
    unfinished: vi.fn<VectorCollection['unfinished']>(() =>
      Promise.resolve([
        {
          id: 'doc:with:colons:3',
          state: 'pending' as const,
          error: null,
          metadata: { spaceKey: 'space-1' },
        },
      ]),
    ),
    close: () => undefined,
  };
  const vectors = {
    collection(next: VectorCollectionSpec) {
      spec = next;
      return collection;
    },
  } as unknown as Vectors;

  const generate = vi.fn(() =>
    Promise.resolve({ text: 'From the conventions.' }),
  );
  const rerank = vi.fn(() =>
    Promise.resolve({
      ranking: [
        { index: 1, score: 0.8 },
        { index: 0, score: 0.2 },
      ],
    }),
  );
  const gateway = { generate, rerank } as unknown as ModelGateway;

  const rows: Record<string, unknown>[] = [];
  const repository = {
    findMany: ({ filter }: { filter: { docId: string } }) =>
      Promise.resolve(rows.filter((row) => row.docId === filter.docId)),
    createOne: ({ values }: { values: Record<string, unknown> }) => {
      rows.push(values);
      return Promise.resolve(values);
    },
    deleteMany: () => Promise.resolve(0),
  };
  const database = {
    connection: () => ({ repository: () => repository }),
  } as unknown as Pick<DatabaseManager, 'connection' | 'transaction'>;

  const onError = vi.fn();
  const index = createKnowledgeVectors({
    knowledge: () => knowledge,
    vectors: () => vectors,
    gateway: () => gateway,
    settings: store,
    database,
    onError,
  });
  const emit = async (docId: string) => {
    for (const listener of listeners)
      await listener({
        type: 'chunks.changed',
        docId,
        version: docs.get(docId)?.version ?? 1,
        spaceId: 'space-1',
        space: SYSTEM,
      });
  };
  return {
    docs,
    emit,
    replaced,
    collection,
    generate,
    rerank,
    rows,
    store,
    index,
    onError,
    spec: () => spec!,
    provider: () => provider!,
    reranker: () => reranker!,
    indexer: () => indexer!,
  };
}

describe('the knowledge vector index', () => {
  it('reports the store, its progress, and why it is unavailable as a code', async () => {
    const h = harness();
    const index = (indexed: number, total: number, model: string) => ({
      name: `studio-knowledge_${model}`,
      modelService: 'openai',
      model,
      dimension: 3,
      status: 'ready' as const,
      createdAt: '2026-10-05T00:00:00.000Z',
      readyAt: null,
      indexed,
      total,
    });
    vi.mocked(h.collection.status).mockResolvedValueOnce({
      available: true,
      store: { type: 'sqlite-vec', target: 'storage/vectors.sqlite' },
      reason: null,
      model: { modelService: 'openai', model: 'large' },
      active: index(40, 40, 'small'),
      building: { ...index(12, 40, 'large'), status: 'building' },
      pending: 28,
      failed: 0,
    });
    expect(await h.index.status()).toEqual({
      available: true,
      store: { type: 'sqlite-vec' },
      reason: null,
      active: {
        modelService: 'openai',
        model: 'small',
        dimension: 3,
        indexed: 40,
        total: 40,
      },
      building: {
        modelService: 'openai',
        model: 'large',
        dimension: 3,
        indexed: 12,
        total: 40,
      },
      pending: 28,
      failed: 0,
    });

    vi.mocked(h.collection.status).mockResolvedValueOnce({
      available: false,
      store: { type: 'pgvector', target: 'postgres://vec@db:5432/vectors' },
      reason: {
        code: 'PGVECTOR_CONNECTION_FAILED',
        message: 'pgvector could not reach postgres://vec@db:5432/vectors.',
      },
      model: null,
      active: null,
      building: null,
      pending: 0,
      failed: 0,
    });
    expect(await h.index.status()).toMatchObject({
      available: false,
      store: { type: 'pgvector' },
      reason: 'PGVECTOR_CONNECTION_FAILED',
    });
  });

  it('is the collection of every section, keyed by entry and place, with its space in the metadata', async () => {
    const h = harness();
    expect(h.spec().name).toBe(KNOWLEDGE_COLLECTION);
    expect(await h.spec().model()).toEqual({
      modelService: 'openai',
      model: 'embed',
    });
    h.docs.set('d1', {
      archived: false,
      version: 3,
      sections: [{ chunkId: 'c1', ordinal: 0, text: 'Small commits.' }],
    });
    await h.emit('d1');
    expect(h.replaced).toEqual([
      {
        scope: { docId: 'd1' },
        items: [
          {
            id: 'd1:0',
            text: 'Small commits.',
            metadata: {
              spaceKey: 'space-1',
              docId: 'd1',
              version: 3,
              chunkId: 'c1',
              gate: 'space:space-1',
            },
          },
        ],
      },
    ]);
    const batches: VectorSourceItem[][] = [];
    for await (const batch of h.spec().items()) batches.push([...batch]);
    expect(batches.flat().map((item) => item.id)).toEqual(['d1:0']);

    // Archived: its items go.
    h.docs.set('d1', { ...h.docs.get('d1')!, archived: true });
    await h.emit('d1');
    expect(h.replaced.at(-1)).toEqual({ scope: { docId: 'd1' }, items: [] });
  });

  it('searches the reader’s spaces only, and reranks with the rerank model when one is set', async () => {
    const h = harness();
    const ranks = await h.provider().search(
      [
        {
          id: 'space-1',
          ref: SYSTEM,
          gates: { spaceId: 'space-1', space: true, nodes: [] },
        },
      ],
      'commits',
      { limit: 5 },
    );
    expect(ranks).toEqual([{ chunkId: 'c1', score: 0.9 }]);
    expect(h.collection.search).toHaveBeenCalledWith('commits', {
      topK: 5,
      filter: { gate: { in: ['space:space-1'] } },
    });

    const candidates = [
      { chunkId: 'a', text: 'first' },
      { chunkId: 'b', text: 'second' },
    ];
    expect(await h.reranker().rerank('q', candidates, { limit: 2 })).toEqual(
      [],
    );
    expect(h.rerank).not.toHaveBeenCalled();
    await h.store.save({
      ...(await h.store.get()),
      rerank: { modelService: 'cohere', model: 'rerank-v3.5' },
    });
    expect(await h.reranker().rerank('q', candidates, { limit: 2 })).toEqual([
      { chunkId: 'b', score: 0.8 },
      { chunkId: 'a', score: 0.2 },
    ]);
  });

  it('never answers a restricted section to a reader its gates do not let through', async () => {
    const h = harness();
    h.docs.set('open', {
      archived: false,
      version: 1,
      sections: [{ chunkId: 'c-open', ordinal: 0, text: 'Vault basics.' }],
    });
    h.docs.set('secret', {
      archived: false,
      version: 1,
      aclKey: 'secrets',
      sections: [{ chunkId: 'c-secret', ordinal: 0, text: 'Vault token.' }],
    });
    await h.emit('open');
    await h.emit('secret');
    expect(h.replaced.at(-1)?.items[0]?.metadata.gate).toBe('node:secrets');
    const search = (nodes: string[], space = true) =>
      h.provider().search(
        [
          {
            id: 'space-1',
            ref: SYSTEM,
            gates: { spaceId: 'space-1', space, nodes },
          },
        ],
        'vault',
        { limit: 10 },
      );
    expect((await search([])).map((rank) => rank.chunkId)).toEqual(['c-open']);
    expect((await search(['secrets'])).map((rank) => rank.chunkId)).toEqual([
      'c-open',
      'c-secret',
    ]);
    // Shared that page alone: only it.
    expect(
      (await search(['secrets'], false)).map((rank) => rank.chunkId),
    ).toEqual(['c-secret']);
    // A permissions change re-reads the entry: only its gate changes.
    h.docs.set('secret', { ...h.docs.get('secret')!, aclKey: undefined });
    await h.emit('secret');
    expect((await search([])).map((rank) => rank.chunkId)).toEqual([
      'c-open',
      'c-secret',
    ]);
  });

  it('answers each section’s index state, a space’s unfinished sections, and queues an entry again', async () => {
    const h = harness();
    const states = await h.indexer().states([
      { docId: 'd1', ordinal: 0 },
      { docId: 'd1', ordinal: 1 },
    ]);
    expect(h.collection.states).toHaveBeenCalledWith(['d1:0', 'd1:1']);
    expect([...(states ?? new Map())]).toEqual([
      ['d1:0', { state: 'done', error: null }],
      ['d1:1', { state: 'failed', error: 'Too long.' }],
    ]);
    expect(await h.indexer().unfinished('space-1', 10)).toEqual([
      { docId: 'doc:with:colons', ordinal: 3, state: 'pending', error: null },
    ]);
    expect(h.collection.unfinished).toHaveBeenCalledWith({
      filter: { spaceKey: 'space-1' },
      limit: 10,
    });
    h.docs.set('d1', {
      archived: false,
      version: 1,
      sections: [{ chunkId: 'c1', ordinal: 0, text: 'Small commits.' }],
    });
    await h.indexer().reindex('d1');
    expect(h.replaced.at(-1)?.scope).toEqual({ docId: 'd1' });
  });

  it('gives the rerank model at most the recall settings’ candidates', async () => {
    const h = harness({
      rerank: { modelService: 'cohere', model: 'rerank-v3.5' },
      recall: { ...DEFAULT_KNOWLEDGE_SEARCH.recall, rerankCandidates: 2 },
    });
    await h.reranker().rerank(
      'q',
      ['a', 'b', 'c'].map((chunkId) => ({ chunkId, text: chunkId })),
      { limit: 3 },
    );
    expect(h.rerank).toHaveBeenCalledWith(
      expect.objectContaining({ documents: ['a', 'b'] }),
    );
  });

  it('writes a context sentence once per section text in the spaces it is on for', async () => {
    const h = harness({
      contextModel: { modelService: 'openai', model: 'mini' },
      contextual: ['system:'],
    });
    h.docs.set('d1', {
      archived: false,
      version: 1,
      sections: [{ chunkId: 'c1', ordinal: 0, text: 'Small commits.' }],
    });
    await h.emit('d1');
    const [item] = h.replaced.at(-1)!.items;
    expect(item?.variant).toBe('ctx');
    const signal = new AbortController().signal;
    expect(await h.spec().prepare!([item!], signal)).toEqual([
      withContext('From the conventions.', 'Small commits.'),
    ]);
    expect(await h.spec().prepare!([item!], signal)).toEqual([
      withContext('From the conventions.', 'Small commits.'),
    ]);
    expect(h.generate).toHaveBeenCalledTimes(1);
    expect(h.rows).toHaveLength(1);

    // Turning it off re-reads the space's sections, now embedded plain.
    await h.store.save({ ...(await h.store.get()), contextual: [] });
    await vi.waitFor(() => expect(h.collection.upsert).toHaveBeenCalled());
    const upserted = vi.mocked(h.collection.upsert).mock.calls[0]![0];
    expect(upserted[0]?.variant).toBeUndefined();
    expect(h.collection.sync).toHaveBeenCalled();
  });
});

describe('the knowledge tuning Studio binds', () => {
  it('splits the keyword weight between the word match and the vector provider', () => {
    expect(recallOf(DEFAULT_KNOWLEDGE_SEARCH.recall)).toEqual({
      limit: 20,
      minScore: 0,
      weights: { contains: 1, vector: 1 },
      rerankCandidates: 50,
    });
    expect(
      recallOf({ ...DEFAULT_KNOWLEDGE_SEARCH.recall, keywordWeight: 1 })
        .weights,
    ).toEqual({ contains: 2, vector: 0 });
  });

  it('reads the settings on each use, explains to whoever manages search, and cuts again when the default chunking changes', async () => {
    let settings: KnowledgeSearchSettings = DEFAULT_KNOWLEDGE_SEARCH;
    const listeners = new Set<
      (next: KnowledgeSearchSettings, previous: KnowledgeSearchSettings) => void
    >();
    const store: KnowledgeSearchSettingsStore = {
      get: () => Promise.resolve(settings),
      save(next) {
        const previous = settings;
        settings = next;
        for (const listener of listeners) listener(next, previous);
        return Promise.resolve(next);
      },
      onChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    let bound: KnowledgeSettingsSource | undefined;
    const defaultChanged = vi.fn(() => Promise.resolve());
    const knowledge = {
      bindSettings(source: KnowledgeSettingsSource) {
        bound = source;
        return () => {
          bound = undefined;
        };
      },
      chunking: { defaultChanged },
    } as unknown as Knowledge;
    const release = bindKnowledgeTuning({
      knowledge,
      settings: store,
      managesSearch: (reader) => Promise.resolve(reader.userId === 'admin'),
      onError: () => undefined,
    });
    expect(await bound!.chunking()).toEqual(DEFAULT_KNOWLEDGE_SEARCH.chunking);
    expect(await bound!.mayExplain!({ userId: 'admin' })).toBe(true);
    expect(await bound!.mayExplain!({ userId: 'someone' })).toBe(false);
    expect(
      await bound!.mayExplain!({
        userId: 'admin',
        actor: { kind: 'agent', id: 'a1' },
      }),
    ).toBe(false);

    await store.save({ ...settings, wholeTokens: 10 });
    expect(defaultChanged).not.toHaveBeenCalled();
    await store.save({
      ...settings,
      chunking: { headingDepth: 2, target: 1000, max: 1500 },
    });
    expect(defaultChanged).toHaveBeenCalledTimes(1);
    expect((await bound!.chunking()).headingDepth).toBe(2);
    release();
    expect(bound).toBeUndefined();
  });
});

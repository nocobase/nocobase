// @vitest-environment node
/**
 * How the application tunes the knowledge base: weighted fusion with a minimum relevance and the reranker's candidates,
 * how hits are explained and to whom, each space's chunking and cutting it again in the background, and where sections
 * stand in the application's semantic index.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_CHUNKING,
  DEFAULT_RECALL,
  type KnowledgeRecall,
} from '../shared/knowledge.js';
import type { KnowledgeIndexer } from '../server/services/indexing.js';
import {
  fusedMax,
  fuseRankings,
  RRF_K,
  type KnowledgeSearchProvider,
} from '../server/services/search.js';
import { chunksRepo } from '../server/services/store.js';
import type { KnowledgeSettingsSource } from '../server/services/tuning.js';
import {
  READER,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;

describe('weighted fusion', () => {
  it('weighs each ranking and normalizes against what the rankings that answered could give', () => {
    const rankings = [
      [
        { chunkId: 'a', score: 1 },
        { chunkId: 'b', score: 1 },
      ],
      [{ chunkId: 'b', score: 1 }],
      [],
    ];
    const fused = fuseRankings(rankings, RRF_K, [0.5, 1.5, 9]);
    expect(fused.map((hit) => hit.chunkId)).toEqual(['b', 'a']);
    expect(fused[0]!.score).toBeCloseTo(0.5 / (RRF_K + 2) + 1.5 / (RRF_K + 1));
    // The empty ranking does not count towards the most a section could get.
    const max = fusedMax(rankings, RRF_K, [0.5, 1.5, 9]);
    expect(max).toBeCloseTo(2 / (RRF_K + 1));
    expect(fused[1]!.score / max).toBeCloseTo(0.5 / (RRF_K + 1) / max);
    // Without weights, plain RRF.
    expect(fuseRankings(rankings)[0]!.score).toBeCloseTo(
      1 / (RRF_K + 2) + 1 / (RRF_K + 1),
    );
    expect(fusedMax([[], []])).toBe(0);
  });
});

describe('tuning the knowledge base', () => {
  let h: KnowledgeHarness;
  let recall: KnowledgeRecall;
  let settings: KnowledgeSettingsSource & { explainers: Set<string> };
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    h.levels.set('reader', READER);
    recall = DEFAULT_RECALL;
    settings = {
      explainers: new Set(),
      chunking: () => Promise.resolve(DEFAULT_CHUNKING),
      recall: () => Promise.resolve(recall),
      mayExplain: (reader) =>
        Promise.resolve(settings.explainers.has(reader.userId)),
    };
    h.knowledge.bindSettings(settings);
  });
  afterEach(async () => {
    await h?.close();
  });

  it('writes sections while the application reads its chunking through its own connection', async () => {
    // As Acme's settings store does once its cache expires; on SQLite the write's transaction holds the only
    // connection, so the read has to happen before it opens.
    h.knowledge.bindSettings({
      ...settings,
      chunking: async () => {
        await chunksRepo(h.database.connection()).findMany({ limit: 1 });
        return DEFAULT_CHUNKING;
      },
    });
    const { docs, files } = h.knowledge;
    const created = await docs.create(h.user('lead'), {
      ...project,
      title: 'Release',
      content: '# Release\n\nShip it.',
    });
    await docs.update(h.user('lead'), created.id, {
      content: '# Release\n\nShip it on Friday.',
      expectedVersion: created.version,
    });
    await files.upload(
      h.user('lead'),
      project,
      new File(['# Notes\n\nPlain text.'], 'notes.md'),
    );
    await files.idle();
    const chunks = await chunksRepo(h.database.connection()).findMany({});
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  }, 10_000);

  const twoDocs = async () => {
    const { docs } = h.knowledge;
    const alpha = await docs.create(h.user('lead'), {
      ...project,
      title: 'Alpha',
      content: 'release notes alpha',
    });
    h.advance(1000);
    const beta = await docs.create(h.user('lead'), {
      ...project,
      title: 'Beta',
      content: 'release notes beta',
    });
    return { alpha, beta };
  };

  it('weighs providers, drops what falls under the minimum relevance, and hands the reranker its candidates', async () => {
    const { alpha, beta } = await twoDocs();
    const alphaChunk = (
      await chunksRepo(h.database.connection()).findMany({
        filter: { docId: alpha.id },
      })
    )[0]!.id;
    const semantic: KnowledgeSearchProvider = {
      name: 'vector',
      search: () => Promise.resolve([{ chunkId: alphaChunk, score: 0.9 }]),
    };
    h.knowledge.registerSearchProvider(semantic);
    const search = () =>
      h.knowledge.docs.search(h.user('lead'), project, 'release');
    // Equal weights: Alpha is ranked by both, first.
    expect((await search()).map((hit) => hit.docId)).toEqual([
      alpha.id,
      beta.id,
    ]);
    // Keywords only: Beta, newer, comes first; the vector ranking counts for nothing.
    recall = { ...DEFAULT_RECALL, weights: { contains: 2, vector: 0 } };
    expect((await search()).map((hit) => hit.docId)).toEqual([
      beta.id,
      alpha.id,
    ]);
    // A minimum relevance drops Beta (keyword rank 2 only, well under half of the most).
    recall = { ...DEFAULT_RECALL, minScore: 0.6 };
    expect((await search()).map((hit) => hit.docId)).toEqual([alpha.id]);
    // The default count, and the reranker reads at most the candidates set.
    recall = { ...DEFAULT_RECALL, limit: 1, rerankCandidates: 1 };
    const seen: number[] = [];
    h.knowledge.registerReranker({
      name: 'count',
      rerank(_query, candidates) {
        seen.push(candidates.length);
        return Promise.resolve([]);
      },
    });
    expect(await search()).toHaveLength(1);
    expect(seen).toEqual([1]);
  });

  it('explains each hit only when asked, to someone who manages the space or the search settings', async () => {
    await twoDocs();
    const ask = (userId: string) =>
      h.knowledge.docs.search(h.user(userId), project, 'release', {
        explain: true,
      });
    const [hit] = await ask('lead');
    expect(hit!.explain).toEqual({
      normalized: 1,
      providers: [{ name: 'contains', rank: 1, score: 1, weight: 1 }],
      reranked: null,
    });
    expect(
      (await h.knowledge.docs.search(h.user('lead'), project, 'release'))[0]!
        .explain,
    ).toBeUndefined();
    expect((await ask('reader'))[0]!.explain).toBeUndefined();
    settings.explainers.add('reader');
    expect((await ask('reader'))[0]!.explain?.normalized).toBe(1);
  });

  it('cuts a space again in the background when its chunking changes, and only the documents that change', async () => {
    const { docs } = h.knowledge;
    const content = [
      '# A',
      '',
      'One.',
      '',
      '## B',
      '',
      'Two.',
      '',
      '### C',
      '',
      'Three.',
    ].join('\n');
    const deep = await docs.create(h.user('lead'), {
      ...project,
      title: 'Deep',
      content,
    });
    const flat = await docs.create(h.user('lead'), {
      ...project,
      title: 'Flat',
      content: 'Just a paragraph.',
    });
    const count = async (docId: string) =>
      (
        await chunksRepo(h.database.connection()).findMany({
          filter: { docId },
        })
      ).length;
    expect(await count(deep.id)).toBe(3);
    expect(await h.knowledge.chunking.get(h.user('reader'), project)).toEqual({
      defaults: DEFAULT_CHUNKING,
      override: null,
      effective: DEFAULT_CHUNKING,
      rechunking: false,
      canManage: false,
    });
    await expect(
      h.knowledge.chunking.set(h.user('reader'), project, null),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      h.knowledge.chunking.set(h.user('lead'), project, {
        headingDepth: 5,
        target: 100,
        max: 50,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CHUNKING' });

    h.events.length = 0;
    const own = { headingDepth: 1, target: 1200, max: 2000 };
    const saved = await h.knowledge.chunking.set(h.user('lead'), project, own);
    expect(saved).toMatchObject({ override: own, effective: own });
    await h.knowledge.chunking.idle();
    expect(await count(deep.id)).toBe(1);
    // Only the document whose sections changed is rewritten, and says so.
    expect(
      h.events
        .filter((event) => event.type === 'chunks.changed')
        .map((event) => ('docId' in event ? event.docId : null)),
    ).toEqual([deep.id]);
    expect(await count(flat.id)).toBe(1);
    expect(
      (await h.knowledge.chunking.get(h.user('lead'), project)).rechunking,
    ).toBe(false);

    // A space with its own chunking ignores the default; following it again cuts it with the default.
    await h.knowledge.chunking.defaultChanged();
    await h.knowledge.chunking.idle();
    expect(await count(deep.id)).toBe(1);
    await h.knowledge.chunking.set(h.user('lead'), project, null);
    await h.knowledge.chunking.idle();
    expect(await count(deep.id)).toBe(3);
    // New versions are cut with the space's chunking too.
    settings.chunking = () =>
      Promise.resolve({ headingDepth: 2, target: 1200, max: 2000 });
    await h.knowledge.chunking.defaultChanged();
    await h.knowledge.chunking.idle();
    expect(await count(deep.id)).toBe(2);
  });

  it('says where a document’s sections stand in the semantic index, lists the unfinished, and queues them again', async () => {
    const { docs } = h.knowledge;
    const doc = await docs.create(h.user('lead'), {
      ...project,
      title: 'Guide',
      content: '# One\n\nFirst.\n\n# Two\n\nSecond.\n\n# Three\n\nThird.',
    });
    const off = await h.knowledge.indexing.doc(h.user('reader'), doc.id);
    expect(off).toMatchObject({ enabled: false, state: null, total: 3 });
    expect(off.chunks.map((chunk) => [chunk.headingPath, chunk.lines])).toEqual(
      [
        [['One'], [1, 3]],
        [['Two'], [5, 7]],
        [['Three'], [9, 11]],
      ],
    );
    expect(
      await h.knowledge.indexing.unfinished(h.user('reader'), project),
    ).toBeNull();

    const reindexed: string[] = [];
    const indexer: KnowledgeIndexer = {
      states: () =>
        Promise.resolve(
          new Map([
            [`${doc.id}:0`, { state: 'done' as const, error: null }],
            [`${doc.id}:1`, { state: 'failed' as const, error: 'Too long.' }],
          ]),
        ),
      unfinished: () =>
        Promise.resolve([
          { docId: doc.id, ordinal: 1, state: 'failed', error: 'Too long.' },
          { docId: doc.id, ordinal: 2, state: 'pending', error: null },
          { docId: 'gone', ordinal: 0, state: 'pending', error: null },
        ]),
      reindex(docId) {
        reindexed.push(docId);
        return Promise.resolve();
      },
    };
    h.knowledge.registerIndexer(indexer);
    const on = await h.knowledge.indexing.doc(h.user('reader'), doc.id);
    expect(on).toMatchObject({
      enabled: true,
      state: 'failed',
      total: 3,
      indexed: 1,
      pending: 1,
      failed: 1,
    });
    expect(on.chunks.map((chunk) => [chunk.state, chunk.error])).toEqual([
      ['done', null],
      ['failed', 'Too long.'],
      ['pending', null],
    ]);
    expect(
      await h.knowledge.indexing.unfinished(h.user('reader'), project),
    ).toEqual([
      {
        docId: doc.id,
        title: 'Guide',
        kind: 'article',
        pending: 1,
        failed: 1,
        error: 'Too long.',
      },
    ]);
    await expect(
      h.knowledge.indexing.reindex(h.user('reader'), doc.id),
    ).rejects.toMatchObject({ status: 403 });
    await h.knowledge.indexing.reindex(h.user('lead'), doc.id);
    expect(reindexed).toEqual([doc.id]);
  });
});

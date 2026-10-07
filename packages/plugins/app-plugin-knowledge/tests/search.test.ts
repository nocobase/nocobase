// @vitest-environment node
/**
 * Search providers: each ranks sections within the spaces the reader reads, and the rankings are fused with Reciprocal
 * Rank Fusion (k = 60). Whatever a provider answers, a section outside those spaces, archived or out of date is dropped.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  fuseRankings,
  RRF_K,
  type KnowledgeSearchProvider,
  type KnowledgeSearchSpace,
} from '../server/services/search.js';
import { chunksRepo } from '../server/services/store.js';
import {
  ADMIN,
  SYSTEM,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;
const other = { scope: 'project', scopeId: 'p2' } as const;

describe('fusing rankings', () => {
  it('sums 1 / (60 + rank) over the rankings that hold a section', () => {
    const fused = fuseRankings([
      [
        { chunkId: 'a', score: 9 },
        { chunkId: 'b', score: 8 },
        { chunkId: 'c', score: 7 },
      ],
      [
        { chunkId: 'c', score: 0.9 },
        { chunkId: 'a', score: 0.8 },
        // A repeat counts once, at its first rank.
        { chunkId: 'c', score: 0.1 },
      ],
    ]);
    expect(fused.map((hit) => hit.chunkId)).toEqual(['a', 'c', 'b']);
    expect(fused[0].score).toBeCloseTo(1 / (RRF_K + 1) + 1 / (RRF_K + 2));
    expect(fused[1].score).toBeCloseTo(1 / (RRF_K + 3) + 1 / (RRF_K + 1));
    expect(fused[2].score).toBeCloseTo(1 / (RRF_K + 2));
    expect(fuseRankings([])).toEqual([]);
  });
});

describe('search providers', () => {
  let h: KnowledgeHarness;
  let asked: (readonly KnowledgeSearchSpace[])[];
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['lead', 'admin'],
    });
    h.projects.set('p2', {
      id: 'p2',
      name: 'Secret',
      leadUserId: 'admin',
      seenBy: ['admin'],
    });
    asked = [];
  });
  afterEach(async () => {
    await h?.close();
  });

  /** A provider ranking the given sections whatever it is asked, recording the spaces it was given. */
  const fixed = (ids: () => string[]): KnowledgeSearchProvider => ({
    name: 'fixed',
    search(spaces) {
      asked.push(spaces);
      return Promise.resolve(
        ids().map((chunkId, index) => ({ chunkId, score: 1 - index / 10 })),
      );
    },
  });

  it('fuses a registered provider with the contains match, within the reader’s spaces', async () => {
    const { docs } = h.knowledge;
    const deploy = await docs.create(h.user('lead'), {
      ...project,
      title: 'Deploy',
      content: '# Deploy\n\nShip the release on Fridays.',
    });
    const rollback = await docs.create(h.user('lead'), {
      ...project,
      title: 'Rollback',
      content: '# Rollback\n\nUndo a broken release.',
    });
    const secret = await docs.create(h.user('admin'), {
      ...other,
      title: 'Secret',
      content: '# Secret\n\nThe release key.',
    });
    const chunkOf = async (docId: string) =>
      (
        await chunksRepo(h.database.connection()).findMany({
          filter: { docId },
        })
      )[0].id;
    const ids = {
      deploy: await chunkOf(deploy.id),
      rollback: await chunkOf(rollback.id),
      secret: await chunkOf(secret.id),
    };
    // Semantically "undo" is closest to the rollback; the provider also answers a space the reader does not read.
    const stop = h.knowledge.registerSearchProvider(
      fixed(() => [ids.secret, ids.rollback]),
    );
    expect(h.knowledge.searchProviders().map((p) => p.name)).toEqual([
      'contains',
      'fixed',
    ]);
    const hits = await docs.search(h.user('lead'), project, 'release');
    expect(asked).toHaveLength(1);
    expect(asked[0].map((space) => space.ref)).toEqual([project]);
    // Rollback: second for contains (older), first for the provider; the secret is dropped before ranking.
    expect(hits.map((hit) => hit.docId)).toEqual([rollback.id, deploy.id]);
    expect(hits[0].score).toBeCloseTo(1 / (RRF_K + 2) + 1 / (RRF_K + 1));
    expect(hits[1].score).toBeCloseTo(1 / (RRF_K + 1));
    expect(hits[0]).toMatchObject({
      kind: 'article',
      excerpt: expect.stringContaining('release'),
      reranked: null,
    });
    // Each hit says how every provider ranked it, in that provider's own terms.
    expect(hits[0].providers).toEqual([
      { name: 'contains', rank: 2, score: 0.5 },
      { name: 'fixed', rank: 1, score: 0.9 },
    ]);
    expect(hits[1].providers).toEqual([
      { name: 'contains', rank: 1, score: 1 },
    ]);

    // An archived document's section is dropped whoever ranks it.
    await docs.archive(h.user('lead'), rollback.id);
    expect(
      (await docs.search(h.user('lead'), project, 'release')).map(
        (hit) => hit.docId,
      ),
    ).toEqual([deploy.id]);

    stop();
    expect(h.knowledge.searchProviders().map((p) => p.name)).toEqual([
      'contains',
    ]);
  });

  it('keeps answering when a provider fails', async () => {
    const errors: string[] = [];
    const quiet = await createKnowledgeHarness({
      onError: (message) => errors.push(message),
    });
    quiet.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    await quiet.knowledge.docs.create(quiet.user('lead'), {
      ...project,
      title: 'Deploy',
      content: 'Ship it.',
    });
    quiet.knowledge.registerSearchProvider({
      name: 'broken',
      search: () => Promise.reject(new Error('down')),
    });
    expect(
      await quiet.knowledge.docs.search(quiet.user('lead'), project, 'ship'),
    ).toMatchObject([{ title: 'Deploy' }]);
    await quiet.close();
    expect(errors).toEqual(['The knowledge search provider broken failed.']);
  });

  it('reorders the fused hits by the first reranker that answers', async () => {
    const errors: string[] = [];
    const quiet = await createKnowledgeHarness({
      onError: (message) => errors.push(message),
    });
    quiet.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    const { docs } = quiet.knowledge;
    const a = await docs.create(quiet.user('lead'), {
      ...project,
      title: 'Alpha',
      content: 'release notes alpha',
    });
    quiet.advance(1000);
    const b = await docs.create(quiet.user('lead'), {
      ...project,
      title: 'Beta',
      content: 'release notes beta',
    });
    const seen: { query: string; texts: string[] }[] = [];
    quiet.knowledge.registerReranker({
      name: 'broken',
      rerank: () => Promise.reject(new Error('down')),
    });
    const stop = quiet.knowledge.registerReranker({
      name: 'alpha-first',
      rerank(query, candidates) {
        seen.push({ query, texts: candidates.map((c) => c.text) });
        const alpha = candidates.find((c) => c.text.includes('alpha'))!;
        return Promise.resolve([{ chunkId: alpha.chunkId, score: 0.97 }]);
      },
    });
    const hits = await docs.search(quiet.user('lead'), project, 'release');
    // Contains ranks the newer Beta first; the reranker puts Alpha first and Beta keeps its fused place after it.
    expect(hits.map((hit) => [hit.docId, hit.reranked])).toEqual([
      [a.id, 0.97],
      [b.id, null],
    ]);
    expect(seen).toEqual([
      {
        query: 'release',
        texts: ['release notes beta', 'release notes alpha'],
      },
    ]);
    expect(errors).toEqual(['The knowledge search reranker broken failed.']);
    stop();
    expect(
      (await docs.search(quiet.user('lead'), project, 'release')).map(
        (hit) => hit.docId,
      ),
    ).toEqual([b.id, a.id]);
    await quiet.close();
  });
});

describe('reading for applications', () => {
  let h: KnowledgeHarness;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('lead', ADMIN);
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
  });
  afterEach(async () => {
    await h?.close();
  });

  it('reads an entry’s current sections, every live section, and whole texts', async () => {
    const { docs } = h.knowledge;
    const deploy = await docs.create(h.user('lead'), {
      ...project,
      title: 'Deploy',
      content: '# Deploy\n\nShip it.\n\n## Rollback\n\nUndo it.',
    });
    const folder = await docs.create(h.user('lead'), {
      ...project,
      kind: 'folder',
      title: 'Guides',
    });
    const other = await docs.create(h.user('lead'), {
      ...SYSTEM,
      title: 'Glossary',
      content: 'Terms.',
    });
    const conn = h.database.connection();

    const read = await h.knowledge.chunksOf(conn, deploy.id);
    expect(read.doc).toMatchObject({
      id: deploy.id,
      space: project,
      version: 1,
      kind: 'article',
      archived: false,
    });
    expect(read.chunks.map((chunk) => chunk.headingPath)).toEqual([
      ['Deploy'],
      ['Deploy', 'Rollback'],
    ]);
    expect((await h.knowledge.chunksOf(conn, folder.id)).chunks).toEqual([]);
    expect(await h.knowledge.chunksOf(conn, 'missing')).toEqual({
      doc: null,
      chunks: [],
    });

    const rows = [];
    for await (const batch of h.knowledge.eachChunk({ batchSize: 1 }))
      rows.push(...batch);
    expect(rows.map((row) => [row.title, row.space.scope]).sort()).toEqual([
      ['Deploy', 'project'],
      ['Deploy', 'project'],
      ['Glossary', 'system'],
    ]);

    const readable = await h.knowledge.readable(h.user('lead'), [
      project,
      SYSTEM,
    ]);
    const texts = await h.knowledge.texts(conn, readable);
    expect(texts.complete).toBe(true);
    expect(
      texts.spaces.map((space) => space.docs.map((doc) => doc.title)),
    ).toEqual([['Deploy'], ['Glossary']]);
    expect(texts.chars).toBe(
      '# Deploy\n\nShip it.\n\n## Rollback\n\nUndo it.'.length +
        'Terms.'.length,
    );
    expect(await h.knowledge.texts(conn, readable, { maxChars: 10 })).toEqual({
      spaces: [],
      chars: expect.any(Number) as number,
      complete: false,
    });

    // Archiving an entry says its sections changed, and they are no longer read.
    h.events.length = 0;
    await docs.archive(h.user('lead'), other.id);
    expect(h.events).toContainEqual({
      type: 'chunks.changed',
      docId: other.id,
      version: 1,
      spaceId: expect.any(String) as string,
      space: SYSTEM,
    });
    expect((await h.knowledge.chunksOf(conn, other.id)).chunks).toEqual([]);
    h.events.length = 0;
    await docs.restore(h.user('lead'), other.id);
    expect(h.events.map((event) => event.type)).toContain('chunks.changed');
  });
});

/**
 * Knowledge search: every registered `KnowledgeSearchProvider` ranks sections (`kbChunks`) the reader reads, given the
 * spaces with the reader's gates in each (`permissions.ts`) to filter by in its own query, and the knowledge base fuses
 * their rankings with weighted Reciprocal Rank Fusion: a section's score is the sum, over the providers that ranked it,
 * of `weight / (RRF_K + rank)` (rank 1 first; each provider's weight from the recall settings, 1 by default). Whatever a
 * provider answers, a section the gates do not let through, of an archived entry or of an older version is dropped
 * before the fusion; after it, a section whose normalized score (`fusedMax`) is under the recall settings' `minScore`.
 *
 * The built-in provider is a plain contains match (`createContainsSearch`): the query is split into words at whitespace
 * (at most eight, lower-cased); it ranks the sections whose text contains every word, and the first section of an
 * entry whose title contains every word, title matches first, then the most recently updated entry, then the section's
 * place in it. Each word is a case-insensitive `LIKE` through the repository, so it runs on every database the
 * application does and Chinese needs no word splitting. At most `CANDIDATES` entries and sections are read per search.
 *
 * Reserved: a full-text provider over the database's own index. A vector provider of the application's registers
 * beside the contains match (`Knowledge.registerSearchProvider`), and re-reads an entry's sections when they change
 * (`chunks.changed`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  KnowledgeSearchProviderRank,
  SpaceRef,
} from '../../shared/knowledge.js';
import { gateFilter, type SpaceGates } from './permissions.js';
import {
  chunksRepo,
  docsRepo,
  num,
  type ChunkRecord,
  type DocRecord,
} from './store.js';

/** A space a search may read: one the reader reads something in. */
export interface KnowledgeSearchSpace {
  /** The `kbSpaces` id, which every section (`kbChunks.spaceId`) names. */
  readonly id: string;
  readonly ref: SpaceRef;
  /**
   * What the reader reads in it, to filter by inside the provider's own query: `gateFilter` over the knowledge tables,
   * or `gatesOf` against the `gate` an index keeps with each section.
   */
  readonly gates: SpaceGates;
}

/** One section a provider ranks: its id (`kbChunks.id`) and the provider's own score, best first. */
export interface KnowledgeSearchRank {
  readonly chunkId: string;
  readonly score: number;
}

/**
 * A way to rank the sections that answer a query, within `spaces` and only what their gates let through, at most
 * `limit` of them, best first. The knowledge base fuses every registered provider's ranking (`fuseRankings`).
 */
export interface KnowledgeSearchProvider {
  readonly name: string;
  search(
    spaces: readonly KnowledgeSearchSpace[],
    query: string,
    options: { readonly limit: number },
  ): Promise<readonly KnowledgeSearchRank[]>;
}

/**
 * A second look at the fused ranking (a rerank model of the application's, say): it gets the query and the text of the
 * best fused sections, at most the recall settings' `rerankCandidates` (never more than `RERANK_CANDIDATES`), and answers them in its order with its own scores, at most `limit`.
 * A section it leaves out keeps its fused place after those it ranked. A failing reranker is reported, and one that
 * ranks nothing has no opinion: either way the next is asked, and without one that answers the fused order is kept.
 */
export interface KnowledgeSearchReranker {
  readonly name: string;
  rerank(
    query: string,
    candidates: readonly { readonly chunkId: string; readonly text: string }[],
    options: { readonly limit: number },
  ): Promise<readonly KnowledgeSearchRank[]>;
}

/** At most this many fused sections are handed to a reranker. */
export const RERANK_CANDIDATES = 50;

/** Per section, each provider's own rank and score in its (admitted) ranking. */
export function providerRanks(
  names: readonly string[],
  rankings: readonly (readonly KnowledgeSearchRank[])[],
): Map<string, KnowledgeSearchProviderRank[]> {
  const found = new Map<string, KnowledgeSearchProviderRank[]>();
  rankings.forEach((ranking, index) => {
    const seen = new Set<string>();
    let rank = 0;
    for (const { chunkId, score } of ranking) {
      if (seen.has(chunkId)) continue;
      seen.add(chunkId);
      rank += 1;
      const list = found.get(chunkId) ?? [];
      list.push({ name: names[index] ?? `provider-${index + 1}`, rank, score });
      found.set(chunkId, list);
    }
  });
  return found;
}

/**
 * The fused ranking after the first reranker that answers: the sections it ranked first, in its order with its score
 * (`reranked`), then the rest in their fused order. Unchanged without a reranker or when every one fails.
 */
export async function rerank<
  T extends { readonly chunkId: string; readonly reranked: number | null },
>(
  rerankers: readonly KnowledgeSearchReranker[],
  query: string,
  fused: readonly T[],
  textOf: (chunkId: string) => string,
  onError: (message: string, error: unknown) => void,
  candidates: number = RERANK_CANDIDATES,
): Promise<T[]> {
  if (fused.length === 0) return [...fused];
  const head = fused.slice(
    0,
    Math.min(Math.max(1, candidates), RERANK_CANDIDATES),
  );
  const shown = head.map((item) => ({
    chunkId: item.chunkId,
    text: textOf(item.chunkId),
  }));
  for (const reranker of rerankers) {
    let ranked: readonly KnowledgeSearchRank[];
    try {
      ranked = await reranker.rerank(query, shown, {
        limit: shown.length,
      });
    } catch (error) {
      onError(`The knowledge search reranker ${reranker.name} failed.`, error);
      continue;
    }
    const byId = new Map(head.map((item) => [item.chunkId, item]));
    const placed = new Set<string>();
    const first: T[] = [];
    for (const { chunkId, score } of ranked) {
      const item = byId.get(chunkId);
      if (!item || placed.has(chunkId)) continue;
      placed.add(chunkId);
      first.push({ ...item, reranked: score });
    }
    // An empty answer is no opinion, as a failure is.
    if (first.length === 0) continue;
    return [...first, ...fused.filter((item) => !placed.has(item.chunkId))];
  }
  return [...fused];
}

/** The constant of Reciprocal Rank Fusion. */
export const RRF_K = 60;

/** What two contains matches are ordered by. */
export interface MatchOrder {
  readonly titleMatch: boolean;
  /** ISO time the entry was last updated. */
  readonly updatedAt: string;
  readonly docId: string;
  /** The section's first line. */
  readonly line: number;
}

/** At most this many entries and sections are read per contains search. */
const CANDIDATES = 500;
const MAX_TERMS = 8;
export const EXCERPT_RADIUS = 60;

/** The query's words, lower-cased, without repeats. */
export function termsOf(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/\s+/u)
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_TERMS);
}

/** About `EXCERPT_RADIUS` characters either side of the first word found, whitespace flattened. */
export function excerptOf(text: string, terms: readonly string[]): string {
  const flat = text.replace(/\s+/gu, ' ').trim();
  const lower = flat.toLowerCase();
  const at = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)[0];
  if (at === undefined)
    return flat.length > EXCERPT_RADIUS * 2
      ? `${flat.slice(0, EXCERPT_RADIUS * 2)}…`
      : flat;
  const start = Math.max(0, at - EXCERPT_RADIUS);
  const end = Math.min(flat.length, at + EXCERPT_RADIUS);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`;
}

/** Title matches first, then the most recently updated entry, then the section's place in it. */
export function compareMatches(a: MatchOrder, b: MatchOrder): number {
  return (
    Number(b.titleMatch) - Number(a.titleMatch) ||
    b.updatedAt.localeCompare(a.updatedAt) ||
    a.docId.localeCompare(b.docId) ||
    a.line - b.line
  );
}

/** A stored time as ISO text, which sorts as time does. */
export function isoTime(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** Whether `title` holds every word. */
export function titleHolds(title: string, terms: readonly string[]): boolean {
  const lower = title.toLowerCase();
  return terms.length > 0 && terms.every((term) => lower.includes(term));
}

/**
 * Weighted Reciprocal Rank Fusion: each section's summed `weight / (k + rank)` over the rankings that hold it (each
 * ranking's weight 1 unless `weights` says otherwise), best first; a tie keeps the order in which the sections were
 * first ranked.
 */
export function fuseRankings(
  rankings: readonly (readonly KnowledgeSearchRank[])[],
  k: number = RRF_K,
  weights: readonly number[] = [],
): KnowledgeSearchRank[] {
  const scores = new Map<string, number>();
  rankings.forEach((ranking, index) => {
    const weight = weights[index] ?? 1;
    const seen = new Set<string>();
    let rank = 0;
    for (const { chunkId } of ranking) {
      if (seen.has(chunkId)) continue;
      seen.add(chunkId);
      rank += 1;
      scores.set(chunkId, (scores.get(chunkId) ?? 0) + weight / (k + rank));
    }
  });
  return [...scores.entries()]
    .map(([chunkId, score]) => ({ chunkId, score }))
    .sort((a, b) => b.score - a.score);
}

/**
 * The most a fused score can be: what a section ranked first by every ranking that holds something would get. A fused
 * score over it is the normalized score (0–1) the recall settings' `minScore` is compared with; 0 when nothing ranked.
 */
export function fusedMax(
  rankings: readonly (readonly KnowledgeSearchRank[])[],
  k: number = RRF_K,
  weights: readonly number[] = [],
): number {
  return rankings.reduce(
    (sum, ranking, index) =>
      ranking.length > 0 ? sum + (weights[index] ?? 1) / (k + 1) : sum,
    0,
  );
}

/** The built-in provider: a plain contains match through `read()`'s connection. */
export function createContainsSearch(
  read: () => DatabaseConnection,
): KnowledgeSearchProvider {
  return {
    name: 'contains',
    async search(spaces, query, { limit }) {
      const terms = termsOf(query);
      if (terms.length === 0 || spaces.length === 0) return [];
      const conn = read();
      const gates = spaces.map((space) => space.gates);

      const titled = await docsRepo(conn).findMany({
        filter: (f) =>
          f.and([
            gateFilter(f, gates),
            f.date('archivedAt').empty(),
            ...terms.map((term) =>
              f.string('title').includes(term, { mode: 'insensitive' }),
            ),
          ]),
        limit: CANDIDATES,
      });
      const sections = await chunksRepo(conn).findMany({
        filter: (f) =>
          f.and([
            gateFilter(f, gates),
            ...terms.map((term) =>
              f.text('text').includes(term, { mode: 'insensitive' }),
            ),
          ]),
        limit: CANDIDATES,
      });
      const matched = new Set(sections.map((chunk) => chunk.docId));
      const firsts = titled.filter((doc) => !matched.has(doc.id));
      if (firsts.length > 0)
        sections.push(
          ...(await chunksRepo(conn).findMany({
            filter: (f) =>
              f.and([
                f.or(firsts.map((doc) => f.string('docId').eq(doc.id))),
                f.number('ordinal').eq(0),
              ]),
          })),
        );
      const docs = await liveDocs(conn, sections);
      const titleIds = new Set(titled.map((doc) => doc.id));
      const order = (chunk: ChunkRecord): MatchOrder => {
        const doc = docs.get(chunk.docId)!;
        return {
          titleMatch: titleIds.has(doc.id),
          updatedAt: isoTime(doc.updatedAt),
          docId: doc.id,
          line: num(chunk.lineStart),
        };
      };
      return sections
        .filter((chunk) => isCurrent(docs, chunk))
        .sort((a, b) => compareMatches(order(a), order(b)))
        .slice(0, limit)
        .map((chunk, index) => ({ chunkId: chunk.id, score: 1 / (index + 1) }));
    },
  };
}

/** The live entries of `sections`, by id. */
export async function liveDocs(
  conn: DatabaseConnection,
  sections: readonly Pick<ChunkRecord, 'docId'>[],
): Promise<Map<string, DocRecord>> {
  const ids = [...new Set(sections.map((chunk) => chunk.docId))];
  const found = new Map<string, DocRecord>();
  for (let at = 0; at < ids.length; at += 100) {
    const batch = ids.slice(at, at + 100);
    for (const doc of await docsRepo(conn).findMany({
      filter: (f) =>
        f.and([
          f.or(batch.map((id) => f.string('id').eq(id))),
          f.date('archivedAt').empty(),
        ]),
    }))
      found.set(doc.id, doc);
  }
  return found;
}

/** Whether a section is of a live entry's current version: a section left from an older one is never cited. */
export function isCurrent(
  docs: ReadonlyMap<string, DocRecord>,
  chunk: Pick<ChunkRecord, 'docId' | 'version'>,
): boolean {
  const doc = docs.get(chunk.docId);
  return doc !== undefined && num(chunk.version) === num(doc.currentVersion);
}

/** The sections of `ids`, by id. */
export async function chunksById(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Map<string, ChunkRecord>> {
  const found = new Map<string, ChunkRecord>();
  for (let at = 0; at < ids.length; at += 100) {
    const batch = ids.slice(at, at + 100);
    for (const chunk of await chunksRepo(conn).findMany({
      filter: (f) => f.or(batch.map((id) => f.string('id').eq(id))),
    }))
      found.set(chunk.id, chunk);
  }
  return found;
}

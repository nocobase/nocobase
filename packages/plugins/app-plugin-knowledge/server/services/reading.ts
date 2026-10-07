/**
 * Reads for the application's own indexes and prompts, outside any reader's access check: the caller decides who sees
 * what it builds from them (a vector index filtered by the spaces a reader reads, a prompt built from `ReadableSpaces`).
 *
 * - `chunksOf`: an entry's searched sections at its current version, none for an archived or missing entry or a folder;
 *   what a listener of `chunks.changed` re-reads.
 * - `eachChunk`: every live entry's current sections, in batches, for rebuilding an index.
 * - `texts`: the whole current text of every live article and file (its extracted text) the reader reads in readable
 *   spaces, filtered by their gates in the query; with `maxChars`, sized first from the sections' lengths, and not
 *   loaded when that is more.
 *
 * Each section carries its entry's access key and gate (`permissions.ts`), what an index filters its search by.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { KnowledgeEntryKind, SpaceRef } from '../../shared/knowledge.js';
import { accessGate, gateFilter, type SpaceGates } from './permissions.js';
import type { ReadableSpaces } from './readable.js';
import {
  chunksRepo,
  currentVersionsOf,
  docsRepo,
  findDoc,
  findSpace,
  findSpaceById,
  json,
  num,
  spacesRepo,
  type DocRecord,
} from './store.js';

export interface ChunksOfDoc {
  /** The entry; null when it is not there. */
  readonly doc: {
    readonly id: string;
    readonly spaceId: string;
    readonly space: SpaceRef;
    readonly version: number;
    readonly title: string;
    readonly kind: KnowledgeEntryKind;
    readonly archived: boolean;
    /** Its access key: the nearest entry at or above it with permissions of its own; null for the space's. */
    readonly aclKey: string | null;
    /** `space:<spaceId>` or `node:<aclKey>`: what a reader's gates must hold to read it. */
    readonly gate: string;
  } | null;
  /** Its sections at the current version, in order; none when it is archived, missing or a folder. */
  readonly chunks: readonly {
    readonly id: string;
    readonly ordinal: number;
    readonly text: string;
    readonly headingPath: readonly string[];
    readonly hash: string;
  }[];
}

/** One section of `eachChunk`. */
export interface KnowledgeChunkRow {
  readonly chunkId: string;
  readonly docId: string;
  readonly spaceId: string;
  readonly space: SpaceRef;
  readonly version: number;
  readonly ordinal: number;
  readonly title: string;
  readonly headingPath: readonly string[];
  readonly text: string;
  /** SHA-256 of `text`. */
  readonly hash: string;
  readonly aclKey: string | null;
  /** `space:<spaceId>` or `node:<aclKey>`: what a reader's gates must hold to read it. */
  readonly gate: string;
}

export interface KnowledgeTexts {
  /** Readable spaces that have live articles or files, nearest first. */
  readonly spaces: readonly {
    readonly space: SpaceRef;
    readonly docs: readonly {
      readonly id: string;
      readonly slug: string;
      readonly title: string;
      readonly kind: KnowledgeEntryKind;
      readonly version: number;
      /** An article's Markdown, a file's extracted text (empty until extracted). */
      readonly content: string;
    }[];
  }[];
  /**
   * The characters of every `content`; when not `complete`, the size of the sections measured instead (about the same,
   * less blank lines).
   */
  readonly chars: number;
  /** False when `maxChars` was given and the text is longer: then `spaces` is empty. */
  readonly complete: boolean;
}

const refOf = (record: { scope: SpaceRef['scope']; scopeId: string | null }) =>
  ({ scope: record.scope, scopeId: record.scopeId ?? '' }) as SpaceRef;

export async function chunksOf(
  conn: DatabaseConnection,
  docId: string,
): Promise<ChunksOfDoc> {
  const doc = await findDoc(conn, docId);
  if (!doc) return { doc: null, chunks: [] };
  const space = await findSpaceById(conn, doc.spaceId);
  if (!space) return { doc: null, chunks: [] };
  const version = num(doc.currentVersion);
  const archived = Boolean(doc.archivedAt);
  const view = {
    id: doc.id,
    spaceId: doc.spaceId,
    space: refOf(space),
    version,
    title: doc.title,
    kind: doc.kind,
    archived,
    aclKey: doc.aclKey ?? null,
    gate: accessGate(doc.spaceId, doc.aclKey ?? null),
  };
  if (archived || doc.kind === 'folder') return { doc: view, chunks: [] };
  const rows = await chunksRepo(conn).findMany({
    filter: { docId: doc.id, version },
    sort: (sort) => [sort.field('ordinal').asc()],
  });
  return {
    doc: view,
    chunks: rows.map((row) => ({
      id: row.id,
      ordinal: num(row.ordinal),
      text: row.text,
      headingPath: json<string[]>(row.headingPath, []),
      hash: row.hash,
    })),
  };
}

/** Every live entry's current sections, a batch of entries (`batchSize`, 100 by default) at a time. */
export async function* eachChunk(
  read: () => DatabaseConnection,
  options: { readonly batchSize?: number } = {},
): AsyncGenerator<KnowledgeChunkRow[], void, undefined> {
  const size = Math.min(Math.max(options.batchSize ?? 100, 1), 500);
  const spaces = new Map(
    (await spacesRepo(read()).findMany({})).map((space) => [
      space.id,
      refOf(space),
    ]),
  );
  for (let offset = 0; ; offset += size) {
    const conn = read();
    const docs: DocRecord[] = await docsRepo(conn).findMany({
      filter: (f) =>
        f.and([f.date('archivedAt').empty(), f.string('kind').ne('folder')]),
      sort: (sort) => [sort.field('id').asc()],
      limit: size,
      offset,
    });
    if (docs.length === 0) return;
    const byId = new Map(docs.map((doc) => [doc.id, doc]));
    const rows = await chunksRepo(conn).findMany({
      filter: (f) =>
        f.or(
          docs.map((doc) =>
            f.and([
              f.string('docId').eq(doc.id),
              f.number('version').eq(num(doc.currentVersion)),
            ]),
          ),
        ),
      sort: (sort) => [sort.field('docId').asc(), sort.field('ordinal').asc()],
    });
    const batch: KnowledgeChunkRow[] = [];
    for (const row of rows) {
      const doc = byId.get(row.docId)!;
      const space = spaces.get(doc.spaceId);
      if (!space) continue;
      batch.push({
        chunkId: row.id,
        docId: doc.id,
        spaceId: doc.spaceId,
        space,
        version: num(doc.currentVersion),
        ordinal: num(row.ordinal),
        title: doc.title,
        headingPath: json<string[]>(row.headingPath, []),
        text: row.text,
        hash: row.hash,
        aclKey: doc.aclKey ?? null,
        gate: accessGate(doc.spaceId, doc.aclKey ?? null),
      });
    }
    if (batch.length > 0) yield batch;
    if (docs.length < size) return;
  }
}

/** Through `conn`: the whole current text of what the reader reads of the readable spaces' live articles and files. */
export async function textsOf(
  conn: DatabaseConnection,
  readable: ReadableSpaces,
  options: { readonly maxChars?: number } = {},
): Promise<KnowledgeTexts> {
  const found: { ref: SpaceRef; gates: SpaceGates }[] = [];
  for (const { ref, gates } of readable.spaces) {
    const space = await findSpace(conn, ref);
    if (space && gates?.spaceId === space.id) found.push({ ref, gates });
  }
  if (options.maxChars !== undefined) {
    const measured = await measure(
      conn,
      found.map((space) => space.gates),
    );
    if (measured > options.maxChars)
      return { spaces: [], chars: measured, complete: false };
  }
  const spaces: KnowledgeTexts['spaces'][number][] = [];
  let chars = 0;
  for (const { ref, gates } of found) {
    const docs = await docsRepo(conn).findMany({
      filter: (f) =>
        f.and([
          gateFilter(f, [gates]),
          f.date('archivedAt').empty(),
          f.string('kind').ne('folder'),
        ]),
      sort: (sort) => [
        sort.field('sortOrder').asc(),
        sort.field('title').asc(),
        sort.field('id').asc(),
      ],
    });
    if (docs.length === 0) continue;
    const versions = await currentVersionsOf(conn, docs);
    const entries = docs.map((doc) => {
      const content = versions.get(doc.id)?.content ?? '';
      chars += content.length;
      return {
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        kind: doc.kind,
        version: num(doc.currentVersion),
        content,
      };
    });
    spaces.push({ space: ref, docs: entries });
  }
  return { spaces, chars, complete: true };
}

/** The characters of the current sections the gates let through, read from their stored lengths only. */
async function measure(
  conn: DatabaseConnection,
  gates: readonly SpaceGates[],
): Promise<number> {
  if (gates.length === 0) return 0;
  const live = new Map(
    (
      await docsRepo(conn).findMany({
        filter: (f) =>
          f.and([gateFilter(f, gates), f.date('archivedAt').empty()]),
        select: (select) => select.fields('id', 'currentVersion'),
      })
    ).map((doc) => [doc.id, num(doc.currentVersion)]),
  );
  const rows = await chunksRepo(conn).findMany({
    filter: (f) => gateFilter(f, gates),
    select: (select) => select.fields('docId', 'version', 'charCount'),
  });
  let total = 0;
  for (const row of rows)
    if (live.get(row.docId) === num(row.version)) total += num(row.charCount);
  return total;
}

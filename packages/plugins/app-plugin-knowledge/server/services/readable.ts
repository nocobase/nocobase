/**
 * The spaces a reader reads, decided before a transaction, for the work that reads inside one (a claim's): an outline of
 * their documents, their whole text and a snapshot of them (`snapshots.ts`). Deciding access takes the application's
 * own reads, which on SQLite cannot run while a transaction holds the one connection, so it is done first and handed in,
 * down to which nodes of each space the reader reads (its gates, `permissions.ts`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { SpaceRef } from '../../shared/knowledge.js';
import { createAccessCheck, type KnowledgeReader } from './access.js';
import type { KnowledgeContext } from './context.js';
import { passes, visibleTree, type SpaceGates } from './permissions.js';
import { docsRepo, findSpace, type DocRecord } from './store.js';

/** Of the spaces asked for, nearest first, those the reader reads something in, with their titles and gates. */
export interface ReadableSpaces {
  readonly reader: KnowledgeReader;
  readonly spaces: readonly {
    readonly ref: SpaceRef;
    readonly title: string | null;
    /** Not the first space asked for: one the first inherits, say. */
    readonly inherited: boolean;
    /** What the reader reads in it; null while the space has no entries. */
    readonly gates: SpaceGates | null;
  }[];
}

/** The documents of a readable space the reader may read, each under its nearest readable ancestor. */
export function readableDocs<T extends DocRecord>(
  docs: readonly T[],
  gates: SpaceGates | null,
): T[] {
  if (!gates) return [];
  return visibleTree(docs, (doc) => passes(gates, doc));
}

/** A live document of an outline. */
export interface OutlineDoc {
  readonly id: string;
  readonly parentId: string | null;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
}

/** A readable space's live documents, in tree order of each level (`sortOrder`, then title). */
export interface SpaceOutline {
  readonly space: SpaceRef;
  readonly docs: readonly OutlineDoc[];
}

/** Of `refs` (nearest first), the spaces the reader reads. */
export async function readableSpaces(
  context: KnowledgeContext,
  reader: KnowledgeReader,
  refs: readonly SpaceRef[],
): Promise<ReadableSpaces> {
  const check = createAccessCheck(context, reader);
  const spaces: ReadableSpaces['spaces'][number][] = [];
  for (const [index, ref] of refs.entries()) {
    const acl = await check.acl(ref);
    if (acl.sees)
      spaces.push({
        ref,
        title: await context.access.title(ref),
        inherited: index > 0,
        gates: acl.gates,
      });
  }
  return { reader, spaces };
}

/** Through `conn` (a transaction's): the live documents of each readable space that has any. */
export async function outlineOf(
  conn: DatabaseConnection,
  readable: ReadableSpaces,
): Promise<SpaceOutline[]> {
  const outlines: SpaceOutline[] = [];
  for (const { ref, gates } of readable.spaces) {
    const space = await findSpace(conn, ref);
    if (!space || gates?.spaceId !== space.id) continue;
    const all = await docsRepo(conn).findMany({
      filter: (f) =>
        f.and([f.string('spaceId').eq(space.id), f.date('archivedAt').empty()]),
      sort: (sort) => [
        sort.field('sortOrder').asc(),
        sort.field('title').asc(),
      ],
    });
    const docs = readableDocs(all, gates);
    outlines.push({
      space: ref,
      docs: docs.map((doc) => ({
        id: doc.id,
        parentId: doc.parentId,
        slug: doc.slug,
        title: doc.title,
        summary: doc.summary,
      })),
    });
  }
  return outlines;
}

/**
 * Where an entry's sections stand in the application's semantic index (`KnowledgeIndexer`, which the application
 * registers with its vector index; without one, semantic search is off and every state is null): a document's sections
 * with their state, the documents of a space not yet fully indexed, and queuing a document's sections again.
 *
 * A section the index has no entry for yet is pending: it is about to be queued.
 */
import type {
  KnowledgeChunkInfo,
  KnowledgeDocIndex,
  KnowledgeIndexState,
  KnowledgeUnindexedDoc,
  SpaceRef,
} from '../../shared/knowledge.js';
import { docNotFound } from '../errors.js';
import { createAccessCheck, type KnowledgeReader } from './access.js';
import type { KnowledgeContext } from './context.js';
import { readableDoc } from './documents.js';
import {
  chunksRepo,
  docsRepo,
  findDoc,
  findSpace,
  json,
  num,
  type DocRecord,
} from './store.js';

/** A section's state in the index, keyed `<docId>:<ordinal>`. */
export interface KnowledgeSectionState {
  readonly state: KnowledgeIndexState;
  readonly error: string | null;
}

/** The application's semantic index, as the knowledge base asks it about its sections. */
export interface KnowledgeIndexer {
  /** The state of each section that has one, keyed `<docId>:<ordinal>`; null while semantic search is off. */
  states(
    sections: readonly { readonly docId: string; readonly ordinal: number }[],
  ): Promise<Map<string, KnowledgeSectionState> | null>;
  /** A space's sections still pending or failed, failed first, at most `limit`; null while semantic search is off. */
  unfinished(
    spaceId: string,
    limit: number,
  ): Promise<
    | (KnowledgeSectionState & {
        readonly docId: string;
        readonly ordinal: number;
      })[]
    | null
  >;
  /** Queues an entry's sections again, the failed ones included. */
  reindex(docId: string): Promise<void>;
}

export interface IndexingService {
  /** A document's sections at its current version and their state (`read`). */
  doc(viewer: KnowledgeReader, docId: string): Promise<KnowledgeDocIndex>;
  /** Queues a document's sections again (`edit`), and answers where they stand. */
  reindex(viewer: KnowledgeReader, docId: string): Promise<KnowledgeDocIndex>;
  /** The documents of `space` the reader reads whose sections are not all indexed; null while semantic search is off. */
  unfinished(
    viewer: KnowledgeReader,
    space: SpaceRef,
  ): Promise<KnowledgeUnindexedDoc[] | null>;
}

/** How many sections are read for a space's list, and how many documents it shows. */
const UNFINISHED_SECTIONS = 2000;
const UNFINISHED_DOCS = 50;

/** The overall state of a document's sections. */
export function overallState(counts: {
  readonly total: number;
  readonly pending: number;
  readonly failed: number;
}): KnowledgeIndexState | null {
  if (counts.total === 0) return null;
  return counts.failed > 0 ? 'failed' : counts.pending > 0 ? 'pending' : 'done';
}

export function createIndexingService(
  context: KnowledgeContext,
  indexer: () => KnowledgeIndexer | null,
): IndexingService {
  async function indexOf(doc: DocRecord): Promise<KnowledgeDocIndex> {
    const version = num(doc.currentVersion);
    const rows = await chunksRepo(context.read()).findMany({
      filter: { docId: doc.id, version },
      sort: (sort) => sort.field('ordinal').asc(),
    });
    const current = indexer();
    const live = !doc.archivedAt && doc.kind !== 'folder';
    const states =
      current && live
        ? await current.states(
            rows.map((row) => ({ docId: doc.id, ordinal: num(row.ordinal) })),
          )
        : null;
    const chunks: KnowledgeChunkInfo[] = rows.map((row) => {
      const found = states?.get(`${doc.id}:${num(row.ordinal)}`);
      return {
        ordinal: num(row.ordinal),
        headingPath: json<string[]>(row.headingPath, []),
        anchor: row.anchor,
        lines: [num(row.lineStart), num(row.lineEnd)] as const,
        chars: num(row.charCount),
        state: states ? (found?.state ?? 'pending') : null,
        error: found?.error ?? null,
      };
    });
    const count = (state: KnowledgeIndexState) =>
      chunks.filter((chunk) => chunk.state === state).length;
    const counts = {
      total: chunks.length,
      indexed: count('done'),
      pending: count('pending'),
      failed: count('failed'),
    };
    return {
      docId: doc.id,
      version,
      enabled: states !== null,
      ...counts,
      state: states ? overallState(counts) : null,
      chunks,
    };
  }

  return {
    async doc(viewer, docId) {
      const { doc } = await readableDoc(
        context,
        createAccessCheck(context, viewer),
        docId,
      );
      return indexOf(doc);
    },

    async reindex(viewer, docId) {
      const access = createAccessCheck(context, viewer);
      const doc = await findDoc(context.read(), docId);
      if (!doc) throw docNotFound();
      await access.requireDoc(doc, 'edit');
      await indexer()?.reindex(docId);
      return indexOf(doc);
    },

    async unfinished(viewer, space) {
      const access = createAccessCheck(context, viewer);
      await access.requireRead(space);
      const current = indexer();
      if (!current) return null;
      const record = await findSpace(context.read(), space);
      if (!record) return [];
      const open = await current.unfinished(record.id, UNFINISHED_SECTIONS);
      if (open === null) return null;
      const byDoc = new Map<
        string,
        { pending: number; failed: number; error: string | null }
      >();
      for (const section of open) {
        const entry = byDoc.get(section.docId) ?? {
          pending: 0,
          failed: 0,
          error: null,
        };
        if (section.state === 'failed') {
          entry.failed += 1;
          entry.error ??= section.error;
        } else entry.pending += 1;
        byDoc.set(section.docId, entry);
      }
      const ids = [...byDoc.keys()];
      const docs: DocRecord[] = [];
      for (let at = 0; at < ids.length; at += 100) {
        const batch = ids.slice(at, at + 100);
        docs.push(
          ...(await docsRepo(context.read()).findMany({
            filter: (f) =>
              f.and([
                f.or(batch.map((id) => f.string('id').eq(id))),
                f.date('archivedAt').empty(),
              ]),
          })),
        );
      }
      const shown: KnowledgeUnindexedDoc[] = [];
      for (const doc of docs) {
        if (!(await access.doc(doc)).access.read) continue;
        const entry = byDoc.get(doc.id)!;
        shown.push({
          docId: doc.id,
          title: doc.title,
          kind: doc.kind,
          ...entry,
        });
      }
      return shown
        .sort(
          (a, b) =>
            b.failed - a.failed ||
            b.pending - a.pending ||
            a.title.localeCompare(b.title),
        )
        .slice(0, UNFINISHED_DOCS);
    },
  };
}

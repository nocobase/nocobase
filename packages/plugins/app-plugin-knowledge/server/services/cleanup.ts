/**
 * Clearing what uploads leave behind: upload tickets past their expiry, and stored files (`kbFiles`) that no version and
 * no pending, sent back or accepted proposal names, uploaded longer ago than a grace period (a file is stored before the
 * proposal or version naming it commits, so a young one may still be on its way). Rejecting, withdrawing and replacing a
 * proposal delete its file at once; this catches what a failure, a crash or an abandoned upload left. The provider runs it on a timer
 * (`knowledge.cleanup`); it is safe to run on several instances at once.
 */
import type { KnowledgeContext } from './context.js';
import { discardFile } from './files.js';
import type { KnowledgeFileStore } from './storage.js';
import {
  filesRepo,
  proposalsRepo,
  ticketsRepo,
  versionsRepo,
  type FileRecord,
} from './store.js';

/** How long an unreferenced upload is kept: a day. */
export const CLEANUP_GRACE_MS: number = 24 * 60 * 60 * 1000;
const BATCH = 200;

export interface CleanupReport {
  /** Upload tickets deleted. */
  readonly tickets: number;
  /** Stored files deleted. */
  readonly files: number;
}

export async function cleanupUploads(
  context: Pick<KnowledgeContext, 'read' | 'now' | 'onError'>,
  store: KnowledgeFileStore | null,
  options: { readonly graceMs?: number } = {},
): Promise<CleanupReport> {
  const now = context.now();
  const tickets = await ticketsRepo(context.read()).deleteMany({
    filter: (f) => f.date('expiresAt').before(now.toISOString()),
  });
  // Without storage nothing could have been stored, nor can it be deleted.
  if (!store) return { tickets: tickets.deletedCount, files: 0 };
  const before = new Date(
    now.getTime() - (options.graceMs ?? CLEANUP_GRACE_MS),
  ).toISOString();
  let files = 0;
  for (let offset = 0; ;) {
    const conn = context.read();
    const candidates: FileRecord[] = await filesRepo(conn).findMany({
      filter: (f) => f.date('createdAt').before(before),
      sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      limit: BATCH,
      offset,
    });
    if (candidates.length === 0) break;
    const ids = candidates.map((file) => file.id);
    const named = new Set<string>();
    for (const row of await versionsRepo(conn).findMany({
      filter: (f) => f.or(ids.map((id) => f.string('fileId').eq(id))),
      select: (select) => select.fields('fileId'),
    }))
      if (row.fileId) named.add(row.fileId);
    for (const row of await proposalsRepo(conn).findMany({
      filter: (f) =>
        f.and([
          f.or(ids.map((id) => f.string('fileId').eq(id))),
          f.or([
            f.string('status').eq('pending'),
            f.string('status').eq('revising'),
            f.string('status').eq('accepted'),
          ]),
        ]),
      select: (select) => select.fields('fileId'),
    }))
      if (row.fileId) named.add(row.fileId);
    let removed = 0;
    for (const file of candidates) {
      if (named.has(file.id)) continue;
      try {
        await discardFile(context, store, file.id);
        removed += 1;
      } catch (error) {
        context.onError(
          `The knowledge base could not delete the unused file ${file.id}.`,
          error,
        );
      }
    }
    files += removed;
    // The rows deleted are no longer counted by the offset.
    offset += candidates.length - removed;
    if (candidates.length < BATCH) break;
  }
  return { tickets: tickets.deletedCount, files };
}

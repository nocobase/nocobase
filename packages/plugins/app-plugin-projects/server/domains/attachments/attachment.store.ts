/**
 * `pmAttachments`. Only this file reads or writes it; the file plugin's repository inserts the rows (`storage.ts`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import { oneOf } from '../../kernel/db.js';

export const ATTACHMENTS = 'pmAttachments';

export interface AttachmentRecord {
  readonly id: string;
  readonly disk: string;
  readonly key: string;
  readonly filename: string;
  readonly ext: string;
  readonly mimeType: string;
  readonly size: string | number;
  readonly uploaderType: string;
  readonly uploaderId: string;
  readonly issueId: string | null;
  readonly commentId: string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

/** Who uploaded a file, as stored. */
export interface UploaderRef {
  readonly type: string;
  readonly id: string;
}

const files = (conn: DatabaseConnection) =>
  conn.repository<AttachmentRecord>(ATTACHMENTS);

export async function findAttachment(
  conn: DatabaseConnection,
  id: string,
): Promise<AttachmentRecord | undefined> {
  if (!isUuid(id)) return undefined;
  return (await files(conn).findOne({ filter: { id } })) ?? undefined;
}

/** The rows named, in no particular order; ids that are not uuids match nothing. */
export async function findAttachments(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<AttachmentRecord[]> {
  const wanted = ids.filter(isUuid);
  if (wanted.length === 0) return [];
  return files(conn).findMany({ filter: (f) => oneOf(f, 'id', wanted) });
}

/** An issue's own files (not its comments'), oldest first. */
export async function issueAttachments(
  conn: DatabaseConnection,
  issueId: string,
): Promise<AttachmentRecord[]> {
  return files(conn).findMany({
    filter: (f) =>
      f.and([f.string('issueId').eq(issueId), f.string('commentId').eq(null)]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

/** The files of an issue's comments that are not deleted, oldest first. */
export async function liveCommentAttachments(
  conn: DatabaseConnection,
  issueId: string,
): Promise<AttachmentRecord[]> {
  const rows = await files(conn).findMany({
    filter: (f) =>
      f.and([f.string('issueId').eq(issueId), f.string('commentId').ne(null)]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
  const commentIds = [
    ...new Set(rows.map((row) => row.commentId).filter((id) => id !== null)),
  ];
  if (commentIds.length === 0) return [];
  const live = new Set(
    (
      await conn
        .repository<{ id: string; deletedAt: unknown }>('pmComments')
        .findMany({
          filter: (f) =>
            f.and([oneOf(f, 'id', commentIds), f.date('deletedAt').empty()]),
          select: (select) => select.fields('id'),
        })
    ).map((comment) => comment.id),
  );
  return rows.filter(
    (row) => row.commentId !== null && live.has(row.commentId),
  );
}

/** The files of the comments named, oldest first. */
export async function commentAttachments(
  conn: DatabaseConnection,
  commentIds: readonly string[],
): Promise<AttachmentRecord[]> {
  if (commentIds.length === 0) return [];
  return files(conn).findMany({
    filter: (f) => oneOf(f, 'commentId', commentIds),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

/** Attaches the rows to an issue, and to one of its comments when `commentId` is set. */
export async function attachRows(
  conn: DatabaseConnection,
  ids: readonly string[],
  target: { readonly issueId: string; readonly commentId: string | null },
): Promise<void> {
  if (ids.length === 0) return;
  await files(conn).updateMany({
    filter: (f) => f.and([oneOf(f, 'id', ids), f.string('issueId').eq(null)]),
    values: { ...target, updatedAt: new Date() },
  });
}

export async function deleteAttachment(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await files(conn).deleteMany({ filter: { id } });
}

/** Uploads attached to nothing, oldest first, at most `limit`. */
export async function unattached(
  conn: DatabaseConnection,
  limit: number,
): Promise<AttachmentRecord[]> {
  return files(conn).findMany({
    filter: (f) => f.string('issueId').eq(null),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
    limit,
  });
}

/** Files of comments that were deleted, at most `limit`. */
export async function ofDeletedComments(
  conn: DatabaseConnection,
  limit: number,
): Promise<AttachmentRecord[]> {
  return files(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('commentId').ne(null),
        f
          .relation('comment')
          .some((comment) => comment.date('deletedAt').notEmpty()),
      ]),
    limit,
  });
}

/** Deletes the row only while it is still attached to nothing; answers whether it did. */
export async function deleteIfUnattached(
  conn: DatabaseConnection,
  id: string,
): Promise<boolean> {
  await files(conn).deleteMany({
    filter: (f) => f.and([f.string('id').eq(id), f.string('issueId').eq(null)]),
  });
  return !(await files(conn).findOne({ filter: { id } }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/** File ids are the file plugin's uuids; anything else names no file (and must not reach a uuid column). */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

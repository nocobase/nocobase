/**
 * `pmComments` and `pmCommentReactions`. Only this file reads or writes them.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { oneOf } from '../../kernel/db.js';

const COMMENTS = 'pmComments';
const REACTIONS = 'pmCommentReactions';

export interface CommentRecord {
  readonly id: string;
  readonly issueId: string;
  readonly authorType: string;
  readonly authorId: string | null;
  readonly kind: string;
  readonly content: string;
  readonly parentId: string | null;
  readonly rootId: string;
  readonly origin: Readonly<Record<string, unknown>> | string | null;
  readonly via: string | null;
  readonly editedAt: Date | string | null;
  readonly deletedAt: Date | string | null;
  readonly deletedByType: string | null;
  readonly deletedById: string | null;
  readonly resolvedAt: Date | string | null;
  readonly resolvedById: string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

export interface ReactionRecord {
  readonly id: string;
  readonly commentId: string;
  readonly userId: string;
  readonly emoji: string;
  readonly createdAt: Date | string;
}

const comments = (conn: DatabaseConnection) =>
  conn.repository<CommentRecord>(COMMENTS);
const reactions = (conn: DatabaseConnection) =>
  conn.repository<ReactionRecord>(REACTIONS);

export async function insertComment(
  conn: DatabaseConnection,
  values: Omit<
    CommentRecord,
    | 'editedAt'
    | 'deletedAt'
    | 'deletedByType'
    | 'deletedById'
    | 'resolvedAt'
    | 'resolvedById'
  >,
): Promise<void> {
  await comments(conn).createOne({
    values: {
      ...values,
      editedAt: null,
      deletedAt: null,
      deletedByType: null,
      deletedById: null,
      resolvedAt: null,
      resolvedById: null,
    },
  });
}

export async function findComment(
  conn: DatabaseConnection,
  id: string,
): Promise<CommentRecord | undefined> {
  return (await comments(conn).findOne({ filter: { id } })) ?? undefined;
}

export async function updateComment(
  conn: DatabaseConnection,
  id: string,
  values: Partial<
    Pick<
      CommentRecord,
      | 'content'
      | 'editedAt'
      | 'deletedAt'
      | 'deletedByType'
      | 'deletedById'
      | 'resolvedAt'
      | 'resolvedById'
    >
  >,
): Promise<void> {
  await comments(conn).updateOne({
    filter: { id },
    values: { ...values, updatedAt: new Date() },
  });
}

/**
 * A page of an issue's root comments, newest first, continuing strictly after `cursor` (the `createdAt` and `id` of
 * the last root of the previous page). Asks for one more than `limit` to tell whether another page follows.
 */
export async function rootsPage(
  conn: DatabaseConnection,
  issueId: string,
  limit: number,
  cursor?: { readonly createdAt: string; readonly id: string },
): Promise<CommentRecord[]> {
  return comments(conn).findMany({
    filter: (f) =>
      f.and([f.string('issueId').eq(issueId), f.string('parentId').eq(null)]),
    ...(cursor ? { cursor } : {}),
    sort: (sort) => [sort.field('createdAt').desc(), sort.field('id').desc()],
    limit: limit + 1,
  });
}

/** Every reply of the roots `rootIds`, oldest first. */
export async function repliesOf(
  conn: DatabaseConnection,
  rootIds: readonly string[],
): Promise<CommentRecord[]> {
  if (rootIds.length === 0) return [];
  return comments(conn).findMany({
    filter: (f) =>
      f.and([oneOf(f, 'rootId', rootIds), f.string('parentId').ne(null)]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

/** An issue's comments, oldest first, optionally since a time or within one thread. */
export async function commentsOf(
  conn: DatabaseConnection,
  issueId: string,
  options: {
    readonly since?: string;
    readonly rootId?: string;
    readonly rootsOnly?: boolean;
    readonly limit?: number;
  } = {},
): Promise<CommentRecord[]> {
  return comments(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('issueId').eq(issueId),
        ...(options.since ? [f.date('createdAt').after(options.since)] : []),
        ...(options.rootId ? [f.string('rootId').eq(options.rootId)] : []),
        ...(options.rootsOnly ? [f.string('parentId').eq(null)] : []),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
    ...(options.limit ? { limit: options.limit } : {}),
  });
}

export async function reactionsFor(
  conn: DatabaseConnection,
  commentIds: readonly string[],
): Promise<ReactionRecord[]> {
  if (commentIds.length === 0) return [];
  return reactions(conn).findMany({
    filter: (f) => oneOf(f, 'commentId', commentIds),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

/** Adds the reaction unless the person already gave it; returns whether it was added. */
export async function addReaction(
  conn: DatabaseConnection,
  values: Omit<ReactionRecord, 'createdAt'>,
): Promise<boolean> {
  const existing = await reactions(conn).findOne({
    filter: {
      commentId: values.commentId,
      userId: values.userId,
      emoji: values.emoji,
    },
  });
  if (existing) return false;
  await reactions(conn).createOne({
    values: { ...values, createdAt: new Date() },
  });
  return true;
}

export async function removeReaction(
  conn: DatabaseConnection,
  commentId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  await reactions(conn).deleteMany({ filter: { commentId, userId, emoji } });
}

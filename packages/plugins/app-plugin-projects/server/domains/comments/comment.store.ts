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
  /** Only these roots. */
  rootIds?: readonly string[],
): Promise<CommentRecord[]> {
  if (rootIds?.length === 0) return [];
  return comments(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('issueId').eq(issueId),
        f.string('parentId').eq(null),
        ...(rootIds ? [oneOf(f, 'id', rootIds)] : []),
      ]),
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

/** One author's newest comments on an issue, newest first: live ones only with `live`, and none after `until`. */
export async function newestCommentsBy(
  conn: DatabaseConnection,
  issueId: string,
  author: { readonly type: string; readonly id: string },
  options: {
    readonly live?: boolean;
    readonly until?: string;
    readonly limit: number;
  },
): Promise<CommentRecord[]> {
  return comments(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('issueId').eq(issueId),
        f.string('authorType').eq(author.type),
        f.string('authorId').eq(author.id),
        ...(options.live ? [f.date('deletedAt').empty()] : []),
        ...(options.until ? [f.date('createdAt').notAfter(options.until)] : []),
      ]),
    sort: (sort) => [sort.field('createdAt').desc(), sort.field('id').desc()],
    limit: options.limit,
  });
}

/**
 * One author's newest comment on each of `issueIds` (only live ones with `live`), in one query: a comment no later one
 * by the author follows, the same order `newestCommentsBy` reads. Issues without one are left out.
 */
export async function newestCommentEachBy(
  conn: DatabaseConnection,
  issueIds: readonly string[],
  author: { readonly type: string; readonly id: string },
  options: { readonly live?: boolean } = {},
): Promise<
  Pick<
    CommentRecord,
    'id' | 'issueId' | 'content' | 'createdAt' | 'deletedAt'
  >[]
> {
  if (issueIds.length === 0) return [];
  let query = conn.query
    .selectFrom(`${COMMENTS} as comment`)
    .select([
      'comment.id as id',
      'comment.issueId as issueId',
      'comment.content as content',
      'comment.createdAt as createdAt',
      'comment.deletedAt as deletedAt',
    ])
    .where('comment.issueId', 'in', [...new Set(issueIds)])
    .where('comment.authorType', '=', author.type)
    .where('comment.authorId', '=', author.id);
  if (options.live) query = query.where('comment.deletedAt', 'is', null);
  return query
    .where((outer) => {
      let newer = outer
        .selectFrom(`${COMMENTS} as newer`)
        .select('newer.id')
        .whereRef('newer.issueId', '=', 'comment.issueId')
        .where('newer.authorType', '=', author.type)
        .where('newer.authorId', '=', author.id);
      if (options.live) newer = newer.where('newer.deletedAt', 'is', null);
      return outer.not(
        outer.exists(
          newer.where((eb) =>
            eb.or([
              eb('newer.createdAt', '>', eb.ref('comment.createdAt')),
              eb.and([
                eb('newer.createdAt', '=', eb.ref('comment.createdAt')),
                eb('newer.id', '>', eb.ref('comment.id')),
              ]),
            ]),
          ),
        ),
      );
    })
    .execute();
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

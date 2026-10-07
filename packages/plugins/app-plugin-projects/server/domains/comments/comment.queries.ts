/**
 * Comment reads: threads a page at a time (a page is a number of roots, each with every reply), and the plain list
 * other plugins read through `CommentReader`. A deleted comment keeps its place in the thread, without its words or
 * reactions.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  MENTION_CANDIDATE_LIMIT,
  REACTION_EMOJIS,
  THREAD_PAGE_LIMIT,
  type CommentReaction,
  type MentionCandidate,
  type CommentThread,
  type IssueComment,
  type ReactionEmoji,
  type ThreadPage,
} from '../../../shared/comments.js';
import type { Viewer } from '../../access/viewer.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import { isNote } from '../../kernel/mentions.js';
import { decodeCursor, pageLimit, pageOf } from '../../kernel/pagination.js';
import type { TxRunner } from '../../kernel/tx.js';
import { requireVisibleIssue } from '../issues/index.js';
import {
  commentsOf,
  reactionsFor,
  repliesOf,
  rootsPage,
  type CommentRecord,
} from './comment.store.js';
import type { CommentAttachments, CommentReader } from './ports.js';

const iso = (value: Date | string | null): string | null =>
  value === null ? null : new Date(value).toISOString();

function reactionList(
  rows: readonly { readonly emoji: string; readonly userId: string }[],
): CommentReaction[] {
  const byEmoji = new Map<string, string[]>();
  for (const row of rows)
    byEmoji.set(row.emoji, [...(byEmoji.get(row.emoji) ?? []), row.userId]);
  return REACTION_EMOJIS.filter((emoji) => byEmoji.has(emoji)).map(
    (emoji: ReactionEmoji) => {
      const userIds = byEmoji.get(emoji) ?? [];
      return { emoji, count: userIds.length, userIds };
    },
  );
}

/** The comments as the API returns them, named, with their reactions. */
export async function mapComments(
  conn: DatabaseConnection,
  kinds: KindRegistry,
  records: readonly CommentRecord[],
  attachments?: CommentAttachments,
): Promise<IssueComment[]> {
  const name = await kinds.nameAll(conn, [
    ...records.map((row) => ({ type: row.authorType, id: row.authorId })),
    ...records.map((row) => ({ type: 'user', id: row.resolvedById })),
  ]);
  const live = records.filter((row) => !row.deletedAt).map((row) => row.id);
  const reactions = await reactionsFor(conn, live);
  const files = attachments
    ? await attachments.ofComments(conn, live)
    : new Map<string, never>();
  return records.map((row) => {
    const deleted = row.deletedAt !== null;
    return {
      id: row.id,
      issueId: row.issueId,
      authorType: row.authorType,
      authorId: row.authorId,
      authorName: name(row.authorType, row.authorId),
      kind: row.kind,
      content: deleted ? '' : row.content,
      note: !deleted && isNote(row.content),
      parentId: row.parentId,
      rootId: row.rootId,
      via:
        row.via === 'cli' || row.via === 'api_key' || row.via === 'agent'
          ? row.via
          : null,
      createdAt: iso(row.createdAt) as string,
      editedAt: iso(row.editedAt),
      deleted,
      reactions: deleted
        ? []
        : reactionList(reactions.filter((item) => item.commentId === row.id)),
      resolvedAt: iso(row.resolvedAt),
      resolvedById: row.resolvedById,
      resolvedByName: row.resolvedById ? name('user', row.resolvedById) : null,
      attachments: deleted ? [] : (files.get(row.id) ?? []),
    };
  });
}

/** A page of an issue's threads: the newest roots first page by page, each page oldest first. */
export async function threadPage(
  conn: DatabaseConnection,
  kinds: KindRegistry,
  issueId: string,
  options: { readonly cursor?: string; readonly limit?: number } = {},
  attachments?: CommentAttachments,
): Promise<ThreadPage> {
  const limit = pageLimit(
    options.limit,
    THREAD_PAGE_LIMIT.default,
    THREAD_PAGE_LIMIT.max,
  );
  const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;
  const rows = await rootsPage(
    conn,
    issueId,
    limit,
    cursor
      ? { createdAt: String(cursor.createdAt), id: String(cursor.id) }
      : undefined,
  );
  const page = pageOf(rows, limit, (row) => ({
    createdAt: iso(row.createdAt),
    id: row.id,
  }));
  const roots = page.rows.reverse();
  const replies = await repliesOf(
    conn,
    roots.map((root) => root.id),
  );
  const mapped = await mapComments(
    conn,
    kinds,
    [...roots, ...replies],
    attachments,
  );
  const byId = new Map(mapped.map((comment) => [comment.id, comment]));
  const data: CommentThread[] = roots.map((root) => ({
    root: byId.get(root.id) as IssueComment,
    replies: replies
      .filter((reply) => reply.rootId === root.id)
      .map((reply) => byId.get(reply.id) as IssueComment),
  }));
  return { data, nextCursor: page.nextCursor };
}

export interface CommentQueries extends CommentReader {
  /** The `@` list for text about `issueId` (404 unless the viewer sees it), or about no issue yet. */
  mentionCandidates(
    viewer: Viewer,
    input: {
      readonly q?: string;
      readonly issueId?: string;
      readonly limit?: number;
    },
  ): Promise<MentionCandidate[]>;
  threads(
    viewer: Viewer,
    idOrKey: string,
    options: { readonly cursor?: string; readonly limit?: number },
  ): Promise<ThreadPage>;
}

export function createCommentQueries(deps: {
  readonly tx: TxRunner;
  readonly kinds: KindRegistry;
  readonly attachments?: () => CommentAttachments;
}): CommentQueries {
  return {
    async threads(viewer, idOrKey, options) {
      const conn = deps.tx.read();
      const issue = await requireVisibleIssue(conn, viewer, idOrKey);
      return threadPage(
        conn,
        deps.kinds,
        issue.id,
        options,
        deps.attachments?.(),
      );
    },
    async mentionCandidates(viewer, input) {
      const conn = deps.tx.read();
      const issue = input.issueId
        ? await requireVisibleIssue(conn, viewer, input.issueId)
        : null;
      return deps.kinds.mentionCandidates(conn, {
        userId: viewer.userId,
        issueId: issue?.id ?? null,
        q: input.q ?? '',
        limit: pageLimit(
          input.limit,
          MENTION_CANDIDATE_LIMIT.default,
          MENTION_CANDIDATE_LIMIT.max,
        ),
      });
    },
    async list(conn, issueId, options = {}) {
      return mapComments(
        conn,
        deps.kinds,
        await commentsOf(conn, issueId, options),
        deps.attachments?.(),
      );
    },
  };
}

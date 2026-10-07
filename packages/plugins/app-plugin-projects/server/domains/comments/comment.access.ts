/**
 * Who may write, change and remove comments (`pm.issues` `comment` and `moderate-comments`, `shared/access.ts`).
 *
 * | Operation                          | Needs                                                                |
 * | ---------------------------------- | -------------------------------------------------------------------- |
 * | read, react, follow                | seeing the issue                                                     |
 * | comment, reply, resolve a thread   | `comment` (related: the issues they see)                             |
 * | edit or delete one's own comment   | `comment`, and having written it as a person, as a plain comment     |
 * | delete someone else's comment      | `moderate-comments` (related: issues they own or whose project they lead) |
 *
 * Nobody edits someone else's words.
 */
import { PLAIN_COMMENT } from '../../../shared/comments.js';
import type { Issue } from '../../../shared/issues.js';
import { requireAction, scopeOf, type Viewer } from '../../access/viewer.js';
import type { DatabaseConnection } from '@nocobase/db';
import { managesIssue } from '../issues/index.js';
import type { CommentRecord } from './comment.store.js';

export function requireCommenter(viewer: Viewer): void {
  requireAction(
    viewer,
    'pm.issues',
    'comment',
    'You may not comment on issues.',
  );
}

/** The viewer wrote it, as a person, as a plain comment. */
export function isOwnComment(viewer: Viewer, comment: CommentRecord): boolean {
  return (
    comment.authorType === 'user' &&
    comment.authorId === viewer.userId &&
    comment.kind === PLAIN_COMMENT
  );
}

export function canEditComment(
  viewer: Viewer,
  comment: CommentRecord,
): boolean {
  return (
    !comment.deletedAt &&
    scopeOf(viewer, 'pm.issues', 'comment') !== 'none' &&
    isOwnComment(viewer, comment)
  );
}

export async function canDeleteComment(
  conn: DatabaseConnection,
  viewer: Viewer,
  comment: CommentRecord,
  issue: Issue,
): Promise<boolean> {
  if (canEditComment(viewer, comment)) return true;
  return managesIssue(conn, viewer, issue, 'moderate-comments');
}

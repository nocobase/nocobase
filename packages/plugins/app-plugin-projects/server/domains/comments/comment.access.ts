/**
 * Who may write, change and remove comments (`pm.issues` `comment` and `moderate-comments`, `shared/access.ts`).
 *
 * | Operation                          | Needs                                                                |
 * | ---------------------------------- | -------------------------------------------------------------------- |
 * | read, react, follow                | seeing the issue                                                     |
 * | comment, reply, resolve a thread   | `comment` (related: the issues they see)                             |
 * | edit or delete one's own comment   | `comment`, as a person or the authenticated originating run, as a plain comment |
 * | delete someone else's comment      | `moderate-comments` (related: issues they own or whose project they lead) |
 *
 * Nobody edits someone else's words.
 */
import { PLAIN_COMMENT } from '../../../shared/comments.js';
import { SYSTEM_KIND } from '../../../shared/kinds.js';
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

/** A person's own plain comment, or a plain comment recorded by this authenticated run and actor. */
export function isOwnComment(viewer: Viewer, comment: CommentRecord): boolean {
  if (viewer.runId) {
    let origin = comment.origin;
    if (typeof origin === 'string') {
      try {
        origin = JSON.parse(origin) as Record<string, unknown>;
      } catch {
        return false;
      }
    }
    const trace =
      origin && typeof origin === 'object' ? origin.trace : undefined;
    return (
      comment.kind === PLAIN_COMMENT &&
      comment.authorType !== SYSTEM_KIND &&
      comment.authorId !== null &&
      comment.authorType === viewer.actor.type &&
      comment.authorId === viewer.actor.id &&
      viewer.actor.via === 'agent' &&
      !!trace &&
      typeof trace === 'object' &&
      'runId' in trace &&
      trace.runId === viewer.runId
    );
  }
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
  if (viewer.runId) return false;
  return managesIssue(conn, viewer, issue, 'moderate-comments');
}

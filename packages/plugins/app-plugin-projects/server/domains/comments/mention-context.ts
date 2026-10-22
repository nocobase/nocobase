import type { DatabaseConnection } from '@nocobase/db';

import type { Issue } from '../../../shared/issues.js';
import type { Viewer } from '../../access/viewer.js';
import type { MentionContext } from '../../kernel/kinds.js';
import { canSee } from '../issues/issue.access.js';

/** The issue has already passed visibility checks before this context is built. */
export async function mentionContext(
  conn: DatabaseConnection,
  viewer: Viewer,
  issue: Issue,
): Promise<MentionContext> {
  return {
    viewer,
    issue,
    canEditIssue: await canSee(conn, viewer, issue, 'edit'),
    canCommentIssue: await canSee(conn, viewer, issue, 'comment'),
  };
}

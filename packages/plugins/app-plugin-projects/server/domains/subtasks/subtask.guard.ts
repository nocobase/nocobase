import type { DatabaseConnection } from '@nocobase/db';

import { conflict } from '../../kernel/errors.js';

/**
 * Serialize relationship writes and issue transitions that change blockers across projects and processes until the outermost transaction
 * commits. The conditional update also rejects an old repeatable-read snapshot: a write lock cannot refresh the graph.
 * This row must be separate from settings/counters: writing those in a plan could otherwise expose the latest row
 * version through MySQL's read-your-own-writes, while graph reads still use the old snapshot. Always take this guard
 * before issue rows and the issue counter. Plans take it before their first row, and standalone creates before their
 * counter. Taking it without advancing the revision preserves concurrent independent creates and plain-edit plans.
 * The adapter reports matched rows for this no-op update (including mysql2's default FOUND_ROWS), not changed values.
 */
export async function lockIssueGraph(
  conn: DatabaseConnection,
  advance = true,
): Promise<void> {
  const graph = conn.repository<{ id: string; revision: number }>(
    'pmIssueGraph',
  );
  const row = await graph.findOne({ filter: { id: 'default' } });
  if (!row) throw new Error('The issue dependency graph is not initialized.');
  const { updatedCount } = await graph.updateMany({
    filter: { id: 'default', revision: row.revision },
    values: { revision: { increment: advance ? 1 : 0 } },
  });
  if (updatedCount !== 1)
    throw conflict(
      'DEPENDENCY_GRAPH_CHANGED',
      'The issue dependency graph changed meanwhile. Reload and retry.',
    );
}

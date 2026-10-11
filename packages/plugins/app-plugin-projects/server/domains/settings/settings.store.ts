/**
 * Workspace settings/counter and the separate dependency graph revision. `pmSettings` is created by the seed
 * `202609300005_pm_default_settings`; a missing settings row reads as the defaults and is recreated by the first write.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { conflict } from '../../kernel/errors.js';

export const SETTINGS = 'pmSettings';
const ROW_ID = 'default';
export const DEFAULT_PREFIX = 'PM';

export interface SettingsRow {
  readonly id: string;
  readonly issuePrefix: string;
  readonly issueCounter: number;
  readonly values: Readonly<Record<string, unknown>> | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

const settings = (conn: DatabaseConnection) =>
  conn.repository<SettingsRow>(SETTINGS);

async function ensureRow(conn: DatabaseConnection): Promise<void> {
  if (await settings(conn).exists({ filter: { id: ROW_ID } })) return;
  const now = new Date();
  await settings(conn).createOne({
    values: {
      id: ROW_ID,
      issuePrefix: DEFAULT_PREFIX,
      issueCounter: 0,
      values: {},
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function readSettings(
  conn: DatabaseConnection,
): Promise<SettingsRow | undefined> {
  return settings(conn).findOne({ filter: { id: ROW_ID } });
}

/**
 * Serialize all relationship writes across projects and processes until the outermost transaction
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
  const row = await graph.findOne({ filter: { id: ROW_ID } });
  if (!row) throw new Error('The issue dependency graph is not initialized.');
  const { updatedCount } = await graph.updateMany({
    filter: { id: ROW_ID, revision: row.revision },
    values: { revision: { increment: advance ? 1 : 0 } },
  });
  if (updatedCount !== 1)
    throw conflict(
      'DEPENDENCY_GRAPH_CHANGED',
      'The issue dependency graph changed meanwhile. Reload and retry.',
    );
}

export async function writeSettings(
  conn: DatabaseConnection,
  values: Partial<Pick<SettingsRow, 'issuePrefix' | 'values'>>,
): Promise<void> {
  await ensureRow(conn);
  await settings(conn).updateOne({
    filter: { id: ROW_ID },
    values: { ...values, updatedAt: new Date() },
  });
}

/**
 * The next issue number and the current prefix. Take the graph guard before the counter even for a standalone issue:
 * a later row of the same plan may add dependencies. A rolled-back create releases its number.
 */
export async function nextIssueNumber(
  conn: DatabaseConnection,
  addsWaits = false,
): Promise<{ readonly number: number; readonly prefix: string }> {
  await lockIssueGraph(conn, addsWaits);
  await ensureRow(conn);
  const { record } = await settings(conn).updateOne({
    filter: { id: ROW_ID },
    values: { issueCounter: { increment: 1 }, updatedAt: new Date() },
    select: (select) => select.fields('issueCounter', 'issuePrefix'),
  });
  return { number: record.issueCounter, prefix: record.issuePrefix };
}

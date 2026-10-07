/**
 * The `pmSettings` row. It is created by the seed `202609300005_pm_default_settings`; a missing row reads as the
 * defaults and is recreated by the first write.
 */
import type { DatabaseConnection } from '@nocobase/db';

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
 * The next issue number and the current prefix. An atomic increment in the caller's transaction: concurrent creates
 * wait for each other, and a rolled-back create releases its number.
 */
export async function nextIssueNumber(
  conn: DatabaseConnection,
): Promise<{ readonly number: number; readonly prefix: string }> {
  await ensureRow(conn);
  const { record } = await settings(conn).updateOne({
    filter: { id: ROW_ID },
    values: { issueCounter: { increment: 1 }, updatedAt: new Date() },
    select: (select) => select.fields('issueCounter', 'issuePrefix'),
  });
  return { number: record.issueCounter, prefix: record.issuePrefix };
}

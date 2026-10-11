/**
 * What is kept of a repository's last "Configure CI" run (`studioRepoCi.setups.preview`, `shared/ci-modes.ts`): the
 * agent's issue it created, shown until it is finished, and the files waiting for a new repository's initialization,
 * committed once it is done. The open pull request is the row's own (`pullRequestNumber`, `state: pr-open`).
 *
 * Nothing else is read: choices stored before runs replaced them (a mode per application, the applications, edited
 * files, the agent) stay in the column untouched until the next run writes it, and mean nothing.
 */
import type { DatabaseConnection, Row } from '@nocobase/db';

import type { CiWorkflowFile } from '../../shared/ci-modes.js';
import { REPO_CI } from '../releases/ci.js';

/** The outcome of the last run, as stored. */
export interface StoredCiRun {
  readonly taskIssueId: string | null;
  /** That issue's key, such as `SHOP-3`. */
  readonly taskIdentifier: string | null;
  /** Files to commit once the repository Studio created is initialized; null when none wait. */
  readonly pendingFiles: readonly CiWorkflowFile[] | null;
}

const EMPTY: StoredCiRun = {
  taskIssueId: null,
  taskIdentifier: null,
  pendingFiles: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

function filesOf(value: unknown): CiWorkflowFile[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (file): file is CiWorkflowFile =>
      isRecord(file) &&
      typeof file.path === 'string' &&
      typeof file.content === 'string',
  );
}

function parsed(value: unknown): Record<string, unknown> {
  let decoded: unknown = value;
  if (typeof value === 'string') {
    try {
      decoded = JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  return isRecord(decoded) ? decoded : {};
}

/** The stored outcome; tolerant of a column the database answers as text, and of what older versions stored. */
export function decodeCiRun(value: unknown): StoredCiRun {
  const preview = parsed(value).preview;
  if (!isRecord(preview)) return EMPTY;
  return {
    taskIssueId: textOf(preview.taskIssueId),
    taskIdentifier: textOf(preview.taskIdentifier),
    pendingFiles: filesOf(preview.pendingFiles),
  };
}

export async function ciRunOf(
  conn: DatabaseConnection,
  resourceId: string,
): Promise<StoredCiRun> {
  const row = await conn.query
    .selectFrom(REPO_CI)
    .select(['setups'])
    .where('resourceId', '=', resourceId)
    .executeTakeFirst<Row>();
  return row ? decodeCiRun(row.setups) : EMPTY;
}

/** Merges `patch` into the stored outcome; the row must exist. What older versions stored is dropped. */
export async function writeCiRun(
  conn: DatabaseConnection,
  resourceId: string,
  patch: Partial<StoredCiRun>,
  now: Date,
): Promise<StoredCiRun> {
  const current = await ciRunOf(conn, resourceId);
  const next: StoredCiRun = { ...current, ...patch };
  await conn.query
    .updateTable(REPO_CI)
    .set({ setups: JSON.stringify({ preview: next }), updatedAt: now })
    .where('resourceId', '=', resourceId)
    .execute();
  return next;
}

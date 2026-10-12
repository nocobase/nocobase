/**
 * `studioPreviews` rows, as the preview service reads and writes them: one per pull request and App previewed (or the
 * repository itself, `targetAppId` null).
 */
import type { DatabaseConnection, Row } from '@nocobase/db';

import type {
  PreviewAdmin,
  PreviewMissingVariable,
  PreviewRuntime,
  PreviewStatus,
  PreviewView,
} from '../../shared/previews.js';
import type { BuildView } from '../../shared/builds.js';

const TABLE = 'studioPreviews';

export interface PreviewRecord {
  readonly id: string;
  readonly resourceId: string;
  readonly pullRequestId: string;
  readonly repo: string;
  readonly number: number;
  /** The linked App previewed; null for the repository previewed by itself. */
  readonly targetAppId: string | null;
  readonly appId: string;
  readonly environmentId: string;
  readonly status: PreviewStatus;
  readonly sha: string | null;
  readonly deployedSha: string | null;
  readonly buildId: string | null;
  readonly releaseId: string | null;
  readonly deploymentId: string | null;
  readonly error: string | null;
  readonly createdBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== ''
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : null;

function date(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function decodePreview(row: Row): PreviewRecord {
  return {
    id: String(row.id),
    resourceId: String(row.resourceId),
    pullRequestId: String(row.pullRequestId),
    repo: String(row.repo),
    number: Number(row.number),
    targetAppId: text(row.targetAppId),
    appId: String(row.appId),
    environmentId: String(row.environmentId),
    status: String(row.status) as PreviewStatus,
    sha: text(row.sha),
    deployedSha: text(row.deployedSha),
    buildId: text(row.buildId),
    releaseId: text(row.releaseId),
    deploymentId: text(row.deploymentId),
    error: text(row.error),
    createdBy: text(row.createdBy),
    createdAt: date(row.createdAt) ?? new Date(0),
    updatedAt: date(row.updatedAt) ?? new Date(0),
  };
}

/** What release management says of a preview's App: where it answers and how its runtime stands. */
export interface PreviewApp {
  readonly url: string | null;
  readonly runtime: PreviewRuntime | null;
}

export function previewView(
  record: PreviewRecord,
  extra: {
    readonly app: PreviewApp;
    readonly targetAppName: string | null;
    readonly pullRequest: PreviewView['pullRequest'];
    readonly build: BuildView | null;
    readonly admin: PreviewAdmin | null;
    readonly missingVariables?: readonly PreviewMissingVariable[];
  },
): PreviewView {
  const destroyed = record.status === 'destroyed';
  return {
    id: record.id,
    resourceId: record.resourceId,
    targetAppId: record.targetAppId,
    targetAppName: extra.targetAppName,
    appId: record.appId,
    environmentId: record.environmentId,
    status: record.status,
    url: destroyed || !record.deploymentId ? null : extra.app.url,
    pullRequest: extra.pullRequest,
    sha: record.sha,
    deployedSha: record.deployedSha,
    build: extra.build,
    releaseId: record.releaseId,
    deploymentId: record.deploymentId,
    error: record.error,
    missingVariables:
      record.status === 'blocked' ? (extra.missingVariables ?? []) : [],
    runtime: destroyed ? null : extra.app.runtime,
    admin: destroyed ? null : extra.admin,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

/** The previews of these pull requests, oldest first. */
export async function previewsOfPullRequests(
  conn: DatabaseConnection,
  pullRequestIds: readonly string[],
): Promise<PreviewRecord[]> {
  if (pullRequestIds.length === 0) return [];
  const rows = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('pullRequestId', 'in', [...pullRequestIds])
    .orderBy('createdAt')
    .orderBy('id')
    .execute<Row>();
  return rows.map(decodePreview);
}

/** The pull request's preview of the App (null: of the repository itself). */
export async function previewOf(
  conn: DatabaseConnection,
  pullRequestId: string,
  targetAppId: string | null,
): Promise<PreviewRecord | null> {
  let query = conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('pullRequestId', '=', pullRequestId);
  query =
    targetAppId === null
      ? query.where('targetAppId', 'is', null)
      : query.where('targetAppId', '=', targetAppId);
  const row = await query.executeTakeFirst<Row>();
  return row ? decodePreview(row) : null;
}

export async function previewWhere(
  conn: DatabaseConnection,
  column: 'id' | 'appId' | 'deploymentId',
  value: string,
): Promise<PreviewRecord | null> {
  const row = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where(column, '=', value)
    .orderBy('updatedAt', 'desc')
    .executeTakeFirst<Row>();
  return row ? decodePreview(row) : null;
}

export async function livePreviews(
  conn: DatabaseConnection,
  filter: { readonly resourceId?: string } = {},
): Promise<PreviewRecord[]> {
  let query = conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('status', '!=', 'destroyed');
  if (filter.resourceId)
    query = query.where('resourceId', '=', filter.resourceId);
  return (await query.orderBy('updatedAt', 'desc').execute<Row>()).map(
    decodePreview,
  );
}

/** Whether a repository on its host (`owner/name`, any case) has a live preview: Studio then keeps its open pull requests. */
export async function hasLivePreviews(
  conn: DatabaseConnection,
  fullName: string,
): Promise<boolean> {
  const rows = await conn.query
    .selectFrom(TABLE)
    .select('repo')
    .distinct()
    .where('status', '!=', 'destroyed')
    .execute<Row>();
  const name = fullName.toLowerCase();
  return rows.some((row) => String(row.repo).toLowerCase() === name);
}

export async function insertPreview(
  conn: DatabaseConnection,
  values: Row,
): Promise<void> {
  await conn.query.insertInto(TABLE).values(values).execute();
}

export async function updatePreview(
  conn: DatabaseConnection,
  id: string,
  values: Row,
  /** Only while the row is still on this deployment: a stale answer changes nothing. */
  guard: { readonly deploymentId?: string } = {},
): Promise<boolean> {
  let query = conn.query
    .updateTable(TABLE)
    .set({ ...values, updatedAt: new Date() })
    .where('id', '=', id);
  if (guard.deploymentId !== undefined)
    query = query.where('deploymentId', '=', guard.deploymentId);
  const result = await query.execute();
  const count = (result as unknown as { updatedCount?: number }).updatedCount;
  return count === undefined ? true : count > 0;
}

/** `studioBuilds` rows, as the builds service and previews read and write them. */
import type { DatabaseConnection, Row } from '@nocobase/db';

import type {
  BuildState,
  BuildVariablesDiff,
  BuildView,
} from '../../shared/builds.js';

const TABLE = 'studioBuilds';

export interface BuildRecord {
  readonly id: string;
  readonly appId: string;
  readonly resourceId: string;
  readonly sha: string;
  readonly ref: string | null;
  readonly pullRequestId: string | null;
  readonly state: BuildState;
  readonly logsUrl: string | null;
  readonly message: string | null;
  readonly superseded: boolean;
  readonly releaseId: string | null;
  readonly releaseAppId: string | null;
  readonly reportedBy: string | null;
  readonly newVariables: BuildVariablesDiff | null;
  readonly verifiedAt: Date;
  readonly uploadedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

function date(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function decodeBuild(row: Row): BuildRecord {
  return {
    id: String(row.id),
    appId: String(row.appId),
    resourceId: String(row.resourceId),
    sha: String(row.sha),
    ref: text(row.ref),
    pullRequestId: text(row.pullRequestId),
    state: String(row.state) as BuildState,
    logsUrl: text(row.logsUrl),
    message: text(row.message),
    superseded: Boolean(row.superseded),
    releaseId: text(row.releaseId),
    releaseAppId: text(row.releaseAppId),
    reportedBy: text(row.reportedBy),
    newVariables: diffOf(row.newVariables),
    verifiedAt: date(row.verifiedAt) ?? new Date(0),
    uploadedAt: date(row.uploadedAt),
    createdAt: date(row.createdAt) ?? new Date(0),
    updatedAt: date(row.updatedAt) ?? new Date(0),
  };
}

export function buildView(build: BuildRecord): BuildView {
  return {
    id: build.id,
    appId: build.appId,
    sha: build.sha,
    ref: build.ref,
    pullRequest: build.pullRequestId !== null,
    state: build.state,
    logsUrl: build.logsUrl,
    message: build.message,
    superseded: build.superseded,
    releaseId: build.releaseId,
    uploadedAt: build.uploadedAt?.toISOString() ?? null,
    newVariables: build.newVariables,
    reportedAt: build.verifiedAt.toISOString(),
    updatedAt: build.updatedAt.toISOString(),
  };
}

function diffOf(value: unknown): BuildVariablesDiff | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    const parsed: unknown =
      typeof value === 'string' ? JSON.parse(value) : value;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as BuildVariablesDiff).added) ||
      !Array.isArray((parsed as BuildVariablesDiff).removed)
    )
      return null;
    return parsed as BuildVariablesDiff;
  } catch {
    return null;
  }
}

/** The build of an App at a commit: the dedup key. */
export async function findBuild(
  conn: DatabaseConnection,
  key: { readonly appId: string; readonly sha: string },
): Promise<BuildRecord | null> {
  const row = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('appId', '=', key.appId)
    .where('sha', '=', key.sha)
    .executeTakeFirst<Row>();
  return row ? decodeBuild(row) : null;
}

/**
 * The newest uploaded build of the repository at a commit in another App: what an upload of the same commit may be
 * promoted from rather than stored again, when its bytes are the same.
 */
export async function uploadedElsewhere(
  conn: DatabaseConnection,
  resourceId: string,
  sha: string,
  appId: string,
): Promise<BuildRecord | null> {
  const row = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('resourceId', '=', resourceId)
    .where('sha', '=', sha)
    .where('appId', '!=', appId)
    .where('releaseId', 'is not', null)
    .orderBy('uploadedAt', 'desc')
    .executeTakeFirst<Row>();
  return row ? decodeBuild(row) : null;
}

/** The build whose archive became a release (as `release upload` answered it). */
export async function buildByRelease(
  conn: DatabaseConnection,
  releaseId: string,
): Promise<BuildRecord | null> {
  const row = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('releaseId', '=', releaseId)
    .executeTakeFirst<Row>();
  return row ? decodeBuild(row) : null;
}

export async function buildById(
  conn: DatabaseConnection,
  id: string,
): Promise<BuildRecord | null> {
  const row = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst<Row>();
  return row ? decodeBuild(row) : null;
}

/**
 * A page of the builds CI reported for a repository's Apps, the most recently reported first, and their count. Ordered
 * by `verifiedAt`, which is written once when CI reports the build: `updatedAt` moves when a newer head supersedes it.
 */
export async function repositoryBuilds(
  conn: DatabaseConnection,
  resourceId: string,
  page: { readonly page: number; readonly pageSize: number },
): Promise<{ readonly items: BuildRecord[]; readonly total: number }> {
  const rows = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('resourceId', '=', resourceId)
    .orderBy('verifiedAt', 'desc')
    .orderBy('id', 'desc')
    .limit(page.pageSize)
    .offset((page.page - 1) * page.pageSize)
    .execute<Row>();
  const counted = await conn.query
    .selectFrom(TABLE)
    .select((eb) => [eb.fn.countAll().as('total')])
    .where('resourceId', '=', resourceId)
    .executeTakeFirst<Row>();
  return { items: rows.map(decodeBuild), total: Number(counted?.total ?? 0) };
}

/** At most this many of a repository's builds are read to say where its Apps stand. */
export const REPORTED_BUILDS_MAX = 2000;

/** The repository's builds, the most recently updated first, at most `REPORTED_BUILDS_MAX`. */
export async function repositoryBuildReports(
  conn: DatabaseConnection,
  resourceId: string,
): Promise<BuildRecord[]> {
  const rows = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('resourceId', '=', resourceId)
    .orderBy('updatedAt', 'desc')
    .orderBy('id', 'desc')
    .limit(REPORTED_BUILDS_MAX)
    .execute<Row>();
  return rows.map(decodeBuild);
}

export async function insertBuild(
  conn: DatabaseConnection,
  values: Row,
): Promise<void> {
  await conn.query.insertInto(TABLE).values(values).execute();
}

export async function updateBuild(
  conn: DatabaseConnection,
  id: string,
  values: Row,
): Promise<void> {
  await conn.query
    .updateTable(TABLE)
    .set({ ...values, updatedAt: new Date() })
    .where('id', '=', id)
    .execute();
}

/**
 * Marks every build of the pull request's App at another commit superseded: only its newest head is ever deployed.
 * Answers how many were marked.
 */
export async function supersedeOthers(
  conn: DatabaseConnection,
  pullRequestId: string,
  appId: string,
  headSha: string,
): Promise<number> {
  const result = await conn.query
    .updateTable(TABLE)
    .set({ superseded: true, updatedAt: new Date() })
    .where('pullRequestId', '=', pullRequestId)
    .where('appId', '=', appId)
    .where('sha', '!=', headSha)
    .where('superseded', '=', false)
    .execute();
  return Number(
    (result as unknown as { updatedCount?: number }).updatedCount ?? 0,
  );
}

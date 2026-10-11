/**
 * What previews and deployment marks read of the plugins Studio assembles, straight from their tables on the caller's
 * connection (Studio owns the join, not the plugins): issues, and the newest commits agent runs pushed for issues
 * (`agRunRepos`, the agents plugin's record of what a run reported). A status's category comes from the projects
 * plugin's own services, as workflows can be edited.
 */
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  BUSINESS_KEYS,
  noSettings,
  type BusinessKey,
  type Scope,
} from '@nocobase/app-plugin-projects/shared/access';
import type { StatusCategory } from '@nocobase/app-plugin-projects/shared/issues';
import type { DatabaseConnection, Row } from '@nocobase/db';

/** The projects plugin's subject kind of runs on issues (`../agents/catalog/triggers.ts`). */
const ISSUE_SUBJECT = 'issue';

export interface IssueRecord {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly statusKey: string;
  readonly projectId: string | null;
  readonly ownerUserId: string;
  readonly deleted: boolean;
}

export interface PushedBranch {
  readonly branch: string;
  readonly sha: string | null;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== ''
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : null;

function decodeIssue(row: Row): IssueRecord {
  return {
    id: String(row.id),
    identifier: String(row.identifier),
    title: String(row.title),
    statusKey: String(row.statusKey),
    projectId: text(row.projectId),
    ownerUserId: String(row.ownerUserId),
    deleted: row.deletedAt !== null && row.deletedAt !== undefined,
  };
}

/** An issue by id or identifier (`FG-12`, matched case-insensitively), deleted ones included. */
export async function findIssue(
  conn: DatabaseConnection,
  idOrKey: string,
): Promise<IssueRecord | null> {
  const row = await conn.query
    .selectFrom('pmIssues')
    .select([
      'id',
      'identifier',
      'title',
      'statusKey',
      'projectId',
      'ownerUserId',
      'deletedAt',
    ])
    .where((eb) =>
      eb.or([
        eb('id', '=', idOrKey),
        eb('identifier', '=', idOrKey.toUpperCase()),
      ]),
    )
    .executeTakeFirst<Row>();
  return row ? decodeIssue(row) : null;
}

export async function findIssues(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<IssueRecord[]> {
  if (ids.length === 0) return [];
  const rows = await conn.query
    .selectFrom('pmIssues')
    .select([
      'id',
      'identifier',
      'title',
      'statusKey',
      'projectId',
      'ownerUserId',
      'deletedAt',
    ])
    .where('id', 'in', [...ids])
    .execute<Row>();
  return rows.map(decodeIssue);
}

/** A repository's short name: its label, or the last part of its URL. */
export function slugOf(label: string | null, url: string): string {
  const base =
    label ??
    url
      .replace(/\.git$/u, '')
      .split(/[/:]/u)
      .filter(Boolean)
      .at(-1) ??
    'repo';
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 40);
  return slug || 'repo';
}

/** Two repository URLs naming the same repository, give or take `.git` and a trailing slash. */
export function sameRepository(a: string, b: string): boolean {
  const normal = (url: string) =>
    url
      .trim()
      .replace(/\/+$/u, '')
      .replace(/\.git$/u, '')
      .toLowerCase();
  return normal(a) === normal(b);
}

/** The newest pushed commit of each issue to `url`, for the issues that have one. */
export async function latestPushes(
  conn: DatabaseConnection,
  issueIds: readonly string[],
  url: string,
): Promise<Map<string, PushedBranch>> {
  const found = new Map<string, PushedBranch>();
  if (issueIds.length === 0) return found;
  const rows = await conn.query
    .selectFrom('agRunRepos as repo')
    .innerJoin('agRuns as run', 'run.id', 'repo.runId')
    .select([
      'run.subjectId as issueId',
      'repo.url as url',
      'repo.branch as branch',
      'repo.headSha as headSha',
      'repo.updatedAt as updatedAt',
    ])
    .where('run.subjectKind', '=', ISSUE_SUBJECT)
    .where('run.subjectId', 'in', [...issueIds])
    .where('repo.pushed', '=', true)
    .where('repo.headSha', 'is not', null)
    .orderBy('repo.updatedAt', 'desc')
    .execute<Row>();
  for (const row of rows) {
    const issueId = String(row.issueId);
    if (found.has(issueId) || !sameRepository(String(row.url), url)) continue;
    found.set(issueId, {
      branch: String(row.branch),
      sha: text(row.headSha),
    });
  }
  return found;
}

/** A viewer that sees and may do everything, for Studio's own reads through the projects plugin's services. */
export function systemViewer(): Viewer {
  return {
    userId: 'studio',
    actor: { type: 'system', id: null },
    permissions: {
      scopes: Object.fromEntries(
        BUSINESS_KEYS.map(({ key }) => [key, 'all']),
      ) as Record<BusinessKey, Scope>,
      settings: noSettings(),
    },
  };
}

/** The category of each status of the project's workflow. */
export async function categoriesOf(
  projects: Pick<Projects, 'issueQueries'>,
  projectId: string | null,
): Promise<Map<string, StatusCategory>> {
  const statuses = await projects.issueQueries.statuses(
    systemViewer(),
    projectId,
  );
  return new Map(statuses.map((status) => [status.key, status.category]));
}

/**
 * `studioProjectInits`: one row per initialized working directory (`service.ts`): the project's own setup, its first
 * row, and one per working directory added later with an initialization. Every change of state is a
 * conditional update from the state the caller read, so two deliveries of one event (or an event and a reconciliation)
 * move it once.
 */
import type { DatabaseConnection, Row } from '@nocobase/db';

import {
  NOCOBASE_APP_TEMPLATES,
  type InitMethod,
  type InitState,
  type NocobaseAppTemplate,
  type ProjectInitView,
} from '../../shared/project-init.js';

export const INITS = 'studioProjectInits';

export interface InitRecord {
  readonly id: string;
  readonly projectId: string;
  readonly resourceId: string | null;
  readonly method: InitMethod;
  /** The repository; null for a directory on a runner. */
  readonly connectionId: string | null;
  readonly repo: string | null;
  readonly repoUrl: string | null;
  readonly defaultBranch: string | null;
  readonly firstCommit: boolean;
  readonly templateRepo: string | null;
  /** The `create-app` template of a NocoBase application the agent scaffolds (a repository root or app/ in a runner directory). */
  readonly appTemplate: NocobaseAppTemplate | null;
  readonly workflowId: string | null;
  readonly workflowPath: string | null;
  readonly workflowName: string | null;
  readonly agentId: string | null;
  readonly issueId: string | null;
  readonly state: InitState;
  readonly runId: string | null;
  readonly runName: string | null;
  readonly runStatus: string | null;
  readonly runConclusion: string | null;
  readonly runUrl: string | null;
  readonly runAttempt: number | null;
  readonly runSucceeded: boolean;
  readonly pushed: boolean;
  readonly error: string | null;
  readonly branchProtected: boolean | null;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly checkedAt: string | null;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== ''
    ? value
    : typeof value === 'number'
      ? String(value)
      : null;

const iso = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
};

/** SQLite answers booleans as 0 and 1. */
const flag = (value: unknown): boolean => value === true || value === 1;

export function decodeInit(row: Row): InitRecord {
  return {
    id: String(row.id),
    projectId: String(row.projectId),
    resourceId: text(row.resourceId),
    method: String(row.method) as InitMethod,
    connectionId: text(row.connectionId),
    repo: text(row.repo),
    repoUrl: text(row.repoUrl),
    defaultBranch: text(row.defaultBranch),
    firstCommit: flag(row.firstCommit),
    templateRepo: text(row.templateRepo),
    appTemplate: (NOCOBASE_APP_TEMPLATES as readonly unknown[]).includes(
      row.appTemplate,
    )
      ? (row.appTemplate as NocobaseAppTemplate)
      : null,
    workflowId: text(row.workflowId),
    workflowPath: text(row.workflowPath),
    workflowName: text(row.workflowName),
    agentId: text(row.agentId),
    issueId: text(row.issueId),
    state: String(row.state) as InitState,
    runId: text(row.runId),
    runName: text(row.runName),
    runStatus: text(row.runStatus),
    runConclusion: text(row.runConclusion),
    runUrl: text(row.runUrl),
    runAttempt:
      row.runAttempt === null || row.runAttempt === undefined
        ? null
        : Number(row.runAttempt),
    runSucceeded: flag(row.runSucceeded),
    pushed: flag(row.pushed),
    error: text(row.error),
    branchProtected:
      row.branchProtected === null || row.branchProtected === undefined
        ? null
        : flag(row.branchProtected),
    createdBy: text(row.createdBy),
    createdAt: iso(row.createdAt) ?? '',
    updatedAt: iso(row.updatedAt) ?? '',
    completedAt: iso(row.completedAt),
    checkedAt: iso(row.checkedAt),
  };
}

/** The project's own initialization, made with the project: its first row. */
export async function initOfProject(
  conn: DatabaseConnection,
  projectId: string,
): Promise<InitRecord | null> {
  return (await initsOfProject(conn, projectId))[0] ?? null;
}

/** Every initialization of the project's working directories, the project's own first. */
export async function initsOfProject(
  conn: DatabaseConnection,
  projectId: string,
): Promise<InitRecord[]> {
  const rows = await conn.query
    .selectFrom(INITS)
    .selectAll()
    .where('projectId', '=', projectId)
    .orderBy('createdAt')
    .orderBy('id')
    .execute<Row>();
  return rows.map(decodeInit);
}

export async function initOfIssue(
  conn: DatabaseConnection,
  issueId: string,
): Promise<InitRecord | null> {
  const row = await conn.query
    .selectFrom(INITS)
    .selectAll()
    .where('issueId', '=', issueId)
    .executeTakeFirst<Row>();
  return row ? decodeInit(row) : null;
}

/** The initializations a template's workflow runs now: the ones to ask the host about. */
export async function runningInits(
  conn: DatabaseConnection,
): Promise<InitRecord[]> {
  const rows = await conn.query
    .selectFrom(INITS)
    .selectAll()
    .where('state', '=', 'running')
    .where('method', '=', 'template')
    .execute<Row>();
  return rows.map(decodeInit);
}

/** The initializations of a repository (`owner/name`, matched without case) that are not done. */
export async function openInitsOfRepo(
  conn: DatabaseConnection,
  repo: string,
): Promise<InitRecord[]> {
  const rows = await conn.query
    .selectFrom(INITS)
    .selectAll()
    .where('state', '!=', 'done')
    .execute<Row>();
  return rows
    .map(decodeInit)
    .filter((record) => record.repo?.toLowerCase() === repo.toLowerCase());
}

/**
 * Changes a record still in one of `from`; answers whether it did (false: someone else moved it first).
 */
export async function moveInit(
  conn: DatabaseConnection,
  id: string,
  from: readonly InitState[],
  values: Readonly<Record<string, unknown>>,
  now: Date,
): Promise<boolean> {
  const result = await conn.query
    .updateTable(INITS)
    .set({ ...values, updatedAt: now })
    .where('id', '=', id)
    .where('state', 'in', [...from])
    .execute();
  return (result.updatedCount ?? 0) > 0;
}

/**
 * In the claim's transaction: the working directory and default branch a run of `issueId` initializes, when it is the
 * pending init issue of an agent's first commit in a new repository (`RepoDir.initial`); null otherwise. The init issue is the record's,
 * or, in the moment between creating the project's setup issue and recording it, the project's setup issue (an init
 * issue added later is given its agent only once recorded).
 */
export async function initialDirOf(
  conn: DatabaseConnection,
  issueId: string,
  projectId: string | null,
): Promise<{
  readonly resourceId: string;
  readonly defaultBranch: string;
} | null> {
  const own = await initOfIssue(conn, issueId);
  if (own)
    return own.method === 'prompt' &&
      own.firstCommit &&
      own.state === 'pending' &&
      own.resourceId &&
      own.defaultBranch
      ? { resourceId: own.resourceId, defaultBranch: own.defaultBranch }
      : null;
  if (!projectId) return null;
  const found = await initOfProject(conn, projectId);
  if (
    found?.method !== 'prompt' ||
    !found.firstCommit ||
    found.state !== 'pending' ||
    !found.resourceId ||
    !found.defaultBranch
  )
    return null;
  let initIssue = found.issueId;
  if (!initIssue) {
    const row = await conn.query
      .selectFrom('pmProjects')
      .select('setupIssueId')
      .where('id', '=', projectId)
      .executeTakeFirst<Row>();
    initIssue = typeof row?.setupIssueId === 'string' ? row.setupIssueId : null;
  }
  if (initIssue !== issueId) return null;
  return { resourceId: found.resourceId, defaultBranch: found.defaultBranch };
}

export function initView(
  record: InitRecord,
  options: {
    readonly canRetry: boolean;
    /** No runner can run the init agent now (`ProjectInitView.waitingForRunner`). */
    readonly agentUnavailable?: boolean;
  },
): ProjectInitView {
  const workflow =
    record.workflowId && record.workflowPath
      ? {
          id: record.workflowId,
          path: record.workflowPath,
          name: record.workflowName ?? record.workflowPath,
        }
      : null;
  return {
    projectId: record.projectId,
    method: record.method,
    state: record.state,
    repo:
      record.repo && record.repoUrl && record.defaultBranch
        ? {
            fullName: record.repo,
            url: record.repoUrl,
            defaultBranch: record.defaultBranch,
          }
        : null,
    firstCommit: record.firstCommit,
    templateRepo: record.templateRepo,
    appTemplate: record.appTemplate,
    workflow,
    run: record.runId
      ? {
          id: record.runId,
          name: record.runName,
          status: record.runStatus,
          conclusion: record.runConclusion,
          url: record.runUrl,
          attempt: record.runAttempt ?? 1,
        }
      : null,
    agentId: record.agentId,
    waitingForRunner:
      options.agentUnavailable === true &&
      record.method === 'prompt' &&
      record.state === 'pending' &&
      !record.runSucceeded,
    issueId: record.issueId,
    runSucceeded: record.runSucceeded,
    pushed: record.pushed,
    error: record.error,
    branchProtected: record.branchProtected,
    completedAt: record.completedAt,
    canRetry:
      options.canRetry &&
      record.method === 'template' &&
      record.state === 'failed' &&
      workflow !== null,
  };
}

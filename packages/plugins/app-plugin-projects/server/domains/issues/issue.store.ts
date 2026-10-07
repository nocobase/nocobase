/**
 * The issue collections: `pmIssues` and the `pmIssueLabels` links. Issues read their owner, project and labels
 * through the relations declared on `pmIssues`; only this file reads or writes the issue tables.
 */
import {
  RepositoryError,
  type DatabaseConnection,
  type RepositoryCursor,
  type RepositoryFilter,
} from '@nocobase/db';

import { PRIORITIES, type Priority } from '../../../shared/common.js';
import type { Issue, IssueProject } from '../../../shared/issues.js';
import type { Label } from '../../../shared/labels.js';
import { oneOf } from '../../kernel/db.js';
import { conflict } from '../../kernel/errors.js';

const ISSUES = 'pmIssues';
const ISSUE_LABELS = 'pmIssueLabels';

export interface IssueRecord {
  readonly id: string;
  readonly number: number;
  readonly identifier: string;
  readonly title: string;
  readonly description: string;
  readonly statusKey: string;
  readonly priority: Priority;
  /** `PRIORITIES` index of `priority`, kept by the writes below. */
  readonly priorityRank: number;
  readonly ownerUserId: string;
  /** A kind's key, null with `executorId` when nobody works on the issue. */
  readonly executorType: string | null;
  readonly executorId: string | null;
  readonly parentIssueId: string | null;
  readonly stage: number | null;
  readonly projectId: string | null;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly revision: number;
  readonly createdById: string | null;
  readonly lastActivityAt: string;
  readonly deletedAt: string | null;
  readonly deletedById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** The columns a write may set. */
export type IssueValues = Partial<
  Omit<
    IssueRecord,
    'id' | 'number' | 'identifier' | 'revision' | 'createdAt' | 'priorityRank'
  >
>;

/** The rank the list orders priorities by: urgent first. */
export function priorityRank(priority: Priority): number {
  return PRIORITIES.indexOf(priority);
}

interface Named {
  readonly name: string | null;
  readonly username: string | null;
  readonly email: string | null;
}

/** A row with what lists show beside it. */
export interface IssueRow extends Issue {
  readonly ownerName: string;
  readonly project: IssueProject | null;
  readonly labels: readonly Label[];
}

interface LinkRecord {
  readonly id: string;
  readonly issueId: string;
  readonly labelId: string;
  readonly createdAt: string;
}

const issues = (conn: DatabaseConnection) =>
  conn.repository<IssueRecord>(ISSUES);
const links = (conn: DatabaseConnection) =>
  conn.repository<LinkRecord>(ISSUE_LABELS);

const FIELDS = [
  'id',
  'number',
  'identifier',
  'title',
  'description',
  'statusKey',
  'priority',
  'ownerUserId',
  'executorType',
  'executorId',
  'parentIssueId',
  'stage',
  'projectId',
  'startDate',
  'dueDate',
  'revision',
  'createdById',
  'lastActivityAt',
  'deletedAt',
  'createdAt',
  'updatedAt',
] as const;

export function toIssue(record: IssueRecord): Issue {
  const {
    executorType,
    executorId,
    deletedById: _deletedById,
    priorityRank: _priorityRank,
    ...issue
  } = record;
  return {
    ...issue,
    executor:
      executorType && executorId
        ? { type: executorType, id: executorId }
        : null,
  };
}

function toRow(
  record: IssueRecord & {
    readonly owner?: Named | null;
    readonly project?: IssueProject | null;
    readonly labels?: readonly Label[];
  },
): IssueRow {
  const { owner, project, labels, ...issue } = record;
  return {
    ...toIssue(issue),
    ownerName:
      owner?.name || owner?.username || owner?.email || record.ownerUserId,
    project: project ?? null,
    labels: [...(labels ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export interface IssueQuery {
  readonly filter?: RepositoryFilter<IssueRecord>;
  /** The sort field; `id` breaks ties in the same direction. */
  readonly order: 'updatedAt' | 'createdAt' | 'number' | 'priorityRank';
  readonly direction?: 'asc' | 'desc';
  readonly cursor?: RepositoryCursor<IssueRecord>;
  readonly limit: number;
}

/** Issues with their owner, project and labels, newest first. */
export async function findIssueRows(
  conn: DatabaseConnection,
  query: IssueQuery,
): Promise<IssueRow[]> {
  const rows = await issues(conn).findMany({
    ...(query.filter ? { filter: query.filter } : {}),
    ...(query.cursor ? { cursor: query.cursor } : {}),
    select: (select) =>
      select
        .fields(...FIELDS)
        .include('owner', (owner) => owner.fields('name', 'username', 'email'))
        .include('project', (project) =>
          project.fields('id', 'name', 'leadUserId'),
        )
        .include('labels', (label) => label.fields('id', 'name', 'color')),
    sort: (sort) =>
      query.direction === 'asc'
        ? [sort.field(query.order).asc(), sort.field('id').asc()]
        : [sort.field(query.order).desc(), sort.field('id').desc()],
    limit: query.limit,
  });
  return rows.map((row) => toRow(row as Parameters<typeof toRow>[0]));
}

const IDENTIFIER = /^[A-Za-z][A-Za-z0-9]*-\d+$/u;

/** An issue by id or identifier (`PM-12`, any case), deleted or not. */
export async function findIssue(
  conn: DatabaseConnection,
  idOrKey: string,
): Promise<Issue | undefined> {
  const byId = await issues(conn).findOne({
    filter: { id: idOrKey },
    select: (select) => select.fields(...FIELDS),
  });
  if (byId) return toIssue(byId as IssueRecord);
  if (!IDENTIFIER.test(idOrKey)) return undefined;
  const byKey = await issues(conn).findOne({
    filter: { identifier: idOrKey.toUpperCase() },
    select: (select) => select.fields(...FIELDS),
  });
  return byKey ? toIssue(byKey as IssueRecord) : undefined;
}

export async function findIssueRow(
  conn: DatabaseConnection,
  id: string,
): Promise<IssueRow | undefined> {
  const [row] = await findIssueRows(conn, {
    filter: { id },
    order: 'updatedAt',
    limit: 1,
  });
  return row;
}

/** Inserts a new issue; the Repository starts its revision. */
export async function insertIssue(
  conn: DatabaseConnection,
  values: Omit<
    IssueRecord,
    'revision' | 'deletedAt' | 'deletedById' | 'priorityRank'
  >,
): Promise<void> {
  await issues(conn).createOne({
    values: { ...values, priorityRank: priorityRank(values.priority) },
  });
}

/**
 * Writes `values` if the issue is still at `revision`; the revision then moves on. A concurrent change is 409
 * `REVISION_CONFLICT`. Without a revision the write always applies (system writes).
 */
export async function updateIssue(
  conn: DatabaseConnection,
  id: string,
  values: IssueValues,
  revision?: number,
): Promise<void> {
  try {
    await issues(conn).updateOne({
      filter: { id },
      ...(revision === undefined ? {} : { ifVersion: revision }),
      values:
        values.priority === undefined
          ? values
          : { ...values, priorityRank: priorityRank(values.priority) },
    });
  } catch (error) {
    if (error instanceof RepositoryError && error.code === 'VERSION_CONFLICT')
      throw conflict('REVISION_CONFLICT', 'The issue was changed meanwhile.');
    throw error;
  }
}

/** The parent of an issue, for walking up the tree. */
/**
 * Marks the issue as active now without touching its revision: `pmIssues` has an optimistic lock, and a Repository
 * update always raises it, so a comment written through one would make someone's open edit of the issue fail with
 * `REVISION_CONFLICT`. This one column is written directly for that reason.
 */
export async function touchIssueActivity(
  conn: DatabaseConnection,
  id: string,
  at: Date = new Date(),
): Promise<void> {
  await conn.query
    .updateTable(ISSUES)
    .set({ lastActivityAt: at.toISOString() })
    .where('id', '=', id)
    .execute();
}

export async function parentOf(
  conn: DatabaseConnection,
  id: string,
): Promise<string | null> {
  const row = await issues(conn).findOne({
    filter: { id },
    select: (select) => select.fields('parentIssueId'),
  });
  return row?.parentIssueId ?? null;
}

/** Makes `labelIds` the issue's labels; returns what changed. */
export async function setIssueLabels(
  conn: DatabaseConnection,
  ids: () => string,
  issueId: string,
  labelIds: readonly string[],
): Promise<{ added: string[]; removed: string[] }> {
  const current = new Set(
    (
      await links(conn).findMany({
        filter: { issueId },
        select: (select) => select.fields('labelId'),
      })
    ).map((link) => link.labelId),
  );
  const wanted = new Set(labelIds);
  const added = [...wanted].filter((id) => !current.has(id));
  const removed = [...current].filter((id) => !wanted.has(id));
  for (const labelId of added)
    await links(conn).createOne({
      values: {
        id: ids(),
        issueId,
        labelId,
        createdAt: new Date().toISOString(),
      },
    });
  if (removed.length > 0)
    await links(conn).deleteMany({
      filter: (f) =>
        f.and([f.string('issueId').eq(issueId), oneOf(f, 'labelId', removed)]),
    });
  return { added, removed };
}

/** Live issue counts per project and status. */
export async function countByProjectAndStatus(
  conn: DatabaseConnection,
  projectIds: readonly string[],
): Promise<{ projectId: string; statusKey: string; count: number }[]> {
  if (projectIds.length === 0) return [];
  const groups = await issues(conn).groupBy({
    by: ['projectId', 'statusKey'],
    aggregate: (aggregate) => ({ count: aggregate.count() }),
    filter: (f) =>
      f.and([oneOf(f, 'projectId', projectIds), f.date('deletedAt').empty()]),
  });
  return groups.map((group) => ({
    projectId: String(group.projectId),
    statusKey: String(group.statusKey),
    count: Number(group.count),
  }));
}

/** The statuses the matching issues are in. */
export async function statusesOf(
  conn: DatabaseConnection,
  filter: RepositoryFilter<IssueRecord> | undefined,
): Promise<string[]> {
  const groups = await issues(conn).groupBy({
    by: ['statusKey'],
    aggregate: (aggregate) => ({ count: aggregate.count() }),
    ...(filter ? { filter } : {}),
  });
  return groups.map((group) => String(group.statusKey));
}

/** Every issue of a project, deleted or not. */
export async function issuesOfProject(
  conn: DatabaseConnection,
  projectId: string,
): Promise<Issue[]> {
  const rows = await issues(conn).findMany({
    filter: { projectId },
    select: (select) => select.fields(...FIELDS),
  });
  return rows.map((row) => toIssue(row as IssueRecord));
}

/** The live issues `executor` executes. */
export async function issuesExecutedBy(
  conn: DatabaseConnection,
  executor: { readonly type: string; readonly id: string },
): Promise<Issue[]> {
  const rows = await issues(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('executorType').eq(executor.type),
        f.string('executorId').eq(executor.id),
        f.date('deletedAt').empty(),
      ]),
    select: (select) => select.fields(...FIELDS),
  });
  return rows.map((row) => toIssue(row as IssueRecord));
}

/** Issues by id, deleted or not; ids that match nothing are left out. */
export async function findIssues(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Issue[]> {
  if (ids.length === 0) return [];
  const rows = await issues(conn).findMany({
    filter: (f) => oneOf(f, 'id', [...new Set(ids)]),
    select: (select) => select.fields(...FIELDS),
  });
  return rows.map((row) => toIssue(row as IssueRecord));
}

/** The live sub-issues of `parentIds`, by number. */
export async function liveChildren(
  conn: DatabaseConnection,
  parentIds: readonly string[],
): Promise<Issue[]> {
  if (parentIds.length === 0) return [];
  const rows = await issues(conn).findMany({
    filter: (f) =>
      f.and([
        oneOf(f, 'parentIssueId', [...new Set(parentIds)]),
        f.date('deletedAt').empty(),
      ]),
    select: (select) => select.fields(...FIELDS),
    sort: (sort) => [sort.field('number').asc()],
  });
  return rows.map((row) => toIssue(row as IssueRecord));
}

/** How many live sub-issues each of `ids` has; issues without any are left out. */
export async function childCounts(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const groups = await issues(conn).groupBy({
    by: ['parentIssueId'],
    aggregate: (aggregate) => ({ count: aggregate.count() }),
    filter: (f) =>
      f.and([
        oneOf(f, 'parentIssueId', [...new Set(ids)]),
        f.date('deletedAt').empty(),
      ]),
  });
  return new Map(
    groups.map((group) => [String(group.parentIssueId), Number(group.count)]),
  );
}

/**
 * The plan collections: `pmPlans`, its `pmPlanRows` and the issues it touches (`pmPlanIssues`). Only this file reads or
 * writes them.
 */
import type { DatabaseConnection, RepositoryFilter } from '@nocobase/db';

import type {
  PlanFailure,
  PlanProposer,
  PlanRowCheck,
  PlanRowOp,
  PlanRowResult,
  PlanStatus,
  PlanUndoSkip,
} from '../../../shared/plans.js';
import { oneOf } from '../../kernel/db.js';

const PLANS = 'pmPlans';
const ROWS = 'pmPlanRows';
const ISSUES = 'pmPlanIssues';

export interface PlanRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: PlanStatus;
  readonly voidReason: 'person' | 'superseded' | null;
  readonly sourceKind: string;
  readonly sourceKey: string | null;
  readonly sourceIssueId: string | null;
  readonly sourceData: unknown;
  readonly proposer: PlanProposer | null;
  readonly deciderUserId: string;
  readonly createdByType: string;
  readonly createdById: string | null;
  readonly revision: number;
  readonly failure: PlanFailure | null;
  readonly rehearsedAt: string;
  readonly expiresAt: string;
  readonly executedAt: string | null;
  readonly executedById: string | null;
  readonly skipped: readonly PlanUndoSkip[] | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PlanRowRecord {
  readonly id: string;
  readonly planId: string;
  readonly position: number;
  readonly op: PlanRowOp;
  readonly ref: string | null;
  readonly params: unknown;
  readonly check: PlanRowCheck | null;
  readonly result: PlanRowResult | null;
}

export type PlanValues = Partial<Omit<PlanRecord, 'id' | 'createdAt'>>;

const plans = (conn: DatabaseConnection) => conn.repository<PlanRecord>(PLANS);
/**
 * JSON columns hold arbitrary JSON (`unknown`), which the Repository's mutation types do not take; the values are
 * plain JSON by construction.
 */
const asValues = <T>(values: T): never => values as never;
const rows = (conn: DatabaseConnection) => conn.repository<PlanRowRecord>(ROWS);

interface PlanIssueRecord {
  readonly id: string;
  readonly planId: string;
  readonly issueId: string;
}

const planIssues = (conn: DatabaseConnection) =>
  conn.repository<PlanIssueRecord>(ISSUES);

/** Dates come back as `Date` from some dialects and as strings from others. */
const iso = (value: unknown): string | null =>
  value === null || value === undefined
    ? null
    : new Date(value as string).toISOString();

function normalize(record: PlanRecord): PlanRecord {
  return {
    ...record,
    rehearsedAt: iso(record.rehearsedAt) as string,
    expiresAt: iso(record.expiresAt) as string,
    executedAt: iso(record.executedAt),
    createdAt: iso(record.createdAt) as string,
    updatedAt: iso(record.updatedAt) as string,
  };
}

export async function insertPlan(
  conn: DatabaseConnection,
  values: PlanRecord,
): Promise<void> {
  await plans(conn).createOne({ values: asValues(values) });
}

export async function findPlan(
  conn: DatabaseConnection,
  id: string,
): Promise<PlanRecord | undefined> {
  const record = await plans(conn).findOne({ filter: { id } });
  return record ? normalize(record) : undefined;
}

export async function findPlans(
  conn: DatabaseConnection,
  options: {
    readonly filter: RepositoryFilter<PlanRecord>;
    readonly limit?: number;
    readonly cursor?: { readonly createdAt: string; readonly id: string };
  },
): Promise<PlanRecord[]> {
  const records = await plans(conn).findMany({
    filter: options.filter,
    ...(options.cursor ? { cursor: options.cursor } : {}),
    sort: (sort) => [sort.field('createdAt').desc(), sort.field('id').desc()],
    ...(options.limit === undefined ? {} : { limit: options.limit }),
  });
  return records.map(normalize);
}

/** Writes `values` when the plan is still at `revision` (and, if given, in one of `statuses`); answers whether it was. */
export async function updatePlanIf(
  conn: DatabaseConnection,
  id: string,
  expected: {
    readonly revision?: number;
    readonly statuses?: readonly PlanStatus[];
  },
  values: PlanValues,
): Promise<boolean> {
  const { updatedCount } = await plans(conn).updateMany({
    filter: (f) =>
      f.and([
        f.string('id').eq(id),
        ...(expected.revision === undefined
          ? []
          : [f.number('revision').eq(expected.revision)]),
        ...(expected.statuses
          ? [oneOf(f, 'status', [...expected.statuses])]
          : []),
      ]),
    values: asValues({ ...values, updatedAt: new Date().toISOString() }),
  });
  return updatedCount > 0;
}

export async function updatePlan(
  conn: DatabaseConnection,
  id: string,
  values: PlanValues,
): Promise<void> {
  await plans(conn).updateOne({
    filter: { id },
    values: asValues({ ...values, updatedAt: new Date().toISOString() }),
  });
}

/** The open plans of a source key, except `exceptId`. */
export async function openPlansOfSource(
  conn: DatabaseConnection,
  sourceKey: string,
  statuses: readonly PlanStatus[],
): Promise<PlanRecord[]> {
  const records = await plans(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('sourceKey').eq(sourceKey),
        oneOf(f, 'status', [...statuses]),
      ]),
  });
  return records.map(normalize);
}

/** The plans of a source kind in one of `statuses`. */
export async function plansOfKind(
  conn: DatabaseConnection,
  sourceKind: string,
  statuses: readonly PlanStatus[],
): Promise<PlanRecord[]> {
  const records = await plans(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('sourceKind').eq(sourceKind),
        oneOf(f, 'status', [...statuses]),
      ]),
  });
  return records.map(normalize);
}

/** Open plans whose expiry has passed. */
export async function expiredPlans(
  conn: DatabaseConnection,
  statuses: readonly PlanStatus[],
  now: Date,
): Promise<PlanRecord[]> {
  const records = await plans(conn).findMany({
    filter: (f) =>
      f.and([
        oneOf(f, 'status', [...statuses]),
        f.date('expiresAt').before(now.toISOString()),
      ]),
  });
  return records.map(normalize);
}

export async function insertRows(
  conn: DatabaseConnection,
  values: readonly PlanRowRecord[],
): Promise<void> {
  for (const row of values)
    await rows(conn).createOne({ values: asValues(row) });
}

export async function rowsOf(
  conn: DatabaseConnection,
  planIds: readonly string[],
): Promise<PlanRowRecord[]> {
  if (planIds.length === 0) return [];
  return rows(conn).findMany({
    filter: (f) => oneOf(f, 'planId', [...planIds]),
    sort: (sort) => [sort.field('planId').asc(), sort.field('position').asc()],
  });
}

export async function updateRow(
  conn: DatabaseConnection,
  id: string,
  values: Partial<Pick<PlanRowRecord, 'params' | 'check' | 'result'>>,
): Promise<void> {
  await rows(conn).updateOne({ filter: { id }, values: asValues(values) });
}

export async function deleteRows(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<void> {
  if (ids.length === 0) return;
  await rows(conn).deleteMany({ filter: (f) => oneOf(f, 'id', [...ids]) });
}

/** The issues recorded as touched by `planId`. */
export async function issuesOfPlan(
  conn: DatabaseConnection,
  planId: string,
): Promise<string[]> {
  const records = await planIssues(conn).findMany({ filter: { planId } });
  return records.map((record) => record.issueId);
}

/** Records `issueIds` as touched by `planId`, besides those already recorded; `id` names each new record. */
export async function addPlanIssues(
  conn: DatabaseConnection,
  planId: string,
  issueIds: readonly string[],
  id: () => string,
): Promise<void> {
  const known = new Set(await issuesOfPlan(conn, planId));
  for (const issueId of new Set(issueIds))
    if (!known.has(issueId))
      await planIssues(conn).createOne({
        values: { id: id(), planId, issueId },
      });
}

/** Replaces the issues recorded as touched by `planId` with `issueIds`. */
export async function setPlanIssues(
  conn: DatabaseConnection,
  planId: string,
  issueIds: readonly string[],
  id: () => string,
): Promise<void> {
  const keep = new Set(issueIds);
  await planIssues(conn).deleteMany({
    filter: (f) =>
      f.and([
        f.string('planId').eq(planId),
        ...[...keep].map((issueId) => f.string('issueId').ne(issueId)),
      ]),
  });
  await addPlanIssues(conn, planId, issueIds, id);
}

/** The plans recorded as touching `issueId`. */
export async function plansOfIssue(
  conn: DatabaseConnection,
  issueId: string,
): Promise<string[]> {
  const records = await planIssues(conn).findMany({ filter: { issueId } });
  return records.map((record) => record.planId);
}

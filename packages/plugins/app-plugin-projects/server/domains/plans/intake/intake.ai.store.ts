/**
 * The `pmIntakeJobs` collection: requests to AI and what came of them (`shared/intake-ai.ts`). Only this file reads or
 * writes it.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  IntakeAiChanges,
  IntakeAiMode,
  IntakeAiStatus,
  IntakeAiTask,
} from '../../../../shared/intake-ai.js';

const JOBS = 'pmIntakeJobs';

export interface IntakeJobRecord {
  readonly id: string;
  readonly userId: string;
  readonly mode: IntakeAiMode;
  readonly status: IntakeAiStatus;
  readonly basePlanId: string | null;
  readonly issueId: string | null;
  readonly projectId: string | null;
  readonly instruction: string | null;
  readonly fileIds: readonly string[] | null;
  readonly task: IntakeAiTask;
  readonly ref: string | null;
  readonly byName: string | null;
  readonly planId: string | null;
  readonly changes: IntakeAiChanges | null;
  readonly unknownLabels: readonly string[] | null;
  readonly dropped: number;
  readonly error: { readonly code: string; readonly message: string } | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly finishedAt: string | null;
}

export type IntakeJobValues = Partial<
  Omit<IntakeJobRecord, 'id' | 'userId' | 'createdAt'>
>;

const jobs = (conn: DatabaseConnection) =>
  conn.repository<IntakeJobRecord>(JOBS);
/** JSON columns take plain JSON, which the Repository's mutation types do not express. */
const asValues = <T>(values: T): never => values as never;

const iso = (value: unknown): string | null =>
  value === null || value === undefined
    ? null
    : new Date(value as string).toISOString();

function normalize(record: IntakeJobRecord): IntakeJobRecord {
  return {
    ...record,
    dropped: Number(record.dropped ?? 0),
    createdAt: iso(record.createdAt) as string,
    updatedAt: iso(record.updatedAt) as string,
    finishedAt: iso(record.finishedAt),
  };
}

export async function insertJob(
  conn: DatabaseConnection,
  values: IntakeJobRecord,
): Promise<void> {
  await jobs(conn).createOne({ values: asValues(values) });
}

export async function findJob(
  conn: DatabaseConnection,
  id: string,
): Promise<IntakeJobRecord | undefined> {
  const record = await jobs(conn).findOne({ filter: { id } });
  return record ? normalize(record) : undefined;
}

/** Writes `values` while the job is still running; answers whether it was. */
export async function updateRunningJob(
  conn: DatabaseConnection,
  id: string,
  values: IntakeJobValues,
): Promise<boolean> {
  const { updatedCount } = await jobs(conn).updateMany({
    filter: (f) =>
      f.and([f.string('id').eq(id), f.string('status').eq('running')]),
    values: asValues({ ...values, updatedAt: new Date().toISOString() }),
  });
  return updatedCount > 0;
}

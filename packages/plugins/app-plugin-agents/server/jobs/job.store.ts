/**
 * The job collections: `agJobs` and its log, `agJobEvents`. Only the jobs domain reads or writes them; a runner's
 * slots count its active jobs through `activeJobsOn` (`work/slots.ts`).
 */
import {
  JOB_KINDS,
  type JobFailureReason,
  type JobKind,
  type JobStatus,
  type RunnerFeature,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection, Repository } from '@nocobase/db';

import {
  JOB_VIAS,
  type Job,
  type JobEventView,
  type JobVia,
} from '../../shared/jobs.js';
import { stringArray, type JsonColumn } from '../kernel/values.js';

export interface JobRecord {
  readonly id: string;
  readonly kind: string;
  readonly executor: string;
  readonly status: JobStatus;
  readonly priority: number;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly title: string | null;
  readonly subjectKind: string | null;
  readonly subjectId: string | null;
  readonly actorUserId: string;
  readonly via: string;
  readonly runnerIds: JsonColumn;
  readonly runnerId: string | null;
  readonly heldBy: JsonColumn;
  readonly spec: JsonColumn;
  readonly requires: JsonColumn;
  readonly result: JsonColumn;
  readonly exitCode: number | null;
  readonly sha: string | null;
  readonly availableAt: string | null;
  readonly leaseExpiresAt: string | null;
  readonly dispatchedAt: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly lastActivityAt: string | null;
  readonly cancelRequestedAt: string | null;
  readonly cancelledById: string | null;
  readonly failureReason: string | null;
  readonly failureDetail: string | null;
  readonly workDir: string | null;
  readonly claimFailures: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface JobEventRecord {
  readonly id: string;
  readonly jobId: string;
  readonly seq: number;
  readonly at: string;
  readonly type: string;
  readonly stream: string | null;
  readonly phase: string | null;
  readonly content: string | null;
  readonly meta: JsonColumn;
  readonly truncated: boolean;
  readonly createdAt: string;
}

export function jobsRepo(conn: DatabaseConnection): Repository<JobRecord> {
  return conn.repository<JobRecord>('agJobs');
}

export function jobEventsRepo(
  conn: DatabaseConnection,
): Repository<JobEventRecord> {
  return conn.repository<JobEventRecord>('agJobEvents');
}

export const ACTIVE_JOB: readonly JobStatus[] = ['dispatched', 'running'];

export function isActiveJob(status: JobStatus): boolean {
  return ACTIVE_JOB.includes(status);
}

export function isTerminalJob(status: JobStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

export function isJobKind(value: string): value is JobKind {
  return (JOB_KINDS as readonly string[]).includes(value);
}

function parseJson(value: JsonColumn): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

/** The spec as stored (references to secrets, never values). */
export function specOf(record: JobRecord): unknown {
  return parseJson(record.spec);
}

export function requiresOf(record: JobRecord): RunnerFeature[] {
  return stringArray(record.requires) as RunnerFeature[];
}

export function toJob(record: JobRecord): Job {
  const runnerIds =
    record.runnerIds === null ? null : stringArray(record.runnerIds);
  const result = parseJson(record.result);
  return {
    id: record.id,
    kind: record.kind,
    executor: (isJobKind(record.executor)
      ? record.executor
      : 'build') satisfies JobKind,
    status: record.status,
    title: record.title,
    subject:
      record.subjectKind !== null && record.subjectId !== null
        ? { kind: record.subjectKind, id: record.subjectId }
        : null,
    actorUserId: record.actorUserId,
    via: (JOB_VIAS as readonly string[]).includes(record.via)
      ? (record.via as JobVia)
      : 'system',
    priority: Number(record.priority),
    attempt: Number(record.attempt),
    maxAttempts: Number(record.maxAttempts),
    runnerIds: runnerIds && runnerIds.length > 0 ? runnerIds : null,
    runnerId: record.runnerId,
    result: result ?? null,
    exitCode: record.exitCode === null ? null : Number(record.exitCode),
    sha: record.sha,
    failureReason: record.failureReason as JobFailureReason | null,
    failureDetail: record.failureDetail,
    cancelRequestedAt: record.cancelRequestedAt,
    cancelledById: record.cancelledById,
    availableAt: record.availableAt,
    dispatchedAt: record.dispatchedAt,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toJobEvent(record: JobEventRecord): JobEventView {
  return {
    seq: Number(record.seq),
    at: record.at,
    type: record.type as JobEventView['type'],
    stream: record.stream as JobEventView['stream'],
    phase: record.phase,
    content: record.content,
    truncated: Boolean(record.truncated),
  };
}

export async function findJobRecord(
  conn: DatabaseConnection,
  id: string,
): Promise<JobRecord | null> {
  return (await jobsRepo(conn).findOne({ filter: { id } })) ?? null;
}

/** How many jobs `runnerId` holds now. */
export async function activeJobsOn(
  conn: DatabaseConnection,
  runnerId: string,
): Promise<number> {
  return jobsRepo(conn).count({
    filter: (f) =>
      f.and([
        f.string('runnerId').eq(runnerId),
        f.or(ACTIVE_JOB.map((status) => f.string('status').eq(status))),
      ]),
  });
}

/** The highest `seq` stored for the job, or 0. */
export async function lastJobSeq(
  conn: DatabaseConnection,
  jobId: string,
): Promise<number> {
  const last = await jobEventsRepo(conn).findOne({
    filter: { jobId },
    sort: (sort) => sort.field('seq').desc(),
  });
  return last ? Number(last.seq) : 0;
}

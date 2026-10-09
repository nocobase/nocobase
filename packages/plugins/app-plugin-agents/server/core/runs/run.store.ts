/**
 * The run collections: `agRuns` and what hangs off a run (inputs, events, usage, repos, tokens, sessions). Only the
 * runs domain reads or writes them.
 */
import type {
  ActorKind,
  AgentTool,
  FailureReason,
  RunInput,
  RunInputType,
  RunnerFeature,
  RunStatus,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type {
  Run,
  RunInputRecord as RunInputView,
  RunRepo,
} from '../../../shared/runs.js';
import {
  jsonObject,
  stringArray,
  type JsonColumn,
} from '../../kernel/values.js';

export interface RunRecord {
  readonly id: string;
  readonly agentId: string;
  readonly agentType: string;
  readonly runnerId: string | null;
  readonly tool?: string | null;
  readonly modelService?: string | null;
  readonly model?: string | null;
  readonly effort?: string | null;
  readonly status: RunStatus;
  readonly priority: number;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly retryOfRunId: string | null;
  readonly parentRunId?: string | null;
  readonly subjectKind: string;
  readonly subjectId: string;
  readonly threadScope: string;
  readonly actorUserId: string;
  readonly ownerUserId: string | null;
  readonly requires: readonly unknown[];
  readonly acceptsInput: boolean;
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
  readonly summary: string | null;
  readonly sessionId: string | null;
  readonly workDir: string | null;
  readonly directoryKey: string | null;
  readonly claimFailures: number;
  readonly payloadFingerprint: string | null;
  /** While queued: the variables for team runners only that kept a personal runner off it (`VariableRef[]`). */
  readonly teamOnlyVariables?: JsonColumn;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface InputRecord {
  readonly id: string;
  readonly runId: string;
  readonly type: string;
  readonly actorKind: string;
  readonly actorId: string;
  readonly actorName: string;
  readonly text: string;
  readonly payload: JsonColumn;
  readonly createdAt: string;
  readonly deliveredAt: string | null;
  readonly handledAt: string | null;
}

export interface EventRecord {
  readonly id: string;
  readonly runId: string;
  readonly seq: number;
  readonly at: string;
  readonly type: string;
  readonly tool: string | null;
  readonly content: string | null;
  readonly input: JsonColumn;
  readonly output: string | null;
  readonly meta: JsonColumn;
  readonly truncated: boolean;
  readonly createdAt: string;
}

export interface UsageRecord {
  readonly id: string;
  readonly runId: string;
  readonly tool: string;
  /** The model service of an online run's model call; null for a coding tool's usage. */
  readonly modelService: string | null;
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  readonly reasoningTokens: number;
  readonly createdAt: string;
}

export interface RepoRecord {
  readonly id: string;
  readonly runId: string;
  readonly url: string;
  readonly branch: string;
  readonly pushed: boolean;
  readonly headSha: string | null;
  readonly updatedAt: string;
}

export interface TokenRecord {
  readonly id: string;
  readonly tokenHash: string;
  readonly runId: string;
  readonly runnerId: string;
  readonly agentId: string;
  readonly actorUserId: string;
  readonly expiresAt: string;
  readonly revokedAt: string | null;
  readonly createdAt: string;
}

export interface SessionRecord {
  readonly id: string;
  readonly agentId: string;
  readonly runnerId: string;
  readonly subjectKind: string;
  readonly subjectId: string;
  readonly threadScope: string;
  readonly sessionId: string;
  readonly workDir: string | null;
  readonly branch: string | null;
  readonly fingerprint: string | null;
  readonly poisoned: boolean;
  readonly updatedAt: string;
}

export function runsRepo(conn: DatabaseConnection): Repository<RunRecord> {
  return conn.repository<RunRecord>('agRuns');
}

export function inputsRepo(conn: DatabaseConnection): Repository<InputRecord> {
  return conn.repository<InputRecord>('agRunInputs');
}

export function eventsRepo(conn: DatabaseConnection): Repository<EventRecord> {
  return conn.repository<EventRecord>('agRunEvents');
}

export function usageRepo(conn: DatabaseConnection): Repository<UsageRecord> {
  return conn.repository<UsageRecord>('agRunUsage');
}

export function reposRepo(conn: DatabaseConnection): Repository<RepoRecord> {
  return conn.repository<RepoRecord>('agRunRepos');
}

export function tokensRepo(conn: DatabaseConnection): Repository<TokenRecord> {
  return conn.repository<TokenRecord>('agRunTokens');
}

export function sessionsRepo(
  conn: DatabaseConnection,
): Repository<SessionRecord> {
  return conn.repository<SessionRecord>('agSessions');
}

export const ACTIVE: readonly RunStatus[] = ['dispatched', 'running'];

export function isActive(status: RunStatus): boolean {
  return ACTIVE.includes(status);
}

export function isTerminal(status: RunStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

export function toRun(record: RunRecord): Run {
  return {
    id: record.id,
    agentId: record.agentId,
    agentType: record.agentType === 'online' ? 'online' : 'runner',
    runnerId: record.runnerId,
    tool: (record.tool as AgentTool | null | undefined) ?? null,
    modelService: record.modelService ?? null,
    model: record.model ?? null,
    effort: record.effort ?? null,
    status: record.status,
    priority: Number(record.priority),
    attempt: Number(record.attempt),
    maxAttempts: Number(record.maxAttempts),
    retryOfRunId: record.retryOfRunId,
    parentRunId: record.parentRunId ?? null,
    subject: { kind: record.subjectKind, id: record.subjectId },
    threadScope: record.threadScope,
    actorUserId: record.actorUserId,
    ownerUserId: record.ownerUserId,
    requires: stringArray(record.requires) as RunnerFeature[],
    acceptsInput: Boolean(record.acceptsInput),
    availableAt: record.availableAt,
    leaseExpiresAt: record.leaseExpiresAt,
    dispatchedAt: record.dispatchedAt,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    lastActivityAt: record.lastActivityAt,
    cancelRequestedAt: record.cancelRequestedAt,
    failureReason: record.failureReason as FailureReason | null,
    failureDetail: record.failureDetail,
    summary: record.summary,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toInput(record: InputRecord): RunInput {
  return {
    id: record.id,
    type: record.type as RunInputType,
    at: record.createdAt,
    actor: {
      kind: record.actorKind as ActorKind,
      id: record.actorId,
      name: record.actorName,
    },
    text: record.text,
    ...(record.payload === null || record.payload === undefined
      ? {}
      : { payload: record.payload }),
  };
}

export function toInputView(record: InputRecord): RunInputView {
  return {
    id: record.id,
    type: record.type as RunInputType,
    actor: {
      kind: record.actorKind as ActorKind,
      id: record.actorId,
      name: record.actorName,
    },
    text: record.text,
    payload: record.payload ?? null,
    createdAt: record.createdAt,
    deliveredAt: record.deliveredAt,
    handledAt: record.handledAt,
  };
}

export function toRepo(record: RepoRecord): RunRepo {
  return {
    url: record.url,
    branch: record.branch,
    pushed: Boolean(record.pushed),
    headSha: record.headSha,
    updatedAt: record.updatedAt,
  };
}

export async function findRunRecord(
  conn: DatabaseConnection,
  id: string,
): Promise<RunRecord | undefined> {
  return runsRepo(conn).findOne({ filter: { id } });
}

/** The run's input not yet reported as handled, oldest first. */
export async function pendingInputs(
  conn: DatabaseConnection,
  runId: string,
): Promise<InputRecord[]> {
  return inputsRepo(conn).findMany({
    filter: (f) =>
      f.and([f.string('runId').eq(runId), f.date('handledAt').empty()]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

/** Marks the given inputs as delivered to the runner, once. */
export async function markDelivered(
  conn: DatabaseConnection,
  inputs: readonly InputRecord[],
  now: string,
): Promise<void> {
  const undelivered = inputs.filter((input) => !input.deliveredAt);
  if (undelivered.length === 0) return;
  await inputsRepo(conn).updateMany({
    filter: (f) =>
      f.and([
        f.or(undelivered.map((input) => f.string('id').eq(input.id))),
        f.date('deliveredAt').empty(),
      ]),
    values: { deliveredAt: now },
  });
}

/**
 * The runs of a work key, (agent, subject, thread), in `statuses`, oldest first. With `actorUserId`, only the runs
 * working as that person: new work merges only into those, while one run per key at a time holds no matter whose.
 */
export async function runsOfKey(
  conn: DatabaseConnection,
  key: {
    readonly agentId: string;
    readonly subjectKind: string;
    readonly subjectId: string;
    readonly threadScope: string;
  },
  statuses: readonly RunStatus[],
  actorUserId?: string,
): Promise<RunRecord[]> {
  return runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('agentId').eq(key.agentId),
        f.string('subjectKind').eq(key.subjectKind),
        f.string('subjectId').eq(key.subjectId),
        f.string('threadScope').eq(key.threadScope),
        ...(actorUserId === undefined
          ? []
          : [f.string('actorUserId').eq(actorUserId)]),
        f.or(statuses.map((status) => f.string('status').eq(status))),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

export async function countActive(
  conn: DatabaseConnection,
  field: 'agentId' | 'runnerId',
  id: string,
): Promise<number> {
  return runsRepo(conn).count({
    filter: (f) =>
      f.and([
        f.string(field).eq(id),
        f.or(ACTIVE.map((status) => f.string('status').eq(status))),
      ]),
  });
}

/** The runs on a subject that have not ended (queued or held), of one agent or of any, oldest first. */
export async function openRunsOn(
  conn: DatabaseConnection,
  subject: { readonly kind: string; readonly id: string },
  agentId?: string,
): Promise<Run[]> {
  const records = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('subjectKind').eq(subject.kind),
        f.string('subjectId').eq(subject.id),
        ...(agentId ? [f.string('agentId').eq(agentId)] : []),
        f.or(
          ['queued', ...ACTIVE].map((status) => f.string('status').eq(status)),
        ),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
  return records.map(toRun);
}

/** The inputs given to runs on a subject since `since`, with the agent of their run and their payload as an object. */
export async function inputsOnSince(
  conn: DatabaseConnection,
  subject: { readonly kind: string; readonly id: string },
  since: Date,
): Promise<
  {
    readonly agentId: string;
    readonly type: string;
    readonly payload: Record<string, unknown>;
  }[]
> {
  const runs = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('subjectKind').eq(subject.kind),
        f.string('subjectId').eq(subject.id),
      ]),
    select: (select) => select.fields('id', 'agentId'),
  });
  if (runs.length === 0) return [];
  const agents = new Map(runs.map((run) => [run.id, run.agentId]));
  const inputs = await inputsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.or(runs.map((run) => f.string('runId').eq(run.id))),
        f.date('createdAt').notBefore(since),
      ]),
    select: (select) => select.fields('runId', 'type', 'payload'),
  });
  return inputs.map((input) => ({
    agentId: agents.get(input.runId) ?? '',
    type: input.type,
    payload: jsonObject(input.payload),
  }));
}

/** The summary of the newest completed run of an agent on a subject, other than `exceptRunId`. */
export async function lastSummary(
  conn: DatabaseConnection,
  key: {
    readonly agentId: string;
    readonly subjectKind: string;
    readonly subjectId: string;
  },
  exceptRunId: string,
): Promise<string | null> {
  const records = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('agentId').eq(key.agentId),
        f.string('subjectKind').eq(key.subjectKind),
        f.string('subjectId').eq(key.subjectId),
        f.string('status').eq('completed'),
        f.string('id').ne(exceptRunId),
      ]),
    sort: (sort) => [sort.field('finishedAt').desc(), sort.field('id').desc()],
    limit: 5,
  });
  return records.find((record) => record.summary)?.summary ?? null;
}

/** Per agent, the runs it has not finished (queued or held). */
export async function openCounts(
  conn: DatabaseConnection,
  agentIds: readonly string[],
): Promise<Map<string, number>> {
  if (agentIds.length === 0) return new Map();
  const records = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.or(agentIds.map((id) => f.string('agentId').eq(id))),
        f.or(
          ['queued', ...ACTIVE].map((status) => f.string('status').eq(status)),
        ),
      ]),
  });
  const counts = new Map<string, number>();
  for (const record of records)
    counts.set(record.agentId, (counts.get(record.agentId) ?? 0) + 1);
  return counts;
}

/** A run's stored events after `afterSeq`, oldest first, at most `limit`. */
export async function eventsAfter(
  conn: DatabaseConnection,
  runId: string,
  afterSeq: number,
  limit: number,
): Promise<EventRecord[]> {
  return eventsRepo(conn).findMany({
    filter: (f) =>
      f.and([f.string('runId').eq(runId), f.number('seq').gt(afterSeq)]),
    sort: (sort) => sort.field('seq').asc(),
    limit,
  });
}

/** Whether `runnerId` kept a session it may resume for the key (agent, subject, thread). */
export async function hasSession(
  conn: DatabaseConnection,
  key: {
    readonly agentId: string;
    readonly runnerId: string;
    readonly subjectKind: string;
    readonly subjectId: string;
    readonly threadScope: string;
  },
): Promise<boolean> {
  const session = await sessionsRepo(conn).findOne({ filter: key });
  return Boolean(session && !session.poisoned);
}

/** The runs that have not ended (queued or held) on any of the subjects of one kind, oldest first. */
export async function openRunsOnEach(
  conn: DatabaseConnection,
  kind: string,
  ids: readonly string[],
): Promise<Run[]> {
  if (ids.length === 0) return [];
  const records = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('subjectKind').eq(kind),
        f.or(ids.map((id) => f.string('subjectId').eq(id))),
        f.or(
          ['queued', ...ACTIVE].map((status) => f.string('status').eq(status)),
        ),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
  return records.map(toRun);
}

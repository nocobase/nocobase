/**
 * Jobs: deterministic steps a runner executes without a model, for the application that registers their kinds. A job
 * is not a run: it has no agent, brief or run token, never wakes an agent, and is not counted in an agent's runs or
 * reports. It shares a run's mechanics, re-implemented on its own collection so that nothing about runs changes:
 *
 * - the queue: priority, then age; a failed attempt with a retryable reason goes back to the queue while attempts
 *   remain;
 * - the claim: the same long-poll hands out runs and jobs, from the same runner slots. A runner fits a job when its
 *   owner let it take jobs (`acceptJobs`), it reports the executor's feature (`jobs.build`), it is shared with the team
 *   or belongs to the person who started the job, the job names no runner or names it, and its owner's local policy
 *   lets it check out the job's repository. The claim is one transaction: a guarded update takes the job, the kind's
 *   `prepare` gives the spec, stored variables it names are opened for this runner through the application's secret
 *   source (`secrets`), and the payload is assembled; a failure rolls back and is counted;
 * - the lease, events, the ending reports and the heartbeat's reconciliation, as for runs;
 * - the sweeper (`sweep`, called by the runners sweeper): takes jobs back from runners that went silent, lost their lease
 *   or never started, fails a job running well past its `timeoutSec`, and records unacknowledged cancellations.
 */
import {
  jobFeature,
  jobSecrets,
  policyAllowsRepo,
  MAX_EVENT_CONTENT_BYTES,
  ProtocolError,
  TIMINGS,
  type ActiveJob,
  type EventsResponse,
  type JobCompleteRequest,
  type JobEventsRequest,
  type JobFailRequest,
  type JobFinishResponse,
  type JobLeaseResponse,
  type JobPayload,
  type JobStartRequest,
  type JobStatus,
  type JobStatusResponse,
  type RunApp,
  type RunnerFeature,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type {
  Job,
  JobEventView,
  JobFilter,
  JobVia,
} from '../../shared/jobs.js';
import type { Runner } from '../../shared/runners.js';
import { later, type Clock } from '../kernel/clock.js';
import { invalid, notFound } from '../kernel/errors.js';
import type { AgentsEventBus } from '../kernel/events.js';
import type { IdSource } from '../kernel/ids.js';
import {
  createSecretMemory,
  jobSecretsKey,
  type SecretMemory,
} from '../kernel/redaction.js';
import type { Tx, TxRunner } from '../kernel/tx.js';
import {
  asJson,
  cleanList,
  covers,
  stringArray,
  truncateBytes,
} from '../kernel/values.js';
import { absentRunners } from '../runners/index.js';
import {
  ACTIVE_JOB,
  findJobRecord,
  isActiveJob,
  isTerminalJob,
  jobEventsRepo,
  jobsRepo,
  lastJobSeq,
  requiresOf,
  specOf,
  toJob,
  toJobEvent,
  type JobRecord,
} from './job.store.js';
import { finishJob, requeueJob } from './job.transitions.js';
import type {
  JobKindRegistration,
  JobKindRegistry,
  RegisteredJobKind,
} from './registry.js';
import {
  checkSpecInput,
  runnerSpec,
  secretRefsOf,
  timeoutSecOf,
  type SecretRef,
} from './spec.js';

/** Queued jobs looked at per claim. */
const CANDIDATES = 50;
/** Claims whose `prepare` failed before the job fails `setupFailed`. */
const MAX_JOB_CLAIM_FAILURES = 3;
/** A job running this much past its own timeout is failed by the sweeper; the runner should have stopped it. */
const TIMEOUT_SLACK_MS = TIMINGS.leaseMs + TIMINGS.cancelGraceMs;
const DEFAULT_MAX_ATTEMPTS = 2;

export interface EnqueueJobInput {
  /** A kind the application registered (`jobs.register`). */
  readonly kind: string;
  /** What `validate` checks; without one, the executor's spec with references to stored variables (`JobSpecInputs`). */
  readonly spec: unknown;
  /** The person on whose behalf it runs: a personal runner takes only its owner's jobs. */
  readonly actorUserId: string;
  /** `human` by default. An agent's request is recorded as `agent`, with the person who woke it as the actor. */
  readonly via?: JobVia;
  /** What it is for, as the application names it; for finding its jobs again. */
  readonly subject?: { readonly kind: string; readonly id: string };
  readonly title?: string;
  /** Only these runners may take it. */
  readonly runnerIds?: readonly string[];
  /** Lower runs first; 0 by default. */
  readonly priority?: number;
  /** 2 by default, at most 5. */
  readonly maxAttempts?: number;
}

/** What `watch` hears, after the change commits. */
export type JobChange =
  | {
      readonly type: 'status';
      readonly jobId: string;
      readonly status: JobStatus;
    }
  | {
      readonly type: 'events';
      readonly jobId: string;
      readonly lastSeq: number;
    };

export interface JobSweepReport {
  readonly requeued: number;
  readonly failed: number;
  readonly cancelled: number;
}

/** The runner protocol's side of jobs, for the runner routes. */
export interface JobRunnerReports {
  /** Up to `free` jobs for `runner` (within its slots, shared with runs), each with its payload. */
  claim(runner: Runner, free: number): Promise<JobPayload[]>;
  lease(runner: Runner, jobId: string): Promise<JobLeaseResponse>;
  start(
    runner: Runner,
    jobId: string,
    request: JobStartRequest,
  ): Promise<JobLeaseResponse>;
  events(
    runner: Runner,
    jobId: string,
    request: JobEventsRequest,
  ): Promise<EventsResponse>;
  status(runner: Runner, jobId: string): Promise<JobStatusResponse>;
  complete(
    runner: Runner,
    jobId: string,
    request: JobCompleteRequest,
  ): Promise<JobFinishResponse>;
  fail(
    runner: Runner,
    jobId: string,
    request: JobFailRequest,
  ): Promise<JobFinishResponse>;
  cancelAck(runner: Runner, jobId: string): Promise<JobFinishResponse>;
  /** Compares the jobs a heartbeat says the runner holds with what the server thinks. */
  reconcile(
    runner: Runner,
    active: readonly ActiveJob[],
  ): Promise<{ cancelRequested: string[]; release: string[] }>;
}

/**
 * Where the stored variables a job names are opened, as the application provides it (the agents plugin's variables).
 * Each value is keyed `scope\u0000scopeId\u0000name`; a name it does not hold is left out. It records the delivery.
 */
export interface JobSecretSource {
  open(
    conn: DatabaseConnection,
    refs: readonly SecretRef[],
    delivery: { readonly jobId: string; readonly runnerId: string },
  ): Promise<Map<string, string>>;
}

/** The application's API for jobs (`runners.jobs`). */
export interface JobService {
  /** Registers a kind of job the application enqueues; at boot. */
  register<Spec>(kind: string, registration: JobKindRegistration<Spec>): void;
  /** The registered kinds. */
  kinds(): readonly RegisteredJobKind[];
  /** Queues a job; with `tx`, inside that unit of work (announced when it commits). */
  enqueue(input: EnqueueJobInput, tx?: Tx): Promise<Job>;
  /**
   * Cancels a job: a queued one at once, a held one once its runner stops it (or the sweeper gives up waiting). An
   * ended job is answered as it is.
   */
  cancel(jobId: string, byUserId: string | null, tx?: Tx): Promise<Job>;
  /** 404 when absent. */
  get(jobId: string): Promise<Job>;
  find(conn: DatabaseConnection, jobId: string): Promise<Job | null>;
  /** Newest first. `actorUserId` and `visibleTo` narrow it to a person's own jobs. */
  list(
    filter?: JobFilter & {
      readonly actorUserId?: string;
      /** Jobs this person started or that ran on one of these runners. */
      readonly visibleTo?: {
        readonly userId: string;
        readonly runnerIds: readonly string[];
      };
    },
  ): Promise<Job[]>;
  /** The job's log after `afterSeq`, oldest first. */
  events(
    jobId: string,
    afterSeq?: number,
    limit?: number,
  ): Promise<JobEventView[]>;
  /** Hears every job's changes, or one job's; returns what stops listening. */
  watch(
    jobId: string | null,
    listener: (change: JobChange) => void,
  ): () => void;
  /** For the runner routes. */
  readonly runner: JobRunnerReports;
  /** For the sweeper. */
  sweep(): Promise<JobSweepReport>;
  /**
   * Sets where the secrets jobs name are opened; returns what removes it. Without one, a job naming a secret cannot be
   * claimed and fails `setupFailed` after a few claims.
   */
  provideSecrets(source: JobSecretSource): () => void;
}

export interface JobServiceDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly events: AgentsEventBus;
  readonly kinds: JobKindRegistry;
  readonly app: RunApp;
  /** Items each runner holds now, jobs and the registered work kinds' together: its slots are shared. */
  readonly slotsUsed: (
    conn: DatabaseConnection,
    runnerId: string,
  ) => Promise<number>;
  /**
   * The secrets claims handed out. Job events and failure details are redacted of them and of the common patterns
   * before they are stored, whatever the runner did (`kernel/redaction.ts`).
   */
  readonly secrets?: SecretMemory;
  readonly onError?: (message: string, error: unknown) => void;
}

class PrepareError extends Error {
  public constructor(
    message: string,
    public readonly cause: unknown,
  ) {
    super(message);
    this.name = 'PrepareError';
  }
}

class NotForThisRunner extends Error {
  public constructor() {
    super('The job does not fit this runner.');
    this.name = 'NotForThisRunner';
  }
}

type Attempt =
  | { readonly kind: 'claimed'; readonly payload: JobPayload }
  | { readonly kind: 'full' }
  | { readonly kind: 'skipped' };

/** The repository a stored or prepared spec checks out, when it names one. */
function repoUrlOf(spec: unknown): string | null {
  const repo = (spec as { repo?: { url?: unknown } } | null)?.repo;
  return typeof repo?.url === 'string' ? repo.url : null;
}

/** Whether `runner` may take `job`, before any lock is taken. */
export function jobFits(runner: Runner, job: JobRecord): boolean {
  if (runner.status !== 'online' || !runner.acceptJobs) return false;
  if (!covers(runner.features, requiresOf(job))) return false;
  const runnerIds = job.runnerIds === null ? [] : stringArray(job.runnerIds);
  if (runnerIds.length > 0 && !runnerIds.includes(runner.id)) return false;
  const repo = repoUrlOf(specOf(job));
  if (repo !== null && !policyAllowsRepo(runner.policy, repo)) return false;
  return runner.trust === 'team' || runner.ownerUserId === job.actorUserId;
}

export function createJobService(deps: JobServiceDeps): JobService {
  const { tx, ids, clock, kinds } = deps;
  const secrets = deps.secrets ?? createSecretMemory();
  let secretSource: JobSecretSource | undefined;
  const redactorOf = (jobId: string) => secrets.redactor(jobSecretsKey(jobId));
  const onError =
    deps.onError ??
    ((message: string, error: unknown) => console.error(message, error));

  const require = async (
    conn: DatabaseConnection,
    jobId: string,
  ): Promise<JobRecord> => {
    const record = await findJobRecord(conn, jobId);
    if (!record) throw notFound('Job');
    return record;
  };

  /** The job, while `runner` holds it; `LEASE_LOST`, `RUN_NOT_ACTIVE` or `RUN_NOT_OWNED` otherwise. */
  const held = async (
    conn: DatabaseConnection,
    runner: Runner,
    jobId: string,
  ): Promise<JobRecord> => {
    const job = await findJobRecord(conn, jobId);
    if (job && job.runnerId === runner.id) {
      if (isActiveJob(job.status)) return job;
      throw new ProtocolError('RUN_NOT_ACTIVE', `The job is ${job.status}.`, {
        status: job.status,
      });
    }
    if (job && stringArray(job.heldBy).includes(runner.id))
      throw new ProtocolError(
        'LEASE_LOST',
        'This runner no longer holds the job; stop it.',
        { status: job.status },
      );
    throw new ProtocolError(
      'RUN_NOT_OWNED',
      'This runner does not hold the job.',
    );
  };

  const extendLease = async (conn: DatabaseConnection, job: JobRecord) => {
    const now = clock.now();
    const leaseExpiresAt = later(now, TIMINGS.leaseMs);
    await jobsRepo(conn).updateMany({
      filter: { id: job.id },
      values: {
        leaseExpiresAt,
        lastActivityAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    });
    return leaseExpiresAt;
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Claiming

  async function assemble(
    { conn }: Tx,
    job: JobRecord,
    runner: Runner,
    leaseExpiresAt: string,
  ): Promise<{ payload: JobPayload; requires: RunnerFeature[] }> {
    const registration = kinds.get(job.kind);
    if (!registration)
      throw new Error(`No job kind "${job.kind}" is registered.`);
    const stored = specOf(job);
    const input = registration.prepare
      ? await registration.prepare({
          conn,
          job: toJob(job),
          spec: stored,
          runner,
        })
      : stored;
    const repo = repoUrlOf(input);
    if (repo !== null && !policyAllowsRepo(runner.policy, repo))
      throw new NotForThisRunner();
    const refs = secretRefsOf(input);
    const requires = cleanList([
      ...requiresOf(job),
      ...(refs.length > 0 ? ['secrets'] : []),
    ]) as RunnerFeature[];
    if (!covers(runner.features, requires)) throw new NotForThisRunner();
    if (refs.length > 0 && !secretSource)
      throw new Error(
        'The job names stored secrets, and no secret source is provided to open them.',
      );
    const values =
      refs.length > 0 && secretSource
        ? await secretSource.open(conn, refs, {
            jobId: job.id,
            runnerId: runner.id,
          })
        : new Map<string, string>();
    const spec = runnerSpec(registration.executor, input, values);
    const header = {
      id: job.id,
      attempt: Number(job.attempt),
      maxAttempts: Number(job.maxAttempts),
      createdAt: job.createdAt,
      leaseExpiresAt,
      firstSeq: (await lastJobSeq(conn, job.id)) + 1,
      requires,
    };
    const payload: JobPayload = {
      job: { ...header, kind: 'build', spec },
      app: deps.app,
      ...(job.title ? { title: job.title } : {}),
    };
    secrets.remember(jobSecretsKey(job.id), jobSecrets(payload));
    return { payload, requires };
  }

  async function attempt(
    runner: Runner,
    candidate: JobRecord,
  ): Promise<Attempt> {
    return tx.run(async (unit) => {
      const { conn } = unit;
      if ((await deps.slotsUsed(conn, runner.id)) >= runner.slots)
        return { kind: 'full' };
      const now = clock.now();
      const nowText = now.toISOString();
      const leaseExpiresAt = later(now, TIMINGS.leaseMs);
      const taken = await jobsRepo(conn).updateMany({
        filter: (f) =>
          f.and([
            f.string('id').eq(candidate.id),
            f.string('status').eq('queued'),
          ]),
        values: {
          status: 'dispatched',
          runnerId: runner.id,
          heldBy: cleanList([...stringArray(candidate.heldBy), runner.id]),
          leaseExpiresAt,
          dispatchedAt: nowText,
          lastActivityAt: nowText,
          availableAt: null,
          updatedAt: nowText,
        },
      });
      if (taken.updatedCount !== 1) return { kind: 'skipped' };
      const job = (await findJobRecord(conn, candidate.id))!;
      let assembled: Awaited<ReturnType<typeof assemble>>;
      try {
        assembled = await assemble(unit, job, runner, leaseExpiresAt);
      } catch (error) {
        if (error instanceof NotForThisRunner) throw error;
        throw new PrepareError(
          error instanceof Error ? error.message : String(error),
          error,
        );
      }
      await jobsRepo(conn).updateMany({
        filter: { id: job.id },
        values: { requires: [...assembled.requires] },
      });
      unit.emit({ type: 'job.changed', jobId: job.id, status: 'dispatched' });
      return { kind: 'claimed', payload: assembled.payload };
    });
  }

  async function recordFailure(jobId: string, error: PrepareError) {
    onError(`Runners could not prepare job ${jobId}.`, error.cause);
    await tx.run(async (unit) => {
      const job = await findJobRecord(unit.conn, jobId);
      if (!job || job.status !== 'queued') return;
      const failures = Number(job.claimFailures) + 1;
      if (failures >= MAX_JOB_CLAIM_FAILURES) {
        await finishJob(unit, { clock, kinds }, job, {
          status: 'failed',
          reason: 'setupFailed',
          detail: error.message,
        });
        return;
      }
      await jobsRepo(unit.conn).updateMany({
        filter: { id: jobId },
        values: {
          claimFailures: failures,
          failureDetail: error.message.slice(0, 10_000),
        },
      });
    });
  }

  async function claim(runner: Runner, free: number): Promise<JobPayload[]> {
    if (runner.status !== 'online' || !runner.acceptJobs || free <= 0)
      return [];
    if (!runner.features.some((feature) => feature.startsWith('jobs.')))
      return [];
    const conn = tx.read();
    const now = clock.now();
    const candidates = await jobsRepo(conn).findMany({
      filter: (f) =>
        f.and([
          f.string('status').eq('queued'),
          f.or([
            f.date('availableAt').empty(),
            f.date('availableAt').notAfter(now),
          ]),
        ]),
      sort: (sort) => [
        sort.field('priority').asc(),
        sort.field('createdAt').asc(),
        sort.field('id').asc(),
      ],
      limit: CANDIDATES,
    });
    const payloads: JobPayload[] = [];
    for (const candidate of candidates) {
      if (payloads.length >= Math.min(free, runner.slots)) break;
      if (!jobFits(runner, candidate)) continue;
      try {
        const result = await attempt(runner, candidate);
        if (result.kind === 'full') break;
        if (result.kind === 'claimed') payloads.push(result.payload);
      } catch (error) {
        if (error instanceof NotForThisRunner) continue;
        if (!(error instanceof PrepareError)) throw error;
        await recordFailure(candidate.id, error);
      }
    }
    return payloads;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // What the runner reports

  const runnerReports: JobRunnerReports = {
    claim,

    lease: (runner, jobId) =>
      tx.run(async ({ conn }) => {
        const job = await held(conn, runner, jobId);
        return {
          status: job.status,
          leaseExpiresAt: await extendLease(conn, job),
          cancelRequested: job.cancelRequestedAt !== null,
        };
      }),

    start: (runner, jobId, request) =>
      tx.run(async (unit) => {
        const { conn } = unit;
        const job = await held(conn, runner, jobId);
        if (job.status === 'dispatched' && job.cancelRequestedAt === null) {
          const now = clock.now().toISOString();
          await jobsRepo(conn).updateMany({
            filter: (f) =>
              f.and([
                f.string('id').eq(job.id),
                f.string('status').eq('dispatched'),
              ]),
            values: {
              status: 'running',
              startedAt: now,
              lastActivityAt: now,
              workDir: request.workDir ?? null,
              updatedAt: now,
            },
          });
          unit.emit({ type: 'job.changed', jobId: job.id, status: 'running' });
        }
        const leaseExpiresAt = await extendLease(conn, job);
        const current = (await findJobRecord(conn, job.id))!;
        return {
          status: current.status,
          leaseExpiresAt,
          cancelRequested: current.cancelRequestedAt !== null,
        };
      }),

    async events(runner, jobId, request) {
      const outcome = await tx.run(async (unit) => {
        const { conn } = unit;
        const job = await held(conn, runner, jobId);
        const seqs = request.events.map((event) => event.seq);
        const existing =
          seqs.length === 0
            ? []
            : await jobEventsRepo(conn).findMany({
                filter: (f) =>
                  f.and([
                    f.string('jobId').eq(job.id),
                    f.or(seqs.map((seq) => f.number('seq').eq(seq))),
                  ]),
              });
        const stored = new Set(existing.map((event) => Number(event.seq)));
        const now = clock.now().toISOString();
        const redact = redactorOf(job.id);
        const added: JobEventView[] = [];
        let lastSeq = 0;
        for (const event of request.events) {
          lastSeq = Math.max(lastSeq, event.seq);
          if (stored.has(event.seq)) continue;
          stored.add(event.seq);
          const content =
            event.content === undefined
              ? null
              : truncateBytes(
                  redact.text(event.content),
                  MAX_EVENT_CONTENT_BYTES,
                );
          const values = {
            id: ids.next(),
            jobId: job.id,
            seq: event.seq,
            at: Number.isNaN(Date.parse(event.at))
              ? now
              : new Date(event.at).toISOString(),
            type: event.type,
            stream: event.stream ?? null,
            phase: event.phase ?? null,
            content: content?.text ?? null,
            meta: asJson(redact.value(event.meta)),
            truncated: Boolean(event.truncated) || Boolean(content?.truncated),
            createdAt: now,
          };
          await jobEventsRepo(conn).createOne({ values });
          added.push(toJobEvent(values));
        }
        await jobsRepo(conn).updateMany({
          filter: { id: job.id },
          values: { lastActivityAt: now },
        });
        if (added.length > 0)
          unit.emit({ type: 'job.events', jobId: job.id, lastSeq });
        return {
          job,
          added,
          response: {
            accepted: added.length,
            duplicates: request.events.length - added.length,
            cancelRequested: job.cancelRequestedAt !== null,
          } satisfies EventsResponse,
        };
      });
      const registration = kinds.get(outcome.job.kind);
      if (registration?.onEvent && outcome.added.length > 0)
        try {
          await registration.onEvent(toJob(outcome.job), outcome.added);
        } catch (error) {
          onError(`A job kind's onEvent failed for job ${jobId}.`, error);
        }
      return outcome.response;
    },

    status: (runner, jobId) =>
      tx.run(async ({ conn }) => {
        const job = await findJobRecord(conn, jobId);
        // A runner may ask about a job it held once it ended, to learn how.
        if (job && job.runnerId === runner.id && isTerminalJob(job.status))
          return {
            status: job.status,
            cancelRequested: job.cancelRequestedAt !== null,
            leaseExpiresAt: null,
          };
        const current = await held(conn, runner, jobId);
        return {
          status: current.status,
          cancelRequested: current.cancelRequestedAt !== null,
          leaseExpiresAt: current.leaseExpiresAt,
        };
      }),

    complete: (runner, jobId, request) =>
      tx.run(async (unit) => {
        const job = await held(unit.conn, runner, jobId);
        if (request.result.kind !== job.executor)
          throw invalid(
            `The job is a ${job.executor} job; its result cannot be a ${request.result.kind} result.`,
          );
        const ended = await finishJob(unit, { clock, kinds }, job, {
          status: 'completed',
          result: request.result,
          ...(request.result.kind === 'build'
            ? { sha: request.result.sha, exitCode: request.result.exitCode }
            : {}),
        });
        if (!ended)
          throw new ProtocolError('LEASE_LOST', 'The job moved on; stop it.');
        secrets.forget(jobSecretsKey(job.id));
        return { status: ended.status };
      }),

    fail: (runner, jobId, request) =>
      tx.run(async (unit) => {
        const job = await held(unit.conn, runner, jobId);
        const outcome = await requeueJob(
          unit,
          { clock, kinds },
          job,
          request.reason,
          request.detail === undefined
            ? undefined
            : redactorOf(job.id).text(request.detail),
          {
            ...(request.exitCode === undefined
              ? {}
              : { exitCode: request.exitCode }),
            ...(request.sha === undefined ? {} : { sha: request.sha }),
          },
        );
        if (!outcome.job)
          throw new ProtocolError('LEASE_LOST', 'The job moved on; stop it.');
        if (outcome.status !== 'queued') secrets.forget(jobSecretsKey(job.id));
        return {
          status: outcome.status,
          ...(outcome.status === 'queued' && outcome.retryAt
            ? { retryAt: outcome.retryAt }
            : {}),
        };
      }),

    cancelAck: (runner, jobId) =>
      tx.run(async (unit) => {
        const job = await held(unit.conn, runner, jobId);
        const ended = await finishJob(unit, { clock, kinds }, job, {
          status: 'cancelled',
          reason: 'cancelled',
        });
        if (!ended)
          throw new ProtocolError('LEASE_LOST', 'The job moved on; stop it.');
        secrets.forget(jobSecretsKey(job.id));
        return { status: ended.status };
      }),

    async reconcile(runner, active) {
      const conn = tx.read();
      const cancelRequested: string[] = [];
      const release: string[] = [];
      for (const { jobId } of active) {
        const job = await findJobRecord(conn, jobId);
        if (!job || job.runnerId !== runner.id || !isActiveJob(job.status))
          release.push(jobId);
        else if (job.cancelRequestedAt !== null) cancelRequested.push(jobId);
      }
      return { cancelRequested, release };
    },
  };

  // ---------------------------------------------------------------------------------------------------------------
  // The sweeper's part

  async function sweep(): Promise<JobSweepReport> {
    const now = clock.now();
    const counts = { requeued: 0, failed: 0, cancelled: 0 };
    const conn = tx.read();
    const heldJobs = await jobsRepo(conn).findMany({
      filter: (f) =>
        f.or(ACTIVE_JOB.map((status) => f.string('status').eq(status))),
    });
    const absent = new Set(
      await absentRunners(
        conn,
        [...new Set(heldJobs.map((job) => job.runnerId ?? ''))].filter(Boolean),
      ),
    );
    const time = (at: string | null) => (at ? Date.parse(at) : 0);
    const current = async (unit: Tx, job: JobRecord) => {
      const found = await findJobRecord(unit.conn, job.id);
      return found &&
        found.status === job.status &&
        found.runnerId === job.runnerId
        ? found
        : null;
    };
    const take = (
      job: JobRecord,
      reason: 'runnerOffline' | 'startTimeout' | 'leaseExpired',
    ) =>
      tx.run(async (unit) => {
        const found = await current(unit, job);
        if (!found) return;
        const outcome = await requeueJob(unit, { clock, kinds }, found, reason);
        if (outcome.status === 'queued') counts.requeued += 1;
        else if (outcome.status === 'cancelled') counts.cancelled += 1;
        else if (outcome.job) counts.failed += 1;
      });
    const end = (job: JobRecord, outcome: Parameters<typeof finishJob>[3]) =>
      tx.run(async (unit) => {
        const found = await current(unit, job);
        if (!found) return;
        const ended = await finishJob(unit, { clock, kinds }, found, outcome);
        if (ended?.status === 'failed') counts.failed += 1;
        if (ended?.status === 'cancelled') counts.cancelled += 1;
      });

    for (const job of heldJobs) {
      if (
        job.cancelRequestedAt &&
        time(job.cancelRequestedAt) < now.getTime() - TIMINGS.cancelGraceMs
      ) {
        await end(job, { status: 'cancelled', reason: 'cancelled' });
        continue;
      }
      if (job.runnerId && absent.has(job.runnerId)) {
        await take(job, 'runnerOffline');
        continue;
      }
      if (
        job.status === 'dispatched' &&
        time(job.dispatchedAt) < now.getTime() - TIMINGS.startTimeoutMs
      ) {
        await take(job, 'startTimeout');
        continue;
      }
      if (time(job.leaseExpiresAt) < now.getTime()) {
        await take(job, 'leaseExpired');
        continue;
      }
      const timeoutSec = timeoutSecOf(specOf(job));
      if (
        job.status === 'running' &&
        timeoutSec !== null &&
        time(job.startedAt) <
          now.getTime() - timeoutSec * 1000 - TIMEOUT_SLACK_MS
      )
        await end(job, {
          status: 'failed',
          reason: 'jobTimeout',
          detail: `The job ran past its ${timeoutSec} s timeout and its runner did not stop it.`,
        });
    }
    return counts;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // The application's API

  return {
    register: (kind, registration) => kinds.register(kind, registration),
    kinds: () => kinds.list(),

    enqueue: (input, outer) =>
      tx.run(async (unit) => {
        const registration = kinds.get(input.kind);
        if (!registration)
          throw invalid(`No job kind "${input.kind}" is registered.`);
        if (!input.actorUserId) throw invalid('A job needs an actorUserId.');
        let spec: unknown;
        try {
          spec = registration.validate
            ? registration.validate(input.spec)
            : input.spec;
        } catch (error) {
          if (error instanceof ProtocolError) throw error;
          throw invalid(error instanceof Error ? error.message : String(error));
        }
        if (!registration.prepare) checkSpecInput(registration.executor, spec);
        const maxAttempts = Math.min(
          5,
          Math.max(1, Math.trunc(input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)),
        );
        const runnerIds = cleanList(input.runnerIds ?? []);
        const now = clock.now().toISOString();
        const id = ids.next();
        await jobsRepo(unit.conn).createOne({
          values: {
            id,
            kind: registration.kind,
            executor: registration.executor,
            status: 'queued',
            priority: Math.trunc(input.priority ?? 0),
            attempt: 1,
            maxAttempts,
            title: input.title?.slice(0, 500) ?? null,
            subjectKind: input.subject?.kind ?? null,
            subjectId: input.subject?.id ?? null,
            actorUserId: input.actorUserId,
            via: input.via ?? 'human',
            runnerIds: runnerIds.length > 0 ? runnerIds : null,
            runnerId: null,
            heldBy: [],
            spec: asJson(spec),
            requires: [jobFeature(registration.executor)],
            result: null,
            exitCode: null,
            sha: null,
            availableAt: null,
            leaseExpiresAt: null,
            dispatchedAt: null,
            startedAt: null,
            finishedAt: null,
            lastActivityAt: null,
            cancelRequestedAt: null,
            cancelledById: null,
            failureReason: null,
            failureDetail: null,
            workDir: null,
            claimFailures: 0,
            createdAt: now,
            updatedAt: now,
          },
        });
        unit.emit({ type: 'job.changed', jobId: id, status: 'queued' });
        unit.emit({ type: 'job.queued', jobId: id, availableAt: null });
        return toJob((await findJobRecord(unit.conn, id))!);
      }, outer),

    cancel: (jobId, byUserId, outer) =>
      tx.run(async (unit) => {
        const job = await require(unit.conn, jobId);
        if (isTerminalJob(job.status)) return toJob(job);
        if (job.status === 'queued') {
          const ended = await finishJob(unit, { clock, kinds }, job, {
            status: 'cancelled',
            reason: 'cancelled',
            ...(byUserId ? { cancelledById: byUserId } : {}),
          });
          return toJob(ended ?? (await require(unit.conn, jobId)));
        }
        if (job.cancelRequestedAt === null) {
          const now = clock.now().toISOString();
          const updated = await jobsRepo(unit.conn).updateMany({
            filter: (f) =>
              f.and([
                f.string('id').eq(job.id),
                f.or(ACTIVE_JOB.map((status) => f.string('status').eq(status))),
                f.date('cancelRequestedAt').empty(),
              ]),
            values: {
              cancelRequestedAt: now,
              cancelledById: byUserId,
              updatedAt: now,
            },
          });
          if (updated.updatedCount === 1)
            unit.emit({
              type: 'job.changed',
              jobId: job.id,
              status: job.status,
            });
        }
        return toJob(await require(unit.conn, jobId));
      }, outer),

    async get(jobId) {
      return toJob(await require(tx.read(), jobId));
    },

    async find(conn, jobId) {
      const record = await findJobRecord(conn, jobId);
      return record ? toJob(record) : null;
    },

    async list(filter = {}) {
      const limit = Math.min(200, Math.max(1, filter.limit ?? 50));
      const records = await jobsRepo(tx.read()).findMany({
        filter: (f) => {
          const parts = [];
          if (filter.status) parts.push(f.string('status').eq(filter.status));
          if (filter.kind) parts.push(f.string('kind').eq(filter.kind));
          if (filter.runnerId)
            parts.push(f.string('runnerId').eq(filter.runnerId));
          if (filter.subjectKind)
            parts.push(f.string('subjectKind').eq(filter.subjectKind));
          if (filter.subjectId)
            parts.push(f.string('subjectId').eq(filter.subjectId));
          if (filter.actorUserId)
            parts.push(f.string('actorUserId').eq(filter.actorUserId));
          if (filter.visibleTo)
            parts.push(
              f.or([
                f.string('actorUserId').eq(filter.visibleTo.userId),
                ...filter.visibleTo.runnerIds.map((id) =>
                  f.string('runnerId').eq(id),
                ),
              ]),
            );
          return f.and(parts);
        },
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
        limit,
      });
      return records.map(toJob);
    },

    async events(jobId, afterSeq = 0, limit = 1000) {
      const conn = tx.read();
      await require(conn, jobId);
      const records = await jobEventsRepo(conn).findMany({
        filter: (f) =>
          f.and([f.string('jobId').eq(jobId), f.number('seq').gt(afterSeq)]),
        sort: (sort) => sort.field('seq').asc(),
        limit: Math.min(5000, Math.max(1, limit)),
      });
      return records.map(toJobEvent);
    },

    watch(jobId, listener) {
      return deps.events.onAny((event) => {
        if (event.type !== 'job.changed' && event.type !== 'job.events') return;
        if (jobId !== null && event.jobId !== jobId) return;
        try {
          listener(
            event.type === 'job.changed'
              ? { type: 'status', jobId: event.jobId, status: event.status }
              : { type: 'events', jobId: event.jobId, lastSeq: event.lastSeq },
          );
        } catch (error) {
          onError(`A job watcher failed for job ${event.jobId}.`, error);
        }
      });
    },

    runner: runnerReports,
    sweep,

    provideSecrets(source) {
      secretSource = source;
      return () => {
        if (secretSource === source) secretSource = undefined;
      };
    },
  };
}

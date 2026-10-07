// One job, start to end, in its own worker process (see supervisor.ts):
//
//   start -> the executor (`build`; jobs/) -> complete | fail | cancelAck
//
// While it works, the lease is renewed every 15 s (the answer carries the cancel flag), its log streams through the
// event spool (redacted first, with the protocol's redactor: the secrets the job carries, which are its secret
// variables, its repository token and its upload headers, the runner key, and the common secret patterns; per output
// stream, so a secret split between two pieces of a line is still caught), and the job's own `timeoutSec` is enforced. Its directory (`<work root>/.jobs/<app>/<jobId>`) is removed
// when it ends.
//
// How a job ends:
// - the executor returns a result: `complete`;
// - it fails (`JobFailure`): `fail` with the reason, the exit code and the commit when known;
// - cancel requested: stop the command, deliver the log, `cancelAck`;
// - its timeout passes: stop the command, `fail(jobTimeout)`;
// - lease lost: stop the command; the job is no longer this runner's, so nothing is reported;
// - SIGTERM (the runner is stopping): stop the command and `fail(runnerOffline)` so the server can requeue it.
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { runnerClient, type AppConnection } from '../lib/config.ts';
import {
  backoff,
  dataOf,
  delay,
  ApiError,
  type ApiClient,
} from '../lib/http.ts';
import { safeName, type RunnerPaths } from '../lib/home.ts';
import {
  createRedactor,
  createStreamRedactor,
  jobSecrets,
  JobLeaseResponseSchema,
  JobStatusResponseSchema,
  RUNNER_ROUTES,
  routePath,
  TERMINAL_RUN_STATUSES,
  type JobEvent,
  type JobFailRequest,
  type JobPayload,
  type JobResult,
  type StreamRedactor,
} from '../protocol/index.ts';
import { EventSpool } from './events.ts';
import { checkIsolation } from './isolation.ts';
import { jobsRoot, runBuild } from './jobs/build.ts';
import { JobFailure, type JobContext, type JobStream } from './jobs/types.ts';
import { LOST_CODES } from './lease.ts';
import { policyFor, readLocalPolicy } from './local-policy.ts';
import {
  jobRecordKey,
  removeRecord,
  writeRecord,
  type RunRecord,
  type Timings,
} from './supervisor.ts';

export interface JobWorkerDeps {
  paths: RunnerPaths;
  /** The registration the job was claimed through. */
  connection: AppConnection;
  log: (message: string) => void;
  /** Overrides the client built from `connection`, for tests. */
  client?: ApiClient;
  /** For uploads; the global `fetch` by default. */
  fetch?: typeof fetch;
}

export type JobWorkerOutcome =
  'completed' | 'failed' | 'cancelled' | 'leaseLost' | 'stopped';

type Ending = 'cancel' | 'lost' | 'shutdown' | 'timeout';

class JobStopped extends Error {
  readonly ending: Ending;

  constructor(ending: Ending) {
    super(`The job was stopped (${ending}).`);
    this.name = 'JobStopped';
    this.ending = ending;
  }
}

/** Where a job of `appKey` works. */
export function jobDir(
  paths: RunnerPaths,
  appKey: string,
  jobId: string,
): string {
  return path.join(jobsRoot(paths.workRoot), safeName(appKey), safeName(jobId));
}

export class JobWorker {
  private readonly payload: JobPayload;
  private readonly timings: Timings;
  private readonly deps: JobWorkerDeps;
  private readonly client: ApiClient;
  private readonly record: RunRecord;
  private readonly controller = new AbortController();
  private ending: Ending | undefined;

  constructor(
    payload: JobPayload,
    timings: Timings,
    deps: JobWorkerDeps,
    record: RunRecord,
  ) {
    this.payload = payload;
    this.timings = timings;
    this.deps = deps;
    this.client = deps.client ?? runnerClient(deps.connection);
    this.record = record;
  }

  private get jobId(): string {
    return this.payload.job.id;
  }

  /** Stops the job for `ending`; the first reason wins. */
  end(ending: Ending): void {
    if (this.ending !== undefined) return;
    this.ending = ending;
    this.controller.abort(new JobStopped(ending));
  }

  /** Asks the server about the job now (the daemon heard of a cancel). */
  async pollStatus(): Promise<void> {
    try {
      const status = await this.client.get(
        routePath(RUNNER_ROUTES.jobStatus, { jobId: this.jobId }),
        JobStatusResponseSchema,
        { timeoutMs: 10_000 },
      );
      if (status.cancelRequested) this.end('cancel');
      else if (TERMINAL_RUN_STATUSES.includes(status.status)) this.end('lost');
    } catch (error) {
      if (error instanceof ApiError && LOST_CODES.has(error.reason))
        this.end('lost');
    }
  }

  private async renewLease(): Promise<void> {
    try {
      const lease = await this.client.post(
        routePath(RUNNER_ROUTES.jobLease, { jobId: this.jobId }),
        {},
        JobLeaseResponseSchema,
        { timeoutMs: 10_000 },
      );
      if (lease.cancelRequested) this.end('cancel');
    } catch (error) {
      if (error instanceof ApiError && LOST_CODES.has(error.reason))
        this.end('lost');
      else
        this.deps.log(
          `job ${this.jobId}: lease renewal failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
  }

  /** POSTs `body`, retrying transient failures until the report deadline. */
  private async report(route: string, body: unknown): Promise<unknown> {
    const deadline = Date.now() + (this.timings.reportTimeoutMs ?? 10 * 60_000);
    for (let attempt = 0; ; attempt += 1) {
      try {
        return dataOf(await this.client.request('POST', route, body));
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          !error.transient ||
          Date.now() > deadline
        )
          throw error;
        this.deps.log(
          `job ${this.jobId}: report failed (${error.reason}); retrying`,
        );
        await delay(backoff(attempt, 500, 10_000));
      }
    }
  }

  private async updateRecord(patch: Partial<RunRecord>): Promise<void> {
    Object.assign(this.record, patch);
    await writeRecord(this.deps.paths, this.record).catch(() => undefined);
  }

  async run(): Promise<JobWorkerOutcome> {
    const { paths, log } = this.deps;
    const { job } = this.payload;
    const dir = jobDir(paths, this.record.appKey, job.id);
    const redactor = createRedactor([
      ...jobSecrets(this.payload),
      this.deps.connection.runnerKey,
    ]);
    const spool = EventSpool.open<JobEvent>({
      runsDir: paths.runsDir,
      runId: jobRecordKey(job.id),
      route: routePath(RUNNER_ROUTES.jobEvents, { jobId: job.id }),
      client: this.client,
      firstSeq: job.firstSeq,
      ...(this.timings.eventFlushMs === undefined
        ? {}
        : { flushIntervalMs: this.timings.eventFlushMs }),
      onFatal: (error) => {
        if (LOST_CODES.has(error.reason)) this.end('lost');
      },
      log,
    });
    spool.start();
    const streams = new Map<JobStream, StreamRedactor>();
    const jobLog = (stream: JobStream, text: string, partial = false): void => {
      let redact = streams.get(stream);
      if (redact === undefined) {
        redact = createStreamRedactor(redactor);
        streams.set(stream, redact);
      }
      const content = redact.write(text, { partial });
      if (content !== '') spool.push({ type: 'log', stream, content });
    };
    // What each stream still holds back, once nothing more comes.
    const endStreams = (): void => {
      for (const [stream, redact] of streams) {
        const content = redact.end();
        if (content !== '') spool.push({ type: 'log', stream, content });
      }
    };
    const push = (event: Omit<JobEvent, 'seq' | 'at'>): void => {
      spool.push({
        ...event,
        ...(event.content === undefined
          ? {}
          : { content: redactor.text(event.content) }),
      });
    };
    const context: JobContext = {
      paths,
      appKey: this.record.appKey,
      jobId: job.id,
      server: this.deps.connection.registration.server,
      jobDir: dir,
      signal: this.controller.signal,
      log: jobLog,
      phase: (name: string) => push({ type: 'phase', phase: name }),
      setCommandGroup: (pgid) =>
        this.updateRecord(
          pgid === undefined
            ? { commandPgid: undefined }
            : { commandPgid: pgid },
        ),
      ...(this.deps.fetch ? { fetch: this.deps.fetch } : {}),
    };
    const timers: NodeJS.Timeout[] = [];
    const drain = () => {
      endStreams();
      return spool.drain(this.timings.reportTimeoutMs ?? 60_000);
    };

    try {
      await rm(dir, { recursive: true, force: true });
      await this.updateRecord({ phase: 'running', workDir: dir });
      const started = JobLeaseResponseSchema.parse(
        await this.report(
          routePath(RUNNER_ROUTES.jobStart, { jobId: job.id }),
          { workDir: dir },
        ),
      );
      if (started.cancelRequested) this.end('cancel');
      timers.push(
        setInterval(
          () => void this.renewLease(),
          this.timings.leaseIntervalMs ?? 15_000,
        ),
        setTimeout(() => this.end('timeout'), job.spec.timeoutSec * 1000),
      );
      if (this.payload.title) jobLog('runner', this.payload.title);

      if (this.ending !== undefined) throw new JobStopped(this.ending);
      // The build's command runs as the owner's local policy says: as this runner's user, or isolated.
      const policy = policyFor(
        await readLocalPolicy(paths),
        this.record.appKey,
      );
      const check = await checkIsolation(policy.isolation);
      if ('problem' in check)
        throw new JobFailure(
          'policyRefused',
          `The runner cannot isolate the build: ${check.problem}`,
        );
      const result: JobResult = await runBuild(
        { ...context, isolation: check.isolation },
        job.spec,
      );
      if (this.ending !== undefined) throw new JobStopped(this.ending);

      await this.updateRecord({ phase: 'reporting' });
      await drain();
      await this.report(
        routePath(RUNNER_ROUTES.jobComplete, { jobId: job.id }),
        { result },
      );
      log(`job ${job.id}: completed`);
      return 'completed';
    } catch (caught) {
      for (const timer of timers) clearInterval(timer);
      if (caught instanceof ApiError && LOST_CODES.has(caught.reason)) {
        log(`job ${job.id}: this runner no longer holds it (${caught.reason})`);
        return 'leaseLost';
      }
      const ending =
        this.ending ??
        (caught instanceof JobStopped ? caught.ending : undefined);
      try {
        await this.updateRecord({ phase: 'reporting' });
        if (ending === 'lost') {
          log(`job ${job.id}: this runner no longer holds it; stopped`);
          return 'leaseLost';
        }
        if (ending === 'cancel') {
          jobLog('runner', 'Cancelled.');
          await drain();
          await this.report(
            routePath(RUNNER_ROUTES.jobCancelAck, { jobId: job.id }),
            {},
          );
          log(`job ${job.id}: cancelled`);
          return 'cancelled';
        }
        const failure: JobFailRequest =
          ending === 'shutdown'
            ? {
                reason: 'runnerOffline',
                detail: 'The runner stopped while the job ran.',
              }
            : ending === 'timeout'
              ? {
                  reason: 'jobTimeout',
                  detail: `The job ran longer than its ${job.spec.timeoutSec} s and was stopped.`,
                }
              : caught instanceof JobFailure
                ? {
                    reason: caught.reason,
                    detail: redactor.text(caught.message).slice(0, 10_000),
                    ...(caught.exitCode === undefined
                      ? {}
                      : { exitCode: caught.exitCode }),
                    ...(caught.sha === undefined ? {} : { sha: caught.sha }),
                  }
                : {
                    reason: 'unknown',
                    detail: redactor
                      .text(
                        caught instanceof Error
                          ? caught.message
                          : String(caught),
                      )
                      .slice(0, 10_000),
                  };
        push({ type: 'error', content: failure.detail ?? failure.reason });
        await drain();
        await this.report(
          routePath(RUNNER_ROUTES.jobFail, { jobId: job.id }),
          failure,
        );
        log(`job ${job.id}: ${failure.reason}`);
        return ending === 'shutdown' ? 'stopped' : 'failed';
      } catch (error) {
        if (error instanceof ApiError && LOST_CODES.has(error.reason)) {
          log(`job ${job.id}: already ended on the server (${error.reason})`);
          return 'leaseLost';
        }
        throw error;
      }
    } finally {
      for (const timer of timers) clearInterval(timer);
      spool.stop();
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      await spool.remove();
      await removeRecord(paths, jobRecordKey(job.id));
    }
  }
}

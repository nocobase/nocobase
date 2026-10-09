// Runs each claimed run in its own worker process and keeps a record of it on disk.
//
// A worker is spawned detached, so it leads a new process group, and everything the agent's tool starts stays in that
// group. Stopping a run signals the whole group: SIGTERM, then SIGKILL after 5 s. When a worker exits, whatever it left
// in its group is killed.
//
// The record `<runsDir>/<runId>.json` exists from the spawn until the worker has reported the run's end. A record whose
// worker is gone, or whose worker outlived its daemon, is an orphan: on start the daemon kills the worker's group,
// replays its event spool, reports the run as failed with `leaseExpired` to the application it came from, and deletes
// its credentials file.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { closeSync, mkdirSync, openSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

import {
  readJson,
  runLogPath,
  safeName,
  writeJsonAtomic,
  type RunnerPaths,
} from '../lib/home.ts';
import { delay, ApiError, type ApiClient } from '../lib/http.ts';
import {
  RUNNER_ROUTES,
  routePath,
  type AgentTool,
  type JobPayload,
  type RunPayload,
} from '../protocol/index.ts';
import { deleteRunCredentials } from '../agent/credentials.ts';
import { EventSpool, spoolPaths } from './events.ts';
import { LOST_CODES } from './lease.ts';

export interface RunRecord {
  /** The run's id; for a job, `jobRecordKey(jobId)`. */
  runId: string;
  /** Set for a job (job-worker.ts); a run's record has none. */
  kind?: 'job';
  jobId?: string;
  /** A job's command runs in a process group of its own: stopped with the worker's. */
  commandPgid?: number;
  /** The registration (`apps/<key>.json`) the run was claimed through. */
  appKey: string;
  attempt: number;
  /** The first event `seq` of this attempt (`RunPayload.run.firstSeq`). */
  firstSeq: number;
  pid: number;
  startedAt: string;
  workDir?: string;
  /** The run's CLI credentials file, once written. */
  credentialsFile?: string;
  /** `spawned`, the name of the preparation step under way (prepare/index.ts), `running` or `reporting`. */
  phase: 'spawned' | 'running' | 'reporting' | (string & {});
  log: string;
}

export interface Timings {
  heartbeatIntervalMs?: number;
  pollTimeoutMs?: number;
  /** An empty claim answered sooner than this means the server does not long-poll: wait out the rest. */
  pollFallbackMs?: number;
  /** With several applications, how long a round of claims that found no work waits before the next. */
  rotationIntervalMs?: number;
  leaseIntervalMs?: number;
  statusIntervalMs?: number;
  eventFlushMs?: number;
  /** How long a worker keeps retrying to deliver events and its final report. */
  reportTimeoutMs?: number;
  /** After a cancel reaches the daemon, how long the worker has to stop on its own. */
  cancelGraceMs?: number;
  /** SIGTERM to SIGKILL. */
  killGraceMs?: number;
}

/** What a worker reads from its stdin: a run, or a job (`kind: 'job'`). */
export type WorkerJob =
  | { kind?: 'run'; appKey: string; payload: RunPayload; timings: Timings }
  | { kind: 'job'; appKey: string; payload: JobPayload; timings: Timings };

/** The name of a job's record, spool and log on the runner: apart from run records. */
export function jobRecordKey(jobId: string): string {
  return `job-${jobId}`;
}

export function recordPath(paths: RunnerPaths, runId: string): string {
  return path.join(paths.runsDir, `${safeName(runId)}.json`);
}

export async function writeRecord(
  paths: RunnerPaths,
  record: RunRecord,
): Promise<void> {
  await writeJsonAtomic(recordPath(paths, record.runId), record);
}

export async function readRecords(paths: RunnerPaths): Promise<RunRecord[]> {
  const entries = await readdir(paths.runsDir).catch(() => [] as string[]);
  const records: RunRecord[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const record = await readJson<RunRecord>(
      path.join(paths.runsDir, entry),
    ).catch(() => undefined);
    if (record?.runId !== undefined) records.push(record);
  }
  return records;
}

export async function removeRecord(
  paths: RunnerPaths,
  runId: string,
): Promise<void> {
  await rm(recordPath(paths, runId), { force: true });
}

// ---------------------------------------------------------------------------------------------------------------
// Processes

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export function groupAlive(pgid: number): boolean {
  try {
    process.kill(-pgid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function signalGroup(pgid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pgid, signal);
  } catch {
    // Already gone.
  }
}

/**
 * SIGTERM to the group, SIGKILL after `graceMs` if anything in it is left; with no grace, SIGKILL only. Resolves once
 * the group is gone.
 */
export async function killGroup(pgid: number, graceMs = 5_000): Promise<void> {
  if (!groupAlive(pgid)) return;
  if (graceMs > 0) signalGroup(pgid, 'SIGTERM');
  const deadline = Date.now() + graceMs;
  while (groupAlive(pgid) && Date.now() < deadline) await delay(100);
  if (!groupAlive(pgid)) return;
  signalGroup(pgid, 'SIGKILL');
  const hardDeadline = Date.now() + 5_000;
  while (groupAlive(pgid) && Date.now() < hardDeadline) await delay(50);
}

/** The marker on a worker's command line, which tells it apart from an unrelated process that reused its pid. */
export function workerMarker(runId: string): string {
  return `--nocobase-runner-run=${runId}`;
}

export function isOurWorker(pid: number, runId: string): boolean {
  try {
    const command = execFileSync('ps', ['-o', 'command=', '-p', String(pid)], {
      encoding: 'utf8',
    });
    return command.includes(workerMarker(runId));
  } catch {
    return false;
  }
}

/** The worker script, with the resolve hooks the command itself runs with (this package's bin/source-hooks.js). */
export function workerEntry(): string[] {
  const extension = import.meta.filename.endsWith('.ts') ? 'ts' : 'js';
  return [
    '--import',
    path.resolve(import.meta.dirname, '../../bin/source-hooks.js'),
    path.join(import.meta.dirname, `worker-main.${extension}`),
  ];
}

// ---------------------------------------------------------------------------------------------------------------
// The supervisor

export interface SupervisedRun {
  /** The record key: the run's id, or `jobRecordKey(jobId)`. */
  runId: string;
  /** Set for a job. */
  jobId?: string;
  /** The coding tool a run runs with; none for a job, or for a run recovered from an earlier daemon. */
  tool?: AgentTool;
  appKey: string;
  pid: number;
  startedAt: string;
  child: ChildProcess;
  exited: Promise<void>;
  cancelSeenAt?: number;
}

export interface SupervisorOptions {
  paths: RunnerPaths;
  /** The client of a registration, by its key. */
  clientFor: (appKey: string) => ApiClient | undefined;
  timings: Timings;
  log: (message: string) => void;
  /** Called when a worker exits and its slot is free again. */
  onExit?: (runId: string) => void;
}

export class Supervisor {
  private readonly options: SupervisorOptions;
  readonly runs: Map<string, SupervisedRun> = new Map();

  constructor(options: SupervisorOptions) {
    this.options = options;
  }

  get size(): number {
    return this.runs.size;
  }

  async spawn(appKey: string, payload: RunPayload): Promise<SupervisedRun> {
    const supervised = await this.start(
      {
        runId: payload.run.id,
        appKey,
        attempt: payload.run.attempt,
        firstSeq: payload.run.firstSeq,
      },
      { appKey, payload, timings: this.options.timings },
    );
    supervised.tool = payload.tool.kind;
    return supervised;
  }

  /** How many runs of `tool` it supervises now. */
  heldOf(tool: AgentTool): number {
    let count = 0;
    for (const run of this.runs.values()) if (run.tool === tool) count += 1;
    return count;
  }

  /** Runs a claimed job in a worker of its own, like a run. */
  spawnJob(appKey: string, payload: JobPayload): Promise<SupervisedRun> {
    return this.start(
      {
        runId: jobRecordKey(payload.job.id),
        kind: 'job',
        jobId: payload.job.id,
        appKey,
        attempt: payload.job.attempt,
        firstSeq: payload.job.firstSeq,
      },
      { kind: 'job', appKey, payload, timings: this.options.timings },
    );
  }

  private async start(
    record: Pick<
      RunRecord,
      'runId' | 'kind' | 'jobId' | 'appKey' | 'attempt' | 'firstSeq'
    >,
    job: WorkerJob,
  ): Promise<SupervisedRun> {
    const { paths, log } = this.options;
    const { runId, appKey } = record;
    const noun = record.kind === 'job' ? 'job' : 'run';
    const label = record.jobId ?? runId;
    const logFile = runLogPath(paths, runId);
    mkdirSync(path.dirname(logFile), { recursive: true, mode: 0o700 });
    const fd = openSync(logFile, 'a', 0o600);
    const child = spawn(
      process.execPath,
      [...workerEntry(), workerMarker(runId)],
      {
        detached: true,
        stdio: ['pipe', fd, fd],
        env: {
          ...process.env,
          NOCOBASE_RUNNER_HOME: paths.home,
          NOCOBASE_RUNNER_WORK_ROOT: paths.workRoot,
        },
      },
    );
    closeSync(fd);
    const pid = child.pid;
    if (pid === undefined)
      throw new Error(`Could not start a worker for ${noun} ${label}`);
    const startedAt = new Date().toISOString();
    // The record exists before the worker reads its job, so it can never finish before it is recorded.
    await writeRecord(paths, {
      ...record,
      pid,
      startedAt,
      phase: 'spawned',
      log: logFile,
    });
    const exited = new Promise<void>((resolve) => {
      child.on('exit', (code, signal) => {
        log(`${noun} ${label}: worker ${pid} exited (${signal ?? code})`);
        // Whatever the worker left in its group goes with it.
        void killGroup(pid, 0).finally(async () => {
          const cancelled = this.runs.get(runId)?.cancelSeenAt !== undefined;
          this.runs.delete(runId);
          await this.afterExit(runId, cancelled);
          this.options.onExit?.(runId);
          resolve();
        });
      });
    });
    child.stdin?.on('error', () => undefined);
    child.stdin?.end(JSON.stringify(job));
    const supervised: SupervisedRun = {
      runId,
      ...(record.jobId === undefined ? {} : { jobId: record.jobId }),
      appKey,
      pid,
      startedAt,
      child,
      exited,
    };
    this.runs.set(runId, supervised);
    log(`${noun} ${label}: worker ${pid} started`);
    return supervised;
  }

  /**
   * A worker that exits without having reported its run is handled like an orphan; one killed after a cancel has its
   * cancel acknowledged instead.
   */
  private async afterExit(runId: string, cancelled: boolean): Promise<void> {
    const record = await readJson<RunRecord>(
      recordPath(this.options.paths, runId),
    ).catch(() => undefined);
    if (record === undefined) return;
    const noun = record.kind === 'job' ? 'job' : 'run';
    await recoverRun(record, {
      ...this.options,
      reason: cancelled ? 'cancelled' : 'leaseExpired',
      detail: cancelled
        ? `The ${noun} worker did not stop after the cancel and was killed.`
        : `The ${noun} worker exited without reporting the ${noun}.`,
    });
  }

  /**
   * The server asked to cancel: wake the worker so it notices now, and kill its group if it has not stopped on its own
   * after the grace period.
   */
  async enforceCancel(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run === undefined || run.cancelSeenAt !== undefined) return;
    run.cancelSeenAt = Date.now();
    try {
      process.kill(run.pid, 'SIGUSR2');
    } catch {
      return;
    }
    const grace = this.options.timings.cancelGraceMs ?? 8_000;
    const stopped = await Promise.race([
      run.exited.then(() => true),
      delay(grace).then(() => false),
    ]);
    if (stopped) return;
    this.options.log(
      `run ${runId}: worker did not stop within ${grace} ms of the cancel; killing its process group`,
    );
    await killGroup(run.pid, this.options.timings.killGraceMs ?? 5_000);
    await run.exited;
  }

  /** The server no longer gives this runner the run (it ended, or went back to the queue): stop it, report nothing. */
  async release(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run === undefined) return;
    this.options.log(
      `run ${runId}: released by the server; stopping its worker`,
    );
    await killGroup(run.pid, this.options.timings.killGraceMs ?? 5_000);
    await run.exited;
  }

  /** Stops every worker: each reports its run as failed with `runnerOffline` so the server can requeue it. */
  async stopAll(timeoutMs = 10_000): Promise<void> {
    const runs = [...this.runs.values()];
    for (const run of runs) {
      try {
        process.kill(run.pid, 'SIGTERM');
      } catch {
        // Already gone.
      }
    }
    await Promise.all(
      runs.map(async (run) => {
        const stopped = await Promise.race([
          run.exited.then(() => true),
          delay(timeoutMs).then(() => false),
        ]);
        if (!stopped) {
          await killGroup(run.pid, this.options.timings.killGraceMs ?? 5_000);
          await run.exited;
        }
      }),
    );
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Orphans

export interface RecoverOptions {
  paths: RunnerPaths;
  clientFor: (appKey: string) => ApiClient | undefined;
  timings: Timings;
  log: (message: string) => void;
  /** `cancelled` acknowledges the cancel instead of failing the run. */
  reason: 'leaseExpired' | 'runnerOffline' | 'cancelled';
  detail: string;
}

/**
 * Ends a run whose worker is gone or no longer supervised: kills what is left of its process group, delivers the
 * events it spooled, reports the run as failed, and removes its credentials, spool and record.
 */
export async function recoverRun(
  record: RunRecord,
  options: RecoverOptions,
): Promise<void> {
  const { paths, log } = options;
  const { runId } = record;
  if (
    groupAlive(record.pid) &&
    (isOurWorker(record.pid, runId) || !isAlive(record.pid))
  ) {
    // SIGKILL straight away: a worker given SIGTERM would report the run itself, as runnerOffline.
    log(`run ${runId}: killing orphaned process group ${record.pid}`);
    await killGroup(record.pid, 0);
  }
  if (record.commandPgid !== undefined && groupAlive(record.commandPgid)) {
    log(`${runId}: killing the job's command group ${record.commandPgid}`);
    await killGroup(record.commandPgid, 0);
  }
  if (record.credentialsFile !== undefined)
    await deleteRunCredentials(record.credentialsFile);
  // A job's directory is its own and goes with it.
  if (record.kind === 'job' && record.workDir !== undefined)
    await rm(record.workDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
  const job = record.kind === 'job' && record.jobId !== undefined;
  const routes = job
    ? {
        events: routePath(RUNNER_ROUTES.jobEvents, { jobId: record.jobId! }),
        fail: routePath(RUNNER_ROUTES.jobFail, { jobId: record.jobId! }),
        cancelAck: routePath(RUNNER_ROUTES.jobCancelAck, {
          jobId: record.jobId!,
        }),
      }
    : {
        events: routePath(RUNNER_ROUTES.events, { runId }),
        fail: routePath(RUNNER_ROUTES.fail, { runId }),
        cancelAck: routePath(RUNNER_ROUTES.cancelAck, { runId }),
      };
  const client = options.clientFor(record.appKey);
  if (client === undefined) {
    // The registration is gone: nobody to report to.
    log(`run ${runId}: its application is no longer registered; dropping it`);
    const files = spoolPaths(paths.runsDir, runId);
    await rm(files.spool, { force: true });
    await rm(files.ack, { force: true });
    await removeRecord(paths, runId);
    return;
  }
  const spool = EventSpool.open<{
    seq: number;
    at: string;
    type: string;
    content?: string;
    stream?: string;
    meta?: Record<string, unknown>;
  }>({
    runsDir: paths.runsDir,
    runId,
    route: routes.events,
    client,
    firstSeq: record.firstSeq,
    log,
  });
  spool.push(
    job
      ? { type: 'log', stream: 'runner', content: options.detail }
      : { type: 'status', content: options.detail, meta: { orphaned: true } },
  );
  const delivered = await spool.drain(
    options.timings.reportTimeoutMs ?? 30_000,
  );
  try {
    if (options.reason === 'cancelled')
      await client.request('POST', routes.cancelAck, {});
    else
      await client.request('POST', routes.fail, {
        reason: options.reason,
        detail: options.detail,
      });
    log(`run ${runId}: reported as failed (${options.reason})`);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (LOST_CODES.has(error.reason) || error.status === 404)
    ) {
      log(`run ${runId}: already ended on the server (${error.reason})`);
    } else {
      // Leave the record for the next start to try again.
      log(
        `run ${runId}: could not report the orphan: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
  }
  if (delivered || spool.failure !== undefined) await spool.remove();
  await removeRecord(paths, runId);
  const files = spoolPaths(paths.runsDir, runId);
  if (!delivered && spool.failure === undefined)
    log(`run ${runId}: undelivered events kept in ${files.spool}`);
}

export async function recoverOrphans(
  options: Omit<RecoverOptions, 'reason' | 'detail'>,
): Promise<string[]> {
  const records = await readRecords(options.paths);
  const recovered: string[] = [];
  for (const record of records) {
    await recoverRun(record, {
      ...options,
      reason: 'leaseExpired',
      detail:
        record.kind === 'job'
          ? 'The runner restarted; the job it left behind was stopped.'
          : 'The runner restarted; the run it left behind was stopped.',
    });
    recovered.push(record.runId);
  }
  return recovered;
}

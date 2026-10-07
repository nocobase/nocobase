// What a job's executor is given and how it reports failure. An executor (`build`) does the job's work
// and returns its result; the job worker (job-worker.ts) holds the lease, streams the log, enforces the timeout and
// reports the outcome.
import type { JobFailureReason } from '../../protocol/index.ts';
import type { RunnerPaths } from '../../lib/home.ts';
import type { Isolation } from '../isolation.ts';

export type JobStream = 'stdout' | 'stderr' | 'runner';

export interface JobContext {
  readonly paths: RunnerPaths;
  /** The registration the job was claimed through. */
  readonly appKey: string;
  readonly jobId: string;
  /** The application's address, for upload URLs given as a path. */
  readonly server: string;
  /** The job's own directory (checkout, home, tmp), removed when the job ends. */
  readonly jobDir: string;
  /** Aborted when the job is cancelled, times out, loses its lease or the runner stops. */
  readonly signal: AbortSignal;
  /**
   * A line (or lines) for the job's log; secrets are redacted before it is kept. `partial`: the text ends inside a line
   * that continues in the next call, so a secret split between them is still caught.
   */
  log(stream: JobStream, text: string, partial?: boolean): void;
  /** A step started. */
  phase(name: string): void;
  /** Records the command's process group, so a runner that restarts can stop what it left behind. */
  setCommandGroup(pgid: number | undefined): Promise<void>;
  /** How the job's own command is started: as the runner's user, or as the policy's isolated user. */
  readonly isolation?: Isolation;
  readonly fetch?: typeof fetch;
}

/** A job that ended without a result: why, with what the runner knows. */
export class JobFailure extends Error {
  override name = 'JobFailure';
  readonly reason: JobFailureReason;
  readonly exitCode: number | undefined;
  readonly sha: string | undefined;

  constructor(
    reason: JobFailureReason,
    message: string,
    facts: { exitCode?: number; sha?: string } = {},
  ) {
    super(message);
    this.reason = reason;
    this.exitCode = facts.exitCode;
    this.sha = facts.sha;
  }
}

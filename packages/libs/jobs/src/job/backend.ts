import type { ResolvedJobsConfig } from '../config.js';
import type { JobExecutionContext, JobReceipt } from './types.js';

export interface JobSubmission {
  readonly jobName: string;
  readonly payload: unknown;
}

export interface JobRun extends JobExecutionContext {
  readonly payload: unknown;
}

export interface JobRunner {
  /** Rejects missing handlers and normal failures; normalizes shutdown interruption. */
  run(run: JobRun): Promise<void>;
}

export interface JobBackend {
  open(): Promise<void>;
  enqueue(job: JobSubmission): Promise<JobReceipt>;
  consume(runner: JobRunner): Promise<void>;
  /** Safe after partial open failure; never writes unread or corrupt state. */
  close(): Promise<void>;
}

/**
 * The slash excludes this name from the valid Schedule scope domain. The
 * configuration key is deliberately absent: renaming a key, or moving from the
 * built-in default to an explicit one, must not strand waiting tasks.
 */
export function jobQueueName(
  config: Pick<ResolvedJobsConfig, 'scope'>,
): string {
  return `jobs/${Buffer.from(JSON.stringify([config.scope])).toString('base64url')}`;
}

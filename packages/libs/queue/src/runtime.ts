import type { ResolvedQueueConfig } from './config.js';
import type { DispatchOutcome, DispatchedJob } from './consumer.js';
import type { PreparedJob } from './message.js';
import type { QueueLogger, RateLimitOptions } from './types.js';

/** The only handler capability a backend receives. */
export interface QueueDispatch {
  dispatch(job: DispatchedJob, signal?: AbortSignal): Promise<DispatchOutcome>;
}
/** What an implementation knows about the queue it backs. */
export interface QueueRuntimeContext {
  /** The logical queue name. */
  readonly queue: string;
  readonly config: ResolvedQueueConfig;
  readonly dispatcher: QueueDispatch;
  readonly logger: QueueLogger;
}

/**
 * One logical queue on one implementation. The service owns the order of
 * calls: `open` first, `close` on failure/shutdown and again after late initialization.
 */
export interface QueueRuntime {
  /** Prepares the backend or reads the state file. */
  open(): Promise<void>;
  /** Writes prepared jobs and returns their IDs, the existing ID for a duplicate. */
  add(jobs: readonly PreparedJob[]): Promise<string[]>;
  /** Starts or resumes taking jobs. */
  startConsuming(concurrency: number): Promise<void>;
  /** Stops taking new jobs without waiting for running ones. */
  pauseConsuming(): Promise<void>;
  setConcurrency(concurrency: number): void;
  setRateLimit(rateLimit: RateLimitOptions | null): Promise<void>;
  drain(delayed: boolean): Promise<void>;
  /** Stops taking jobs and resolves once running jobs have settled. */
  stopConsuming(): Promise<void>;
  /** Releases what `open` acquired. Safe after a failed or unfinished `open`. */
  close(): Promise<void>;
}

export interface QueueImplementation {
  /** Checks backend configuration without connecting or acquiring resources. */
  validateConfig(config: ResolvedQueueConfig): void;
  createRuntime(context: QueueRuntimeContext): QueueRuntime;
}

import type { ResolvedQueueConfig } from './config.js';
import type { QueueDispatcher } from './consumer.js';
import type { PreparedJob } from './message.js';
import type { QueueLogger, RateLimitOptions } from './types.js';

/** What an implementation knows about the queue it backs. */
export interface QueueRuntimeContext {
  /** The logical queue name. */
  readonly queue: string;
  readonly config: ResolvedQueueConfig;
  readonly dispatcher: QueueDispatcher;
  readonly logger: QueueLogger;
}

/**
 * One logical queue on one implementation. The service owns the order of
 * calls: `open` first, `close` last and once, the rest in between.
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
  createRuntime(context: QueueRuntimeContext): QueueRuntime;
}

import type { JobsImplementation } from './adapters.js';
import type { ResolvedJobsConfig } from './config.js';
import type { JobExecutor } from './job/types.js';
import type { ScheduleExecutor } from './schedule/types.js';

/**
 * Hands out one private executor per consumer. `scope` identifies the consumer
 * — by convention its package name — and becomes the BullMQ queue name or the
 * memory adapter's state file name; `name` selects a configuration key.
 */
export interface JobExecutorService {
  /** Registers pure configuration parsing and paired factories without opening resources. */
  registerImplementation<TConfig extends ResolvedJobsConfig>(
    name: string,
    implementation: JobsImplementation<TConfig>,
  ): void;
  getScheduleExecutor(scope: string, name?: string): ScheduleExecutor;
  getJobExecutor(scope: string, name?: string): JobExecutor;
  /**
   * What the service runs on: configured backends by name and adapter, and the consumers that selected a backend
   * other than the default. Never includes a backend's options. Optional so that test doubles need not implement it.
   */
  describe?(): JobsDescription;
}

/**
 * Whether a backend's state is visible to every instance of the application (`shared`) or only to the process that
 * holds it (`local`). An implementation that does not declare it is reported as `unknown`.
 */
export type JobsBackendSharing = 'local' | 'shared' | 'unknown';

export interface JobsBackendDescription {
  readonly name: string;
  readonly adapter: string;
  readonly sharing: JobsBackendSharing;
  readonly registered: boolean;
}

export interface JobsSelection {
  /** The consumer's scope, by convention its package name. */
  readonly consumer: string;
  readonly backend: string;
}

export interface JobsDescription {
  /** The configured default backend; `null` when `jobs.default` is unset and the built-in memory backend runs. */
  readonly default: string | null;
  readonly adapter: string;
  readonly sharing: JobsBackendSharing;
  readonly registered: boolean;
  readonly backends: readonly JobsBackendDescription[];
  readonly selections: readonly JobsSelection[];
}

export type Unsubscribe = () => void;

/**
 * The structural subset of a logger this package writes to. A pino logger,
 * which `@nocobase/logging` provides, satisfies it.
 */
export interface JobsLogger {
  debug(bindings: Record<string, unknown>, message: string): void;
  info(bindings: Record<string, unknown>, message: string): void;
  warn(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
}

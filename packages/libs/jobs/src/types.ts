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
  /** Registers pure configuration parsing and paired factories before setup. */
  registerImplementation<TConfig extends ResolvedJobsConfig>(
    name: string,
    implementation: JobsImplementation<TConfig>,
  ): void;
  /** Freezes registration and validates the default; opens no executor resources. */
  setup(): void;
  getScheduleExecutor(scope: string, name?: string): ScheduleExecutor;
  getJobExecutor(scope: string, name?: string): JobExecutor;
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

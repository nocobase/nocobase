import type { JobExecutor } from './job/types.js';
import type { ScheduleExecutor } from './schedule/types.js';

/**
 * Hands out one private executor per consumer. `scope` identifies the consumer
 * — by convention its package name — and becomes the BullMQ queue name or the
 * memory adapter's state file name; `name` selects a configuration key.
 */
export interface JobExecutorService {
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

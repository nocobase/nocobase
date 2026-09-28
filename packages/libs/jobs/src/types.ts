/**
 * Hands out one private executor per consumer. `scope` identifies the consumer
 * — by convention its package name — and becomes the BullMQ queue name or the
 * memory adapter's state file name; `name` selects a configuration key.
 */
export interface JobExecutorService {
  getScheduleExecutor(scope: string, name?: string): ScheduleExecutor;
}

export interface ScheduleExecutor {
  /**
   * Adds or updates a job and registers its handler. With `registerOnly` the
   * handler is registered and the backend is neither read nor written.
   */
  addJob<TPayload = unknown>(
    job: ScheduleJob<TPayload>,
    registerOnly?: boolean,
  ): Promise<ScheduleReceipt>;
  /** Removes a job's rule and its pending firing; its handler stays registered. */
  removeJob(name: string): Promise<ScheduleReceipt>;
  countJob(): Promise<number>;
  /** Lists jobs by next firing time; `start` and `end` are inclusive offsets. */
  listJob(start: number, end: number): Promise<JobScheduler[]>;
  getJob(name: string): Promise<JobScheduler | undefined>;
  /** Subscribes to firings executed by this instance; nothing is broadcast. */
  subscribe(subscriber: Subscriber): Unsubscribe;
  setup(options?: ScheduleSetupOptions): Promise<void>;
  /** Stops executing and releases resources. Rules stay in the backend. */
  shutdown(): Promise<void>;
}

export interface ScheduleSetupOptions {
  /** `false` writes rules without starting execution. Defaults to `true`. */
  readonly consume?: boolean;
}

export interface ScheduleExecutionContext {
  /** Identifies this firing; the same value as the events' `jobId`. */
  readonly jobId: string;
  /** When this firing was planned to run. */
  readonly scheduledAt: Date;
  /** When this firing actually started. */
  readonly runAt: Date;
  /** The next planned firing, absent when the rule has no further firing. */
  readonly nextRunAt?: Date;
  /** Aborted when the executor shuts down. */
  readonly signal: AbortSignal;
}

export interface ScheduleJob<TPayload = unknown> {
  /** The job's stable identity within its scope; must not contain `:`. */
  readonly name: string;
  readonly options: ScheduleJobOption;
  readonly payload: TPayload;
  execute(context: ScheduleExecutionContext): Promise<void>;
}

export interface ScheduleJobOption {
  readonly cron?: string;
  readonly limit?: number;
  /** Interval in milliseconds. */
  readonly every?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
  /** IANA time zone for `cron`; UTC when omitted. */
  readonly tz?: string;
  /** Fires once on creation, then follows `cron`. Ignored for updates. */
  readonly immediately?: boolean;
}

export const ScheduleReceiptCode: {
  readonly Upserted: 1000;
  readonly Removed: 2000;
  readonly NotExisted: 3000;
  readonly HandlerRegistered: 4000;
} = Object.freeze({
  Upserted: 1000,
  Removed: 2000,
  NotExisted: 3000,
  HandlerRegistered: 4000,
});

export type ScheduleReceiptCode =
  (typeof ScheduleReceiptCode)[keyof typeof ScheduleReceiptCode];

export type ScheduleReceiptMessage =
  'Job upserted' | 'Job removed' | 'Job not existed' | 'Handler registered';

export interface ScheduleReceipt {
  readonly jobName: string;
  readonly code: ScheduleReceiptCode;
  readonly message: ScheduleReceiptMessage;
  /** The next planned firing after this operation, when there is one. */
  readonly scheduledAt?: Date;
}

export interface JobScheduler {
  readonly jobName: string;
  readonly options: ScheduleJobOption;
  readonly payload: unknown;
  readonly nextRunAt?: Date;
}

export type ScheduleEventName =
  'ScheduleStart' | 'ScheduleEnd' | 'ScheduleError';

/**
 * Why a firing failed. `handler-not-registered` means the backend held a rule
 * this instance has no handler for; such a firing is never retried.
 */
export type ScheduleErrorReason = 'handler-not-registered' | 'execute-failed';

export interface ScheduleEvent {
  readonly name: ScheduleEventName;
  readonly jobId: string;
  readonly jobName: string;
  readonly scheduledAt: Date;
  readonly runAt: Date;
  readonly nextRunAt?: Date;
  /** Present on `ScheduleError`. */
  readonly reason?: ScheduleErrorReason;
  /** The failure, present on `ScheduleError`. */
  readonly error?: Error;
}

export type Subscriber = (event: ScheduleEvent) => Promise<void>;
export type Unsubscribe = () => void;

/**
 * The structural subset of a logger this package writes to. A pino logger,
 * which `@nocobase/logging` provides, satisfies it.
 */
export interface ScheduleLogger {
  debug(bindings: Record<string, unknown>, message: string): void;
  info(bindings: Record<string, unknown>, message: string): void;
  warn(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
}

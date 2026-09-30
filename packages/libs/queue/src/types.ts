import type { BackendFactory, ConnectionOptions, JobsOptions } from 'bullmq';

/**
 * The implementation a configuration runs on: `inMemory` for the in-process
 * queue, `redis` for BullMQ.
 */
export type QueueAdapter = 'inMemory' | 'redis';

/** Connection option types, keyed by adapter. */
export interface QueueAdapterConnections {
  /** BullMQ connection options, or what a registered backend factory interprets. */
  redis: ConnectionOptions;
  inMemory: Record<string, never>;
}

/** The connection type of adapter `A`. */
export type QueueConnectionOptions<A extends QueueAdapter> =
  QueueAdapterConnections[A];

/** A job's routing label; BullMQ stores it as `job.name`. */
export type Channel = string;

/** Derives a job ID from the logical queue name, the channel and the original message. */
export type JobIdProducer = (
  queue: string,
  channel: Channel,
  message: unknown,
) => string;

export interface RateLimitOptions {
  /** Jobs every instance together may start per window. */
  readonly max: number;
  /** Window length in milliseconds. */
  readonly duration: number;
}

/**
 * How many finished jobs a queue keeps: `true` removes them at once, `false`
 * keeps all of them, a number keeps that many, and `{ count, age }` bounds by
 * count and by age in seconds.
 */
export type QueueRetentionPolicy = JobsOptions['removeOnComplete'];

/** Retry delay: milliseconds for a fixed delay, or a built-in strategy. */
export type QueueBackoffOptions = JobsOptions['backoff'];

/** One complete queue configuration. Keys never inherit from each other. */
export interface QueueConfigEntry<A extends QueueAdapter = QueueAdapter> {
  readonly adapter: A;
  /**
   * `redis` only: the name of a BullMQ backend factory registered with
   * `registerBackend()`. Omitted, BullMQ's Redis backend is used.
   */
  readonly queueBackend?: string;
  /** Required for `redis` on BullMQ's Redis backend; omitted for `inMemory`. */
  readonly connection?: QueueConnectionOptions<A>;
  /** `inMemory` only: the directory holding the state files. */
  readonly persistence?: { readonly path?: string };
  /** Defaults to the application name. */
  readonly namespace?: string;
  /** Jobs this instance runs at the same time. Defaults to `1`. */
  readonly concurrency?: number;
  /** Written to the backend when set; `null` removes it; omitted leaves it untouched. */
  readonly rateLimit?: RateLimitOptions | null;
  readonly removeOnComplete?: QueueRetentionPolicy;
  readonly removeOnFail?: QueueRetentionPolicy;
  /** Tries per job, the first included. Defaults to `1`. */
  readonly attempts?: number;
  readonly backoff?: QueueBackoffOptions;
  readonly jobIdProducer?: JobIdProducer;
  /** Initialization budget of each queue. Defaults to `10000`. */
  readonly setupTimeoutMs?: number;
  /** Wait for active jobs at shutdown before cancelling them. Defaults to `30000`. */
  readonly shutdownTimeoutMs?: number;
  /** Wait after the shutdown cancellation. Defaults to `5000`. */
  readonly cancellationGraceMs?: number;
}

/**
 * The `queue` configuration section: `default` names the key used when a
 * queue names none or an unknown one; every other key defines one
 * configuration.
 */
export interface QueueConfig {
  readonly default?: string;
  readonly [key: string]: QueueConfigEntry | string | undefined;
}

/**
 * The structural subset of a logger this package writes to. A pino logger,
 * which `@nocobase/logging` provides, satisfies it.
 */
export interface QueueLogger {
  debug(bindings: Record<string, unknown>, message: string): void;
  info(bindings: Record<string, unknown>, message: string): void;
  warn(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
}

/**
 * What the application supplies. The package reads neither application
 * settings nor the process environment itself.
 */
export interface QueueServiceDefaults {
  /** The namespace of every configuration that sets none. */
  readonly appName: string;
  /** `persistence.path` of `inMemory` configurations that set none. */
  readonly storagePath: string;
  /** Receives warnings and failures; `console` is used without one. */
  readonly logger?: QueueLogger;
  /** Called once when a queue runs on the built-in memory configuration. */
  readonly onFallback?: () => void;
}

export interface QueueService {
  /** Registers a BullMQ backend factory for `queueBackend` to name. Only before `setup()` starts. */
  registerBackend(name: string, factory: BackendFactory): void;
  manager(queue: string, configKey?: string): QueueManager;
  producer(queue: string, configKey?: string): QueueProducer;
  consumer(queue: string, configKey?: string): QueueConsumer;
  setup(): Promise<void>;
  /** Stops consuming and releases every queue. Safe to call more than once. */
  shutdown(): Promise<void>;
}

/** Options `manager.configure()` changes on this instance only. */
export type QueueLocalRuntimeOptions = Pick<
  QueueConfigEntry,
  | 'concurrency'
  | 'removeOnComplete'
  | 'removeOnFail'
  | 'attempts'
  | 'backoff'
  | 'jobIdProducer'
>;

export type QueueRuntimeOptions = QueueLocalRuntimeOptions & {
  /** Global across instances; `null` removes it. */
  readonly rateLimit?: RateLimitOptions | null;
};

export interface QueueDrainOptions {
  /** Also removes delayed jobs. Defaults to `false`. */
  readonly delayed?: boolean;
}

export interface QueueManager {
  configure(options: QueueRuntimeOptions): Promise<void>;
  /** Removes waiting jobs of the physical queue, which every instance shares. */
  drain(options?: QueueDrainOptions): Promise<void>;
  /** Signals one job this instance is running; `true` when it was found. */
  cancelJob(jobId: string, reason?: string): boolean;
  /** Signals every job this instance is running for the queue. */
  cancelAllJobs(reason?: string): void;
}

export interface PublishReceipt {
  readonly jobId: string;
}

export interface PublishOptions {
  readonly priority?: JobsOptions['priority'];
  readonly delay?: JobsOptions['delay'];
  readonly attempts?: JobsOptions['attempts'];
  readonly backoff?: QueueBackoffOptions;
  readonly removeOnComplete?: QueueRetentionPolicy;
  readonly removeOnFail?: QueueRetentionPolicy;
  readonly jobIdProducer?: JobIdProducer;
}

export interface PublishEntry {
  readonly channel: Channel;
  readonly message: unknown;
}

export interface QueueProducer {
  publish(
    channel: Channel,
    message: unknown,
    options?: PublishOptions,
  ): Promise<PublishReceipt>;
  /** Prepares every entry before writing any of them. */
  publishMany(
    batches: readonly PublishEntry[],
    options?: PublishOptions,
  ): Promise<PublishReceipt[]>;
}

export type ConsumeHandler<T = unknown> = (
  channel: Channel,
  message: T,
  signal: AbortSignal,
) => Promise<void>;

/** Resolves once every call of the registration already started has settled. */
export type UnregisterHandler = () => Promise<void>;

export interface QueueConsumer {
  consume<T = unknown>(handler: ConsumeHandler<T>): UnregisterHandler;
}

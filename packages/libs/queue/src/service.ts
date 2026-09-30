import { performance } from 'node:perf_hooks';

import { createRedisBackend, type BackendFactory } from 'bullmq';

import {
  BUILT_IN_MEMORY_KEY,
  IN_MEMORY_ADAPTER,
  normalizeQueueConfig,
  queueConfigKeys,
  REDIS_BACKEND,
  resolveQueueConfig,
  selectQueueConfig,
  type ResolvedQueueConfig,
} from './config.js';
import { QueueDispatcher } from './consumer.js';
import { prepareJobs } from './message.js';
import { InMemoryQueueService } from './memory/index.js';
import { assertQueueName } from './naming.js';
import {
  validateRuntimeOptions,
  type QueueJobDefaults,
  type QueueRuntimeChanges,
} from './options.js';
import { RedisQueueImplementation } from './redis/index.js';
import type { QueueImplementation, QueueRuntime } from './runtime.js';
import type {
  ConsumeHandler,
  PublishEntry,
  PublishOptions,
  PublishReceipt,
  QueueConfig,
  QueueConsumer,
  QueueDrainOptions,
  QueueLogger,
  QueueManager,
  QueueProducer,
  QueueRuntimeOptions,
  QueueService,
  QueueServiceDefaults,
  RateLimitOptions,
  UnregisterHandler,
} from './types.js';

/** Budget of one publish, lazy initialization included. */
const PUBLISH_BUDGET_MS = 10_000;
/** Budget of each resource cleanup step. */
const CLEANUP_BUDGET_MS = 5000;

type ServiceState =
  'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';

/**
 * Creates the queue service of one application. It only keeps the
 * configuration: nothing connects before `setup()`.
 */
export function createQueueService(
  config: QueueConfig | undefined,
  defaults: QueueServiceDefaults,
): QueueService {
  return new DefaultQueueService(config, defaults);
}

const consoleLogger: QueueLogger = {
  debug: (bindings, message) => console.debug(message, bindings),
  info: (bindings, message) => console.info(message, bindings),
  warn: (bindings, message) => console.warn(message, bindings),
  error: (bindings, message) => console.error(message, bindings),
};

type Settled<T> =
  | { readonly status: 'fulfilled'; readonly value: T }
  | { readonly status: 'rejected'; readonly reason: unknown }
  | { readonly status: 'timeout' };

/** Waits at most `ms`; the promise keeps running after a timeout. */
function settleWithin<T>(promise: Promise<T>, ms: number): Promise<Settled<T>> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ status: 'timeout' }), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve({ status: 'fulfilled', value });
      },
      (reason: unknown) => {
        clearTimeout(timer);
        resolve({ status: 'rejected', reason });
      },
    );
  });
}

function combine(errors: readonly unknown[], message: string): unknown {
  return errors.length === 1 ? errors[0] : new AggregateError(errors, message);
}

function keyLabel(key: string): string {
  return key === BUILT_IN_MEMORY_KEY
    ? 'the built-in memory configuration'
    : `configuration "${key}"`;
}

/** What a queue needs from the service that owns it. */
interface QueueHost {
  readonly state: ServiceState;
  readonly logger: QueueLogger;
  implementationFor(config: ResolvedQueueConfig): QueueImplementation;
}

class DefaultQueueService implements QueueService, QueueHost {
  public state: ServiceState = 'idle';
  public readonly logger: QueueLogger;
  private readonly config: QueueConfig | undefined;
  private readonly backends = new Map<string, BackendFactory>();
  private readonly slots = new Map<string, QueueSlot>();
  private memory: InMemoryQueueService | undefined;
  private redis: RedisQueueImplementation | undefined;
  private frozen = false;
  private fallbackReported = false;
  private setupPromise: Promise<void> | undefined;
  private shutdownPromise: Promise<void> | undefined;

  public constructor(
    config: QueueConfig | undefined,
    private readonly defaults: QueueServiceDefaults,
  ) {
    this.logger = defaults.logger ?? consoleLogger;
    this.config = normalizeQueueConfig(config, this.logger);
  }

  public registerBackend(name: string, factory: BackendFactory): void {
    if (this.frozen) {
      throw new Error(
        'Queue backends must be registered before the queue service is set up.',
      );
    }
    if (typeof name !== 'string' || name === '') {
      throw new TypeError('A queue backend name must be a non-empty string.');
    }
    if (name === REDIS_BACKEND || this.backends.has(name)) {
      throw new Error(`Queue backend "${name}" is already registered.`);
    }
    if (typeof factory !== 'function') {
      throw new TypeError(`Queue backend "${name}" needs a factory function.`);
    }
    this.backends.set(name, factory);
  }

  public manager(queue: string, configKey?: string): QueueManager {
    return this.slot(queue, configKey).manager;
  }

  public producer(queue: string, configKey?: string): QueueProducer {
    return this.slot(queue, configKey).producer;
  }

  public consumer(queue: string, configKey?: string): QueueConsumer {
    return this.slot(queue, configKey).consumer;
  }

  public setup(): Promise<void> {
    this.setupPromise ??= this.runSetup();
    return this.setupPromise;
  }

  public shutdown(): Promise<void> {
    this.shutdownPromise ??= this.runShutdown();
    return this.shutdownPromise;
  }

  public implementationFor(config: ResolvedQueueConfig): QueueImplementation {
    if (config.adapter === IN_MEMORY_ADAPTER) {
      this.memory ??= new InMemoryQueueService();
      return this.memory;
    }
    this.redis ??= new RedisQueueImplementation((name) =>
      this.backendFactory(name ?? REDIS_BACKEND),
    );
    return this.redis;
  }

  private backendFactory(name: string): BackendFactory {
    if (name === REDIS_BACKEND) return createRedisBackend;
    const factory = this.backends.get(name);
    if (!factory) throw new Error(`Queue backend "${name}" is not registered.`);
    return factory;
  }

  private slot(queue: string, configKey: string | undefined): QueueSlot {
    assertQueueName('queue name', queue);
    if (configKey !== undefined && typeof configKey !== 'string') {
      throw new TypeError('A queue configuration key must be a string.');
    }
    const selection = selectQueueConfig(this.config, configKey);
    const existing = this.slots.get(queue);
    if (existing) {
      if (existing.config.key !== selection.key) {
        throw new Error(
          `Queue "${queue}" is bound to ${keyLabel(existing.config.key)} and cannot also use ${keyLabel(selection.key)}.`,
        );
      }
      return existing;
    }
    if (this.state === 'failed') {
      throw new Error('The queue service failed to set up.');
    }
    if (this.state === 'stopping' || this.state === 'stopped') {
      throw new Error('The queue service has been shut down.');
    }
    const resolved = resolveQueueConfig(selection, this.defaults);
    if (this.frozen) this.assertBackend(resolved);
    const slot = new QueueSlot(this, queue, resolved);
    this.slots.set(queue, slot);
    if (resolved.builtIn && !this.fallbackReported) {
      this.fallbackReported = true;
      this.defaults.onFallback?.();
    }
    return slot;
  }

  private assertBackend(config: ResolvedQueueConfig): void {
    const name = config.queueBackend;
    if (name !== undefined && !this.backends.has(name)) {
      throw new Error(
        `Queue ${keyLabel(config.key)} uses backend "${name}", which is not registered.`,
      );
    }
  }

  /** Checks every key, including those no queue uses yet. */
  private validateConfig(): void {
    selectQueueConfig(this.config, undefined);
    for (const key of queueConfigKeys(this.config)) {
      const entry = this.config?.[key];
      if (typeof entry !== 'object') {
        throw new TypeError(`queue.${key} must be a configuration object.`);
      }
      this.assertBackend(resolveQueueConfig({ key, entry }, this.defaults));
    }
  }

  private async runSetup(): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error('The queue service has been shut down.');
    }
    this.frozen = true;
    this.state = 'starting';
    const slots = [...this.slots.values()];
    try {
      this.validateConfig();
      for (const slot of slots) this.assertBackend(slot.config);
      const opened = await Promise.allSettled(
        slots.map((slot) => slot.ensureOpen()),
      );
      const errors = opened.flatMap((result) =>
        result.status === 'rejected' ? [result.reason as unknown] : [],
      );
      if (errors.length > 0) {
        throw combine(errors, 'Some queues failed to initialize.');
      }
      if (this.state !== 'starting') return;
      this.state = 'running';
      // Workers start only once every requested queue has initialized.
      await Promise.all(slots.map((slot) => slot.syncConsumption()));
    } catch (error) {
      if (this.state === 'starting' || this.state === 'running') {
        this.state = 'failed';
      }
      const cleanup = await Promise.allSettled(
        [...this.slots.values()].map((slot) => slot.shutdown()),
      );
      const cleanupErrors = cleanup.flatMap((result) =>
        result.status === 'rejected' ? [result.reason as unknown] : [],
      );
      if (cleanupErrors.length > 0) {
        throw new AggregateError(
          [error, ...cleanupErrors],
          'The queue service failed to set up, and releasing its queues failed as well.',
          { cause: error },
        );
      }
      throw error;
    }
  }

  private async runShutdown(): Promise<void> {
    this.state = 'stopping';
    if (this.setupPromise) await this.setupPromise.catch(() => undefined);
    const results = await Promise.allSettled(
      [...this.slots.values()].map((slot) => slot.shutdown()),
    );
    this.state = 'stopped';
    const errors = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason as unknown] : [],
    );
    if (errors.length > 0) {
      const error = combine(errors, 'Some queues failed to shut down.');
      this.logger.error(
        { error },
        'The queue service did not shut down cleanly.',
      );
      throw error;
    }
  }
}

/** One logical queue of the service and the entry points bound to it. */
class QueueSlot {
  public readonly dispatcher: QueueDispatcher;
  public readonly manager: QueueManager;
  public readonly producer: QueueProducer;
  public readonly consumer: QueueConsumer;
  private jobDefaults: QueueJobDefaults;
  private concurrency: number;
  /** `undefined` leaves the backend's rate limit untouched when the queue opens. */
  private rateLimit: RateLimitOptions | null | undefined;
  private runtime: QueueRuntime | undefined;
  private opening: Promise<QueueRuntime> | undefined;
  private consumption: Promise<void> = Promise.resolve();
  private configuring: Promise<void> = Promise.resolve();
  private readonly publishing = new Set<Promise<unknown>>();
  private acceptingPublishes = true;
  private shutdownPromise: Promise<void> | undefined;

  public constructor(
    private readonly host: QueueHost,
    public readonly name: string,
    public readonly config: ResolvedQueueConfig,
  ) {
    this.jobDefaults = config.jobDefaults;
    this.concurrency = config.concurrency;
    this.rateLimit = config.rateLimit;
    this.dispatcher = new QueueDispatcher({
      onActive: () => this.onHandlersActive(),
      onIdle: () => this.requestConsumption(),
    });
    this.manager = {
      configure: (options) => this.configure(options),
      drain: (options) => this.drain(options),
      cancelJob: (jobId, reason) => this.dispatcher.cancelJob(jobId, reason),
      cancelAllJobs: (reason) => {
        this.dispatcher.cancelAllJobs(reason);
      },
    };
    this.producer = {
      publish: async (channel, message, options) => {
        const [receipt] = await this.publish([{ channel, message }], options);
        return receipt;
      },
      publishMany: (entries, options) => this.publish(entries, options),
    };
    this.consumer = {
      consume: <T>(handler: ConsumeHandler<T>): UnregisterHandler =>
        // Messages are JSON the handler declares a shape for; nothing checks it.
        this.dispatcher.register(handler as ConsumeHandler<unknown>),
    };
  }

  public ensureOpen(): Promise<QueueRuntime> {
    if (this.runtime) return Promise.resolve(this.runtime);
    if (this.shutdownPromise) {
      return Promise.reject(
        new Error(`Queue "${this.name}" has been shut down.`),
      );
    }
    this.opening ??= this.open().then(
      (runtime) => {
        this.runtime = runtime;
        this.opening = undefined;
        if (this.host.state === 'running') this.requestConsumption();
        return runtime;
      },
      (error: unknown) => {
        // A later call tries again; queues already open are unaffected.
        this.opening = undefined;
        throw error;
      },
    );
    return this.opening;
  }

  /** Starts or pauses consumption to match the handlers and the service state. */
  public syncConsumption(): Promise<void> {
    const next = this.consumption
      .catch(() => undefined)
      .then(async () => {
        const runtime = this.runtime;
        if (!runtime || this.shutdownPromise) return;
        if (this.host.state === 'running' && this.dispatcher.hasHandlers) {
          await runtime.startConsuming(this.concurrency);
        } else {
          await runtime.pauseConsuming();
        }
      });
    this.consumption = next;
    return next;
  }

  public shutdown(): Promise<void> {
    this.shutdownPromise ??= this.runShutdown();
    return this.shutdownPromise;
  }

  private onHandlersActive(): void {
    if (this.host.state !== 'running') return;
    if (this.runtime) {
      this.requestConsumption();
      return;
    }
    this.ensureOpen().catch((error: unknown) => {
      this.host.logger.error(
        { error, queue: this.name },
        `Queue "${this.name}" failed to initialize for its consumer.`,
      );
    });
  }

  private requestConsumption(): void {
    this.syncConsumption().catch((error: unknown) => {
      this.host.logger.error(
        { error, queue: this.name },
        `Queue "${this.name}" failed to change its consumption.`,
      );
    });
  }

  private async open(): Promise<QueueRuntime> {
    const runtime = this.host.implementationFor(this.config).createRuntime({
      queue: this.name,
      config: this.config,
      dispatcher: this.dispatcher,
      logger: this.host.logger,
    });
    const initialization = (async (): Promise<void> => {
      await runtime.open();
      if (this.rateLimit !== undefined) {
        await runtime.setRateLimit(this.rateLimit);
      }
      runtime.setConcurrency(this.concurrency);
    })();
    const result = await settleWithin(
      initialization,
      this.config.setupTimeoutMs,
    );
    if (result.status === 'fulfilled') return runtime;
    let error: unknown;
    if (result.status === 'timeout') {
      error = new Error(
        `Queue "${this.name}" did not initialize within ${this.config.setupTimeoutMs} ms.`,
      );
      initialization.then(
        () =>
          this.host.logger.warn(
            { queue: this.name },
            `Queue "${this.name}" finished initializing after its timeout; it has been closed.`,
          ),
        (late: unknown) =>
          this.host.logger.warn(
            { error: late, queue: this.name },
            `Queue "${this.name}" failed to initialize after its timeout.`,
          ),
      );
    } else {
      error = result.reason;
    }
    const cleanup = await this.release(runtime);
    if (cleanup !== undefined) {
      throw new AggregateError(
        [error, cleanup],
        `Queue "${this.name}" failed to initialize, and releasing it failed as well.`,
      );
    }
    throw error;
  }

  /** Closes through the implementation within the cleanup budget; returns the failure, if any. */
  private async release(runtime: QueueRuntime): Promise<unknown> {
    const closing = runtime.close();
    const result = await settleWithin(closing, CLEANUP_BUDGET_MS);
    if (result.status === 'fulfilled') return undefined;
    if (result.status === 'rejected') return result.reason;
    closing.catch((error: unknown) =>
      this.host.logger.error(
        { error, queue: this.name },
        `Queue "${this.name}" failed to close after its cleanup timeout.`,
      ),
    );
    return new Error(
      `Queue "${this.name}" did not release its resources within ${CLEANUP_BUDGET_MS} ms.`,
    );
  }

  private async publish(
    entries: readonly PublishEntry[],
    options: PublishOptions | undefined,
  ): Promise<PublishReceipt[]> {
    const state = this.host.state;
    const stoppingWithRuntime =
      state === 'stopping' && this.acceptingPublishes && this.runtime;
    if (state !== 'running' && !stoppingWithRuntime) {
      throw new Error(
        state === 'idle' || state === 'starting'
          ? `Queue "${this.name}" cannot publish before the queue service is set up.`
          : `Queue "${this.name}" no longer accepts jobs: the queue service is shutting down.`,
      );
    }
    if (!this.acceptingPublishes) {
      throw new Error(`Queue "${this.name}" no longer accepts jobs.`);
    }
    const deadline = performance.now() + PUBLISH_BUDGET_MS;
    // Everything that can fail before a write fails here, so nothing is written.
    const prepared = prepareJobs(this.name, entries, this.jobDefaults, options);
    if (prepared.length === 0) return [];
    const runtime = await this.withinBudget(this.ensureOpen(), deadline);
    if (!this.acceptingPublishes) {
      throw new Error(`Queue "${this.name}" no longer accepts jobs.`);
    }
    const adding = runtime.add(prepared);
    this.publishing.add(adding);
    adding.then(
      () => this.publishing.delete(adding),
      () => this.publishing.delete(adding),
    );
    const ids = await this.withinBudget(adding, deadline);
    return ids.map((jobId) => ({ jobId }));
  }

  private async withinBudget<T>(
    promise: Promise<T>,
    deadline: number,
  ): Promise<T> {
    const remaining = deadline - performance.now();
    const result =
      remaining > 0
        ? await settleWithin(promise, remaining)
        : ({ status: 'timeout' } as const);
    if (result.status === 'fulfilled') return result.value;
    if (result.status === 'rejected') throw result.reason;
    promise.catch((error: unknown) =>
      this.host.logger.warn(
        { error, queue: this.name },
        `A publish to queue "${this.name}" failed after its timeout.`,
      ),
    );
    throw new Error(
      `Publishing to queue "${this.name}" did not finish within ${PUBLISH_BUDGET_MS} ms; the jobs may still have been written.`,
    );
  }

  private async configure(options: QueueRuntimeOptions): Promise<void> {
    const changes = validateRuntimeOptions(options);
    const run = this.configuring
      .catch(() => undefined)
      .then(() => this.applyConfiguration(changes));
    this.configuring = run;
    await run;
  }

  /** Local options first, then the backend's rate limit; nothing is rolled back. */
  private async applyConfiguration(
    changes: QueueRuntimeChanges,
  ): Promise<void> {
    const state = this.host.state;
    if (state !== 'idle' && state !== 'starting' && state !== 'running') {
      throw new Error(`Queue "${this.name}" can no longer be configured.`);
    }
    if (changes.concurrency !== undefined) {
      this.concurrency = changes.concurrency;
      this.runtime?.setConcurrency(changes.concurrency);
    }
    this.jobDefaults = { ...this.jobDefaults, ...changes.jobDefaults };
    if (changes.rateLimit === undefined) return;
    // Also the value the queue applies when it opens.
    this.rateLimit = changes.rateLimit;
    if (state === 'idle') return;
    const runtime = await this.ensureOpen();
    await runtime.setRateLimit(changes.rateLimit);
  }

  private async drain(options: QueueDrainOptions | undefined): Promise<void> {
    if (this.host.state !== 'running') {
      throw new Error(
        `Queue "${this.name}" can be drained only while the queue service runs.`,
      );
    }
    const delayed = options?.delayed ?? false;
    if (typeof delayed !== 'boolean') {
      throw new TypeError('Queue drain option "delayed" must be a boolean.');
    }
    const runtime = await this.ensureOpen();
    await runtime.drain(delayed);
  }

  private async runShutdown(): Promise<void> {
    if (this.opening) await this.opening.catch(() => undefined);
    await this.consumption.catch(() => undefined);
    const runtime = this.runtime;
    if (!runtime) {
      this.acceptingPublishes = false;
      return;
    }
    const errors: unknown[] = [];
    const { shutdownTimeoutMs, cancellationGraceMs } = this.config;
    const stopped = runtime.stopConsuming();
    let result = await settleWithin(stopped, shutdownTimeoutMs);
    if (result.status === 'timeout') {
      // The shutdown signal, distinct from a cancellation: interrupted jobs return to waiting.
      this.dispatcher.interrupt();
      result = await settleWithin(stopped, cancellationGraceMs);
    }
    if (result.status === 'timeout') {
      errors.push(
        new Error(
          `Queue "${this.name}" still had ${this.dispatcher.activeCount} running job(s) ${shutdownTimeoutMs + cancellationGraceMs} ms after shutdown began: their handlers did not stop on the shutdown signal.`,
        ),
      );
      stopped.then(
        () =>
          this.host.logger.warn(
            { queue: this.name },
            `The running jobs of queue "${this.name}" finished after shutdown gave up on them.`,
          ),
        (error: unknown) =>
          this.host.logger.error(
            { error, queue: this.name },
            `Queue "${this.name}" failed to stop consuming after shutdown gave up on it.`,
          ),
      );
    } else if (result.status === 'rejected') {
      errors.push(result.reason);
    }
    // Handlers could still publish until now; accepted writes settle before the queue closes.
    this.acceptingPublishes = false;
    const accepted = await settleWithin(
      Promise.allSettled([...this.publishing]),
      CLEANUP_BUDGET_MS,
    );
    if (accepted.status === 'timeout') {
      errors.push(
        new Error(
          `Publishes accepted by queue "${this.name}" were still unfinished when it closed.`,
        ),
      );
    }
    const released = await this.release(runtime);
    if (released !== undefined) errors.push(released);
    this.runtime = undefined;
    if (errors.length > 0) {
      throw combine(errors, `Queue "${this.name}" did not shut down cleanly.`);
    }
  }
}

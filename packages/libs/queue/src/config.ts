import path from 'node:path';
import { validateQueueConfig } from './validate-config.js';

import { assertQueueName } from './naming.js';
import {
  assertKnownFields,
  BUILT_IN_JOB_DEFAULTS,
  positiveInteger,
  validateBackoff,
  validateJobIdProducer,
  validateRateLimit,
  validateRetention,
  type QueueJobDefaults,
} from './options.js';
import type {
  QueueAdapter,
  QueueConfig,
  QueueConfigEntry,
  RateLimitOptions,
} from './types.js';

/** The adapter that selects the in-process implementation. */
export const IN_MEMORY_ADAPTER: QueueAdapter = 'inMemory';
/** The key queues on the built-in memory configuration are bound to. */
export const BUILT_IN_MEMORY_KEY: string = '\0built-in-memory';

const ENTRY_FIELDS: ReadonlySet<string> = new Set([
  'adapter',
  'queueBackend',
  'connection',
  'persistence',
  'namespace',
  'concurrency',
  'rateLimit',
  'removeOnComplete',
  'removeOnFail',
  'attempts',
  'backoff',
  'jobIdProducer',
  'setupTimeoutMs',
  'shutdownTimeoutMs',
  'cancellationGraceMs',
]);

const DEFAULT_SETUP_TIMEOUT_MS = 10_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30_000;
const DEFAULT_CANCELLATION_GRACE_MS = 5000;

export interface QueueConfigSelection {
  readonly key: string;
  /** `undefined` selects the built-in memory configuration. */
  readonly entry: QueueConfigEntry | undefined;
}

/**
 * Picks the configuration for a queue: the named key when it exists, then
 * `default`, then the built-in memory configuration.
 */
export function selectQueueConfig(
  config: QueueConfig | undefined,
  configKey: string | undefined,
): QueueConfigSelection {
  validateQueueConfig(config);
  if (configKey !== undefined && configKey !== 'default') {
    const named =
      config?.backends && Object.hasOwn(config.backends, configKey)
        ? config.backends[configKey]
        : undefined;
    if (named !== undefined && typeof named !== 'string') {
      return { key: configKey, entry: named };
    }
  }
  const defaultKey = config?.default;
  if (defaultKey === undefined) {
    return { key: BUILT_IN_MEMORY_KEY, entry: undefined };
  }
  if (typeof defaultKey !== 'string') {
    throw new TypeError('queue.default must name a configuration key.');
  }
  const selected = config?.backends?.[defaultKey];
  if (selected === undefined) {
    throw new Error(
      'queue.default must name an existing configuration in queue.backends.',
    );
  }
  return { key: defaultKey, entry: selected };
}

/** One configuration key with every default filled in. */
export interface ResolvedQueueConfig {
  readonly key: string;
  readonly builtIn: boolean;
  readonly adapter: string;
  /** Optional implementation-owned backend selector. */
  readonly queueBackend: string | undefined;
  /** Handed to the backend factory as it is; `undefined` for `inMemory`. */
  readonly connection: unknown;
  /** `inMemory` only. */
  readonly persistencePath: string | undefined;
  readonly namespace: string;
  readonly concurrency: number;
  readonly rateLimit: RateLimitOptions | null | undefined;
  readonly jobDefaults: QueueJobDefaults;
  readonly setupTimeoutMs: number;
  readonly shutdownTimeoutMs: number;
  readonly cancellationGraceMs: number;
}

export interface QueueConfigDefaults {
  readonly appName: string;
  readonly storagePath: string;
}

/**
 * Checks this layer's options. Whether a backend name is registered is
 * checked by the service, and connections by the backend itself.
 */
export function resolveQueueConfig(
  selection: QueueConfigSelection,
  defaults: QueueConfigDefaults,
): ResolvedQueueConfig {
  const entry: QueueConfigEntry = selection.entry ?? {
    adapter: IN_MEMORY_ADAPTER,
  };
  const label = `Queue configuration "${selection.entry ? selection.key : 'built-in memory'}"`;
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    throw new TypeError(`${label} must be an object.`);
  }
  assertKnownFields(
    entry as unknown as Record<string, unknown>,
    ENTRY_FIELDS,
    label,
  );
  if (typeof entry.adapter !== 'string' || entry.adapter.trim() === '') {
    throw new TypeError(`${label} needs a non-empty adapter name.`);
  }
  const inMemory = entry.adapter === IN_MEMORY_ADAPTER;
  if (inMemory && entry.connection !== undefined) {
    throw new TypeError(`${label} uses inMemory, which takes no connection.`);
  }
  if (inMemory && entry.queueBackend !== undefined) {
    throw new TypeError(`${label} uses inMemory, which takes no queueBackend.`);
  }
  if (
    entry.queueBackend !== undefined &&
    (typeof entry.queueBackend !== 'string' || entry.queueBackend === '')
  ) {
    throw new TypeError(`${label} queueBackend must name a backend factory.`);
  }
  const queueBackend = entry.queueBackend;
  if (!inMemory && entry.persistence !== undefined) {
    throw new TypeError(
      `${label} sets persistence, which only inMemory configurations use.`,
    );
  }
  const persistencePath = entry.persistence?.path;
  if (persistencePath !== undefined && typeof persistencePath !== 'string') {
    throw new TypeError(`${label} persistence.path must be a string.`);
  }
  const namespace = entry.namespace ?? defaults.appName;
  assertQueueName('namespace', namespace);
  const jobDefaults: QueueJobDefaults = {
    removeOnComplete:
      entry.removeOnComplete === undefined
        ? BUILT_IN_JOB_DEFAULTS.removeOnComplete
        : validateRetention(entry.removeOnComplete, 'removeOnComplete'),
    removeOnFail:
      entry.removeOnFail === undefined
        ? BUILT_IN_JOB_DEFAULTS.removeOnFail
        : validateRetention(entry.removeOnFail, 'removeOnFail'),
    attempts:
      entry.attempts === undefined
        ? BUILT_IN_JOB_DEFAULTS.attempts
        : positiveInteger(entry.attempts, 'attempts'),
    backoff:
      entry.backoff === undefined ? undefined : validateBackoff(entry.backoff),
    jobIdProducer:
      entry.jobIdProducer === undefined
        ? undefined
        : validateJobIdProducer(entry.jobIdProducer),
  };
  return {
    key: selection.key,
    builtIn: selection.entry === undefined,
    adapter: entry.adapter,
    queueBackend,
    connection: entry.connection,
    persistencePath: inMemory
      ? persistencePath
        ? path.resolve(persistencePath)
        : defaults.storagePath
      : undefined,
    namespace,
    concurrency:
      entry.concurrency === undefined
        ? 1
        : positiveInteger(entry.concurrency, 'concurrency'),
    rateLimit:
      entry.rateLimit === undefined
        ? undefined
        : validateRateLimit(entry.rateLimit),
    jobDefaults,
    setupTimeoutMs:
      entry.setupTimeoutMs === undefined
        ? DEFAULT_SETUP_TIMEOUT_MS
        : positiveInteger(entry.setupTimeoutMs, 'setupTimeoutMs'),
    shutdownTimeoutMs:
      entry.shutdownTimeoutMs === undefined
        ? DEFAULT_SHUTDOWN_TIMEOUT_MS
        : positiveInteger(entry.shutdownTimeoutMs, 'shutdownTimeoutMs'),
    cancellationGraceMs:
      entry.cancellationGraceMs === undefined
        ? DEFAULT_CANCELLATION_GRACE_MS
        : positiveInteger(entry.cancellationGraceMs, 'cancellationGraceMs'),
  };
}

/** Every configuration key of the section, in declaration order. */
export function queueConfigKeys(config: QueueConfig | undefined): string[] {
  validateQueueConfig(config);
  return Object.keys(config?.backends ?? {});
}

import type {
  JobIdProducer,
  PublishOptions,
  QueueBackoffOptions,
  QueueRetentionPolicy,
  QueueRuntimeOptions,
  RateLimitOptions,
} from './types.js';

/** BullMQ 6.3.6 `PRIORITY_LIMIT`. */
const PRIORITY_LIMIT = 2 ** 21 - 1;
const BUILT_IN_BACKOFF_TYPES: ReadonlySet<string> = new Set([
  'fixed',
  'exponential',
]);

/** The job defaults a queue applies to what it publishes next. */
export interface QueueJobDefaults {
  readonly removeOnComplete: QueueRetentionPolicy;
  readonly removeOnFail: QueueRetentionPolicy;
  readonly attempts: number;
  readonly backoff: QueueBackoffOptions | undefined;
  readonly jobIdProducer: JobIdProducer | undefined;
}

/** The options one job is written with, after every layer is merged. */
export interface ResolvedJobOptions {
  readonly priority: number;
  readonly delay: number;
  readonly attempts: number;
  readonly backoff: QueueBackoffOptions | undefined;
  readonly removeOnComplete: QueueRetentionPolicy;
  readonly removeOnFail: QueueRetentionPolicy;
}

export const BUILT_IN_JOB_DEFAULTS: QueueJobDefaults = Object.freeze({
  removeOnComplete: Object.freeze({ count: 1000 }),
  removeOnFail: Object.freeze({ age: 604_800 }),
  attempts: 1,
  backoff: undefined,
  jobIdProducer: undefined,
});

export function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`Queue ${label} must be a positive integer.`);
  }
  return value;
}

function nonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`Queue ${label} must be a non-negative number.`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Queue ${label} must be a non-negative integer.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertKnownFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
): void {
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) {
      throw new TypeError(`${label} does not accept "${field}".`);
    }
  }
}

export function validateRetention(
  value: unknown,
  label: string,
): QueueRetentionPolicy {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return nonNegativeInteger(value, label);
  if (isRecord(value)) {
    assertKnownFields(value, new Set(['count', 'age']), `Queue ${label}`);
    const count =
      value.count === undefined
        ? undefined
        : nonNegativeInteger(value.count, `${label}.count`);
    const age =
      value.age === undefined
        ? undefined
        : nonNegativeInteger(value.age, `${label}.age`);
    if (count !== undefined) {
      return { count, ...(age !== undefined ? { age } : {}) };
    }
    // An object with neither bound keeps every finished job.
    return age !== undefined ? { age } : false;
  }
  throw new TypeError(
    `Queue ${label} must be a boolean, a count, or { count, age }.`,
  );
}

/**
 * Only BullMQ's built-in strategies: a custom type needs a Worker strategy,
 * which this package does not expose, so it is rejected rather than ignored.
 */
export function validateBackoff(value: unknown): QueueBackoffOptions {
  if (typeof value === 'number') return nonNegativeNumber(value, 'backoff');
  if (!isRecord(value)) {
    throw new TypeError(
      'Queue backoff must be a delay in milliseconds or { type, delay, jitter }.',
    );
  }
  assertKnownFields(
    value,
    new Set(['type', 'delay', 'jitter']),
    'Queue backoff',
  );
  if (
    typeof value.type !== 'string' ||
    !BUILT_IN_BACKOFF_TYPES.has(value.type)
  ) {
    throw new TypeError(
      `Queue backoff type ${JSON.stringify(value.type)} is not supported: use "fixed" or "exponential".`,
    );
  }
  const delay =
    value.delay === undefined
      ? undefined
      : nonNegativeNumber(value.delay, 'backoff.delay');
  const jitter =
    value.jitter === undefined
      ? undefined
      : nonNegativeNumber(value.jitter, 'backoff.jitter');
  if (jitter !== undefined && jitter > 1) {
    throw new TypeError('Queue backoff.jitter must be between 0 and 1.');
  }
  return {
    type: value.type,
    ...(delay !== undefined ? { delay } : {}),
    ...(jitter !== undefined ? { jitter } : {}),
  };
}

export function validateRateLimit(value: unknown): RateLimitOptions | null {
  if (value === null) return null;
  if (!isRecord(value)) {
    throw new TypeError('Queue rateLimit must be { max, duration } or null.');
  }
  assertKnownFields(value, new Set(['max', 'duration']), 'Queue rateLimit');
  return {
    max: positiveInteger(value.max, 'rateLimit.max'),
    duration: positiveInteger(value.duration, 'rateLimit.duration'),
  };
}

export function validateJobIdProducer(value: unknown): JobIdProducer {
  if (typeof value !== 'function') {
    throw new TypeError('Queue jobIdProducer must be a function.');
  }
  return value as JobIdProducer;
}

const RUNTIME_FIELDS: ReadonlySet<string> = new Set([
  'concurrency',
  'removeOnComplete',
  'removeOnFail',
  'attempts',
  'backoff',
  'jobIdProducer',
  'rateLimit',
]);

/** Validated `configure()` input: absent fields are left untouched. */
export interface QueueRuntimeChanges {
  readonly concurrency?: number;
  readonly jobDefaults: Partial<QueueJobDefaults>;
  /** `undefined` leaves the backend's rate limit as it is. */
  readonly rateLimit?: RateLimitOptions | null;
}

/** Validates everything before the caller changes anything. */
export function validateRuntimeOptions(
  options: QueueRuntimeOptions,
): QueueRuntimeChanges {
  if (!isRecord(options)) {
    throw new TypeError('Queue runtime options must be an object.');
  }
  for (const field of Object.keys(options)) {
    if (!RUNTIME_FIELDS.has(field)) {
      throw new TypeError(
        `Queue option "${field}" cannot be changed at runtime.`,
      );
    }
  }
  const jobDefaults: {
    -readonly [K in keyof QueueJobDefaults]?: QueueJobDefaults[K];
  } = {};
  if (options.removeOnComplete !== undefined) {
    jobDefaults.removeOnComplete = validateRetention(
      options.removeOnComplete,
      'removeOnComplete',
    );
  }
  if (options.removeOnFail !== undefined) {
    jobDefaults.removeOnFail = validateRetention(
      options.removeOnFail,
      'removeOnFail',
    );
  }
  if (options.attempts !== undefined) {
    jobDefaults.attempts = positiveInteger(options.attempts, 'attempts');
  }
  if (options.backoff !== undefined) {
    jobDefaults.backoff = validateBackoff(options.backoff);
  }
  if (options.jobIdProducer !== undefined) {
    jobDefaults.jobIdProducer = validateJobIdProducer(options.jobIdProducer);
  }
  return {
    ...(options.concurrency !== undefined
      ? { concurrency: positiveInteger(options.concurrency, 'concurrency') }
      : {}),
    jobDefaults,
    ...(options.rateLimit !== undefined
      ? { rateLimit: validateRateLimit(options.rateLimit) }
      : {}),
  };
}

const PUBLISH_FIELDS: ReadonlySet<string> = new Set([
  'priority',
  'delay',
  'attempts',
  'backoff',
  'removeOnComplete',
  'removeOnFail',
  'jobIdProducer',
]);

export interface ResolvedPublishOptions {
  readonly job: ResolvedJobOptions;
  readonly jobIdProducer: JobIdProducer | undefined;
}

/** Merges publish options over the queue defaults. */
export function resolvePublishOptions(
  defaults: QueueJobDefaults,
  options: PublishOptions | undefined,
): ResolvedPublishOptions {
  if (options === undefined) {
    return {
      job: {
        priority: 0,
        delay: 0,
        attempts: defaults.attempts,
        backoff: defaults.backoff,
        removeOnComplete: defaults.removeOnComplete,
        removeOnFail: defaults.removeOnFail,
      },
      jobIdProducer: defaults.jobIdProducer,
    };
  }
  if (!isRecord(options)) {
    throw new TypeError('Queue publish options must be an object.');
  }
  assertKnownFields(options, PUBLISH_FIELDS, 'Queue publish options');
  const priority =
    options.priority === undefined
      ? 0
      : nonNegativeInteger(options.priority, 'priority');
  if (priority > PRIORITY_LIMIT) {
    throw new TypeError(
      `Queue priority must be between 0 and ${PRIORITY_LIMIT}.`,
    );
  }
  return {
    job: {
      priority,
      delay:
        options.delay === undefined
          ? 0
          : nonNegativeNumber(options.delay, 'delay'),
      attempts:
        options.attempts === undefined
          ? defaults.attempts
          : positiveInteger(options.attempts, 'attempts'),
      backoff:
        options.backoff === undefined
          ? defaults.backoff
          : validateBackoff(options.backoff),
      removeOnComplete:
        options.removeOnComplete === undefined
          ? defaults.removeOnComplete
          : validateRetention(options.removeOnComplete, 'removeOnComplete'),
      removeOnFail:
        options.removeOnFail === undefined
          ? defaults.removeOnFail
          : validateRetention(options.removeOnFail, 'removeOnFail'),
    },
    jobIdProducer:
      options.jobIdProducer === undefined
        ? defaults.jobIdProducer
        : validateJobIdProducer(options.jobIdProducer),
  };
}

/** BullMQ 6.3.6 `Job.validateOptions` rules, checked before anything is written. */
export function assertJobId(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value === '') {
    throw new TypeError('A queue job ID must be a non-empty string.');
  }
  if (`${Number.parseInt(value, 10)}` === value) {
    throw new TypeError(
      `Queue job ID ${JSON.stringify(value)} cannot be an integer.`,
    );
  }
  if (value.includes(':') && value.split(':').length !== 3) {
    throw new TypeError(
      `Queue job ID ${JSON.stringify(value)} cannot contain ":".`,
    );
  }
}

/** Retry delay after `failures` failed attempts, as BullMQ's built-in strategies compute it. */
export function backoffDelay(
  backoff: QueueBackoffOptions | undefined,
  failures: number,
): number {
  if (backoff === undefined) return 0;
  const {
    type,
    delay = 0,
    jitter = 0,
  } = typeof backoff === 'number' ? { type: 'fixed', delay: backoff } : backoff;
  const base =
    type === 'exponential' ? Math.round(2 ** (failures - 1) * delay) : delay;
  if (jitter <= 0) return base;
  return Math.floor(Math.random() * base * jitter + base * (1 - jitter));
}

import path from 'node:path';

/**
 * How many finished jobs BullMQ keeps: `true` removes them at once, a number
 * keeps that many, and `{ count, age }` bounds by count and by age in seconds.
 */
export type JobsRetentionPolicy =
  boolean | number | { readonly count?: number; readonly age?: number };

/**
 * Redis connection options handed to BullMQ as they are. They are plain
 * options, never a client instance: BullMQ owns every connection it opens.
 */
export interface JobsRedisConnectionOptions {
  readonly host?: string;
  readonly port?: number;
  readonly db?: number;
  readonly username?: string;
  readonly password?: string;
  readonly url?: string;
  readonly tls?: boolean | Readonly<Record<string, unknown>>;
  readonly [option: string]: unknown;
}

interface JobsAdapterConfigBase {
  /** Isolates applications sharing a backend. Defaults to the application name. */
  readonly namespace?: string;
  /** Jobs one instance executes at the same time. Defaults to `1`. */
  readonly concurrency?: number;
  /** Tries per firing, the first included. Defaults to `1`. */
  readonly attempts?: number;
}

export interface RedisJobsAdapterConfig extends JobsAdapterConfigBase {
  readonly adapter: 'redis';
  readonly connection: JobsRedisConnectionOptions;
  readonly removeOnComplete?: JobsRetentionPolicy;
  readonly removeOnFail?: JobsRetentionPolicy;
}

export interface MemoryJobsAdapterConfig extends JobsAdapterConfigBase {
  readonly adapter: 'memory';
  readonly persistence?: {
    /** Directory holding the state files. Defaults to the application storage. */
    readonly path?: string;
  };
}

export type JobsAdapterConfig =
  RedisJobsAdapterConfig | MemoryJobsAdapterConfig;

/**
 * The `jobs` configuration section: `default` names the configuration used
 * when a consumer names none or an unknown one, and every other key defines
 * one configuration.
 */
export interface JobsConfig {
  readonly default?: string;
  readonly [name: string]: JobsAdapterConfig | string | undefined;
}

interface ResolvedJobsConfigBase {
  /** The configuration key, or {@link BUILT_IN_MEMORY_KEY}. */
  readonly key: string;
  /** Whether no configuration applied and the built-in memory one was used. */
  readonly builtIn: boolean;
  readonly scope: string;
  readonly namespace: string;
  readonly concurrency: number;
  readonly attempts: number;
}

export interface ResolvedRedisJobsConfig extends ResolvedJobsConfigBase {
  readonly adapter: 'redis';
  readonly connection: JobsRedisConnectionOptions;
  readonly removeOnComplete: JobsRetentionPolicy;
  readonly removeOnFail: JobsRetentionPolicy;
}

export interface ResolvedMemoryJobsConfig extends ResolvedJobsConfigBase {
  readonly adapter: 'memory';
  readonly persistencePath: string;
}

export type ResolvedJobsConfig =
  ResolvedRedisJobsConfig | ResolvedMemoryJobsConfig;

/** The key under which executors on the built-in memory configuration are tracked. */
export const BUILT_IN_MEMORY_KEY: string = '\0built-in-memory';

const DEFAULT_REMOVE_ON_COMPLETE: JobsRetentionPolicy = Object.freeze({
  count: 1000,
});
const DEFAULT_REMOVE_ON_FAIL: JobsRetentionPolicy = Object.freeze({
  age: 604_800,
});

export interface JobsConfigSelection {
  readonly key: string;
  readonly config: JobsAdapterConfig | undefined;
}

/**
 * Picks the configuration for `name`: the named key, then `default`, then
 * nothing — which the caller turns into the built-in memory configuration.
 */
export function selectJobsConfig(
  config: JobsConfig | undefined,
  name: string | undefined,
): JobsConfigSelection {
  if (name !== undefined && name !== 'default') {
    const named = config?.[name];
    if (named !== undefined && typeof named !== 'string') {
      return { key: name, config: named };
    }
  }
  const defaultKey = config?.default;
  if (defaultKey === undefined) {
    return { key: BUILT_IN_MEMORY_KEY, config: undefined };
  }
  const selected = defaultKey === 'default' ? undefined : config?.[defaultKey];
  if (selected === undefined || typeof selected === 'string') {
    throw new Error(
      `jobs.default names "${defaultKey}", which is not a jobs configuration.`,
    );
  }
  return { key: defaultKey, config: selected };
}

export interface JobsConfigDefaults {
  readonly appName: string;
  readonly storagePath: string;
}

export function resolveJobsConfig(
  selection: JobsConfigSelection,
  scope: string,
  defaults: JobsConfigDefaults,
): ResolvedJobsConfig {
  const config = selection.config;
  const base = {
    key: selection.key,
    builtIn: config === undefined,
    scope,
    namespace: config?.namespace ?? defaults.appName,
    concurrency: positiveInteger(config?.concurrency ?? 1, 'concurrency'),
    attempts: positiveInteger(config?.attempts ?? 1, 'attempts'),
  };
  if (!base.namespace) {
    throw new Error('A jobs namespace must be a non-empty string.');
  }
  if (config === undefined || config.adapter === 'memory') {
    const configuredPath = config?.persistence?.path;
    return {
      ...base,
      adapter: 'memory',
      persistencePath: configuredPath
        ? path.resolve(configuredPath)
        : defaults.storagePath,
    };
  }
  if (config.adapter === 'redis') {
    if (!config.connection || typeof config.connection !== 'object') {
      throw new Error(
        `Jobs configuration "${selection.key}" needs a redis connection.`,
      );
    }
    return {
      ...base,
      adapter: 'redis',
      connection: config.connection,
      removeOnComplete: config.removeOnComplete ?? DEFAULT_REMOVE_ON_COMPLETE,
      removeOnFail: config.removeOnFail ?? DEFAULT_REMOVE_ON_FAIL,
    };
  }
  throw new Error(
    `Jobs configuration "${selection.key}" uses adapter "${String((config as { adapter?: unknown }).adapter)}", which is neither "redis" nor "memory".`,
  );
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Jobs ${label} must be a positive integer.`);
  }
  return value;
}

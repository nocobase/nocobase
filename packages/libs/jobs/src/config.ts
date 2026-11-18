import path from 'node:path';
import { validateJobsConfig } from './validate-config.js';

/** Common options plus adapter-owned fields, preserved without filtering. */
export interface JobsAdapterConfig {
  readonly adapter: string;
  readonly namespace?: string;
  readonly concurrency?: number;
  readonly attempts?: number;
  readonly [option: string]: unknown;
}

export interface MemoryJobsAdapterConfig extends JobsAdapterConfig {
  readonly adapter: 'memory';
  readonly persistence?: { readonly path?: string };
}

export interface JobsConfig {
  readonly default?: string;
  readonly backends?: Readonly<Record<string, JobsAdapterConfig>>;
}

export interface ResolvedJobsConfig {
  readonly key: string;
  readonly builtIn: boolean;
  readonly adapter: string;
  readonly scope: string;
  readonly namespace: string;
  readonly concurrency: number;
  readonly attempts: number;
}

export interface ResolvedMemoryJobsConfig extends ResolvedJobsConfig {
  readonly adapter: 'memory';
  readonly persistencePath: string;
}

export const BUILT_IN_MEMORY_KEY: string = '\0built-in-memory';

export interface JobsConfigSelection {
  readonly key: string;
  readonly config: JobsAdapterConfig | undefined;
}

/** Unknown names retain the historical default selection behavior. */
export function selectJobsConfig(
  config: JobsConfig | undefined,
  name: string | undefined,
): JobsConfigSelection {
  validateJobsConfig(config);
  if (name !== undefined && name !== 'default') {
    const named =
      config?.backends && Object.hasOwn(config.backends, name)
        ? config.backends[name]
        : undefined;
    if (named !== undefined && typeof named !== 'string')
      return { key: name, config: named };
  }
  const defaultKey = config?.default;
  if (defaultKey === undefined)
    return { key: BUILT_IN_MEMORY_KEY, config: undefined };
  const selected = config?.backends?.[defaultKey];
  if (selected === undefined)
    throw new Error(
      'jobs.default must name an existing configuration in jobs.backends.',
    );
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
  const adapter = config === undefined ? 'memory' : config?.adapter;
  if (typeof adapter !== 'string' || !adapter)
    throw new Error(
      `Jobs configuration "${selection.key}" must declare a non-empty string adapter.`,
    );
  const namespace = config?.namespace ?? defaults.appName;
  if (typeof namespace !== 'string' || !namespace)
    throw new Error('A jobs namespace must be a non-empty string.');
  return {
    key: selection.key,
    builtIn: config === undefined,
    adapter,
    scope,
    namespace,
    concurrency: positiveInteger(config?.concurrency ?? 1, 'concurrency'),
    attempts: positiveInteger(config?.attempts ?? 1, 'attempts'),
  };
}

export function resolveMemoryJobsConfig(
  config: JobsAdapterConfig,
  base: ResolvedJobsConfig,
  defaults: JobsConfigDefaults,
): ResolvedMemoryJobsConfig {
  const persistence = config.persistence;
  if (
    persistence !== undefined &&
    (typeof persistence !== 'object' || persistence === null)
  )
    throw new Error('Jobs persistence must be an object.');
  const configuredPath =
    persistence && 'path' in persistence ? persistence.path : undefined;
  if (configuredPath !== undefined && typeof configuredPath !== 'string')
    throw new Error('Jobs persistence.path must be a string.');
  return {
    ...base,
    adapter: 'memory',
    persistencePath: configuredPath
      ? path.resolve(configuredPath)
      : defaults.storagePath,
  };
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`Jobs ${label} must be a positive integer.`);
  return value;
}

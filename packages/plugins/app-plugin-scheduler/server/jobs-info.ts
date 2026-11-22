import path from 'node:path';

import type { AppConfigAccessor } from '@nocobase/app-server/config';

/** Where a setting's value comes from: an environment variable, a configuration file, or the code default. */
export type SchedulerConfigSource = 'environment' | 'config' | 'default';

/**
 * The jobs configuration this instance's Schedules run on, as an administrator reads it. It never carries a password
 * or any other connection option beyond the address: the connection is reduced to `host:port` or a URL without its
 * credentials.
 */
export interface SchedulerJobsDescription {
  /** The name of the `jobs.backends` entry in use; `null` for the built-in memory configuration. */
  readonly configuration: string | null;
  /** What chose it: `scheduler.jobs`, `jobs.default`, or neither (`built-in`). */
  readonly selectedBy: 'scheduler.jobs' | 'jobs.default' | 'built-in';
  readonly adapter: string;
  /** Whether the adapter's implementation is registered; a running instance could not start without it. */
  readonly pluginRegistered: boolean;
  /** Whether more than one instance may run the Schedules: every adapter but `memory`. */
  readonly multiInstance: boolean;
  /** Where the memory adapter writes its rules on shutdown, relative to the application when it lies inside it. */
  readonly persistencePath?: string;
  readonly concurrency: number;
  readonly attempts: number;
  readonly namespace?: string;
  /** The address of a non-memory backend, without credentials. */
  readonly connection?: string;
  readonly sources: {
    readonly configuration: SchedulerConfigSource;
    readonly adapter: SchedulerConfigSource;
    readonly concurrency: SchedulerConfigSource;
    readonly attempts: SchedulerConfigSource;
    readonly namespace?: SchedulerConfigSource;
    readonly connection?: SchedulerConfigSource;
  };
}

export interface DescribeSchedulerJobsOptions {
  readonly config: AppConfigAccessor;
  readonly appName: string;
  readonly rootDir: string;
  /** The memory adapter's default state directory, `storage/jobs`. */
  readonly storagePath: string;
}

type Settings = Readonly<Record<string, unknown>>;

/**
 * Describes the jobs configuration the Scheduler selected, by the rules the jobs service applies: `scheduler.jobs`
 * when set, otherwise `jobs.default`, otherwise the built-in memory configuration with one worker and one attempt.
 */
export function describeSchedulerJobs({
  config,
  appName,
  rootDir,
  storagePath,
}: DescribeSchedulerJobsOptions): SchedulerJobsDescription {
  const sourceOf = createSourceResolver(config);
  const jobs = asSettings(config.get('jobs'));
  const backends = asSettings(jobs?.backends);
  const named = asSettings(config.get('scheduler'))?.jobs;
  const fallback = jobs?.default;
  const [selectedBy, name] =
    typeof named === 'string' && named !== 'default'
      ? (['scheduler.jobs', named] as const)
      : typeof fallback === 'string'
        ? (['jobs.default', fallback] as const)
        : (['built-in', null] as const);
  const selected = name === null ? undefined : asSettings(backends?.[name]);
  const base = name === null ? undefined : `jobs.backends.${name}`;
  const field = (key: string): SchedulerConfigSource =>
    base === undefined ? 'default' : sourceOf(`${base}.${key}`);
  const adapter =
    typeof selected?.adapter === 'string' ? selected.adapter : 'memory';
  const memory = adapter === 'memory';
  const connection = memory ? undefined : connectionAddress(selected);
  return {
    configuration: name,
    selectedBy,
    adapter,
    pluginRegistered: true,
    multiInstance: !memory,
    ...(memory
      ? { persistencePath: persistencePath(selected, rootDir, storagePath) }
      : {}),
    concurrency: positiveInteger(selected?.concurrency),
    attempts: positiveInteger(selected?.attempts),
    ...(memory
      ? {}
      : {
          namespace:
            typeof selected?.namespace === 'string'
              ? selected.namespace
              : appName,
        }),
    ...(connection ? { connection } : {}),
    sources: {
      configuration:
        selectedBy === 'scheduler.jobs'
          ? sourceOf('scheduler.jobs')
          : selectedBy === 'jobs.default'
            ? sourceOf('jobs.default')
            : 'default',
      adapter: field('adapter'),
      concurrency: field('concurrency'),
      attempts: field('attempts'),
      ...(memory
        ? {}
        : {
            namespace: field('namespace'),
            ...(connection
              ? {
                  connection:
                    selected?.url !== undefined
                      ? field('url')
                      : field('connection'),
                }
              : {}),
          }),
    },
  };
}

/**
 * Tells where the value at a configuration path came from. A section variable mapped to the path wins when the
 * environment the configuration was loaded from set it — the application's own environment, which a host may give each
 * application separately, never the host process's; otherwise the file and environment overrides, then the code
 * defaults. An accessor that keeps no layers reports everything as a default.
 */
function createSourceResolver(
  config: AppConfigAccessor,
): (configPath: string) => SchedulerConfigSource {
  const layers = config.layers?.();
  const loaded = new Set(config.loadedEnvironmentVariables?.() ?? []);
  const variables = Object.entries(
    config.environmentVariableMappings?.() ?? {},
  ).filter(([variable]) => loaded.has(variable));
  return (configPath) => {
    const fromEnvironment = variables.some(
      ([, mapping]) =>
        mapping.path === configPath ||
        configPath.startsWith(`${mapping.path}.`),
    );
    if (fromEnvironment) return 'environment';
    if (layers && valueAt(layers.overrides, configPath) !== undefined)
      return 'config';
    return 'default';
  };
}

function valueAt(settings: unknown, configPath: string): unknown {
  let current: unknown = settings;
  for (const key of configPath.split('.')) {
    const object = asSettings(current);
    if (!object || !Object.hasOwn(object, key)) return undefined;
    current = object[key];
  }
  return current;
}

function asSettings(value: unknown): Settings | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Settings)
    : undefined;
}

function positiveInteger(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : 1;
}

function persistencePath(
  selected: Settings | undefined,
  rootDir: string,
  storagePath: string,
): string {
  const configured = asSettings(selected?.persistence)?.path;
  const absolute =
    typeof configured === 'string' && configured
      ? path.resolve(configured)
      : storagePath;
  const relative = path.relative(rootDir, absolute);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? relative.split(path.sep).join('/')
    : absolute;
}

/** `host:port`, or the URL without user name and password; nothing else of the connection leaves the server. */
function connectionAddress(selected: Settings | undefined): string | undefined {
  const url = selected?.url ?? asSettings(selected?.connection)?.url;
  if (typeof url === 'string' && url) {
    try {
      const parsed = new URL(url);
      parsed.username = '';
      parsed.password = '';
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString();
    } catch {
      return undefined;
    }
  }
  const connection = asSettings(selected?.connection);
  const host = connection?.host;
  if (typeof host !== 'string' || !host) return undefined;
  const port = connection?.port;
  return typeof port === 'number' || typeof port === 'string'
    ? `${host}:${String(port)}`
    : host;
}

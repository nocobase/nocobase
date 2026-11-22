import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { cachingToken } from '@nocobase/app-server/caching';
import { idGeneratorImplementationToken } from '@nocobase/app-server/id-generator';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { queueServiceToken } from '@nocobase/app-server/queue';
import { realtimeBrokerRegistryToken } from '@nocobase/app-server/realtime';

import type {
  DistributedCheckResult,
  DistributedIdGeneration,
  DistributedService,
  DistributedServiceKey,
  DistributedStatus,
} from '../shared/types.js';
import { builtInChecks } from './checks.js';
import {
  projectDistributedData,
  distributedStatusToken,
  type DistributedStatusContext,
} from './registry.js';

/** What a service reports about itself, in the shape every service's `describe()` shares. */
interface ServiceDescription {
  readonly default: string | null;
  readonly adapter: string;
  readonly sharing: 'local' | 'shared' | 'unknown';
  readonly registered: boolean;
  readonly backends?: readonly {
    readonly name: string;
    readonly adapter: string;
    readonly sharing: 'local' | 'shared' | 'unknown';
    readonly registered: boolean;
  }[];
  readonly selections?: readonly {
    readonly consumer?: string;
    readonly backend: string;
  }[];
}

/** The configuration path that selects each service's default backend. */
export const SERVICE_CONFIG_PATHS: Readonly<
  Record<DistributedServiceKey, string>
> = {
  caching: 'caching.default',
  concurrency: 'concurrency.default',
  jobs: 'jobs.default',
  queue: 'queue.default',
  realtime: 'realtime.broker.adapter',
};

/**
 * Imports an optional peer: `undefined` when the package itself is not installed, so the service shows as not running.
 * Any other failure — a broken dependency of the package, an error while its module initializes — is thrown, for the
 * caller to log.
 */
export async function importOptional<T>(
  load: () => Promise<T>,
  packageName: string,
): Promise<T | undefined> {
  try {
    return await load();
  } catch (error) {
    if (
      error instanceof Error &&
      (error as { code?: unknown }).code === 'ERR_MODULE_NOT_FOUND' &&
      // Node names the missing package in quotes: "Cannot find package '<name>' imported from …". A dependency the
      // package itself is missing names that dependency instead, and is reported.
      (error.message.includes(`'${packageName}'`) ||
        error.message.includes(`'${packageName}/`))
    )
      return undefined;
    throw error;
  }
}

/**
 * The concurrency service, when its optional plugin is installed. Imported lazily so an application without
 * `@nocobase/app-plugin-concurrency` still loads this plugin and shows the other services.
 */
async function describeConcurrency(
  container: AppPluginApplication['container'],
): Promise<ServiceDescription | undefined> {
  const entry = await importOptional(
    () => import('@nocobase/app-plugin-concurrency/server'),
    '@nocobase/app-plugin-concurrency',
  );
  if (!entry) return undefined;
  return container.has(entry.concurrencyServiceToken)
    ? container.resolve(entry.concurrencyServiceToken).describe?.()
    : undefined;
}

export interface StatusLogger {
  warn(bindings: Record<string, unknown>, message: string): void;
}

/**
 * Assembles the status from what this instance's services report about themselves and from its configuration. It
 * copies names, adapters and flags field by field into new objects; no configuration object is spread or returned, so
 * connection options never reach the response.
 */
export async function collectDistributedStatus(
  app: Pick<AppPluginApplication, 'container' | 'config'>,
  logger?: StatusLogger,
): Promise<DistributedStatus> {
  const { container, config } = app;
  const overrides = config.layers?.().overrides;
  const userProvided = (path: string): boolean => {
    let value: unknown = overrides;
    for (const segment of path.split('.')) {
      if (
        typeof value !== 'object' ||
        value === null ||
        !Object.hasOwn(value, segment)
      )
        return false;
      value = (value as Record<string, unknown>)[segment];
    }
    return true;
  };
  const describe = async (
    key: DistributedServiceKey,
  ): Promise<ServiceDescription | undefined> => {
    try {
      switch (key) {
        case 'caching':
          return container.has(cachingToken)
            ? container.resolve(cachingToken).describe()
            : undefined;
        case 'concurrency':
          return await describeConcurrency(container);
        case 'jobs':
          return container.has(jobExecutorServiceToken)
            ? container.resolve(jobExecutorServiceToken).describe?.()
            : undefined;
        case 'queue':
          return container.has(queueServiceToken)
            ? container.resolve(queueServiceToken).describe?.()
            : undefined;
        case 'realtime':
          return container.has(realtimeBrokerRegistryToken)
            ? container
                .resolve(realtimeBrokerRegistryToken)
                .describe?.(config.get<Record<string, unknown>>('realtime'))
            : undefined;
      }
    } catch (error) {
      logger?.warn(
        { service: key, error: error instanceof Error ? error.name : 'Error' },
        'A service could not describe its backends.',
      );
      return undefined;
    }
  };
  const keys = Object.keys(SERVICE_CONFIG_PATHS) as DistributedServiceKey[];
  const descriptions = await Promise.all(keys.map((key) => describe(key)));
  const services = keys.map((key, index): DistributedService => {
    const description = descriptions[index];
    const configPath = SERVICE_CONFIG_PATHS[key];
    return {
      key,
      available: description !== undefined,
      configPath,
      source: userProvided(configPath) ? 'configured' : 'default',
      default: description?.default ?? null,
      adapter: description?.adapter ?? '',
      sharing: description?.sharing ?? 'unknown',
      registered: description?.registered ?? false,
      backends: (description?.backends ?? []).map((backend) => ({
        name: backend.name,
        adapter: backend.adapter,
        sharing: backend.sharing,
        registered: backend.registered,
      })),
      selections: (description?.selections ?? []).map((selection) => ({
        ...(selection.consumer === undefined
          ? {}
          : { consumer: selection.consumer }),
        backend: selection.backend,
      })),
    };
  });
  const workerId = config.get<{ workerId?: unknown }>('snowflake')?.workerId;
  const idGeneration: DistributedIdGeneration = container.has(
    idGeneratorImplementationToken,
  )
    ? { mode: 'auto', workerId: null, source: 'configured' }
    : {
        mode: 'manual',
        workerId: typeof workerId === 'number' ? workerId : null,
        source: userProvided('snowflake.workerId') ? 'configured' : 'default',
      };
  // A shared backend a caller selected by name shows the intent as much as a shared default does.
  const mode =
    services.some(
      (service) =>
        service.sharing === 'shared' ||
        service.selections.some(
          ({ backend }) =>
            service.backends.find(({ name }) => name === backend)?.sharing ===
            'shared',
        ),
    ) || idGeneration.mode === 'auto'
      ? 'multi'
      : 'single';
  const context: DistributedStatusContext = {
    mode,
    services,
    idGeneration,
    container,
  };
  const registry = container.has(distributedStatusToken)
    ? container.resolve(distributedStatusToken)
    : undefined;
  const checks: DistributedCheckResult[] = [];
  const extensionChecks = new Set(registry?.checks() ?? []);
  for (const check of [
    ...builtInChecks({
      config,
      localDiskUsage: container.has(serverFileRepositoryManagerToken)
        ? () =>
            container.resolve(serverFileRepositoryManagerToken).localDiskUsage()
        : undefined,
    }),
    ...(registry?.checks() ?? []),
  ]) {
    try {
      const results = await check.run(context);
      checks.push(
        ...(extensionChecks.has(check)
          ? results.map(({ params: _params, ...result }) => result)
          : results),
      );
    } catch (error) {
      // One failing check never costs the page; it shows as unchecked.
      logger?.warn(
        {
          check: check.id,
          error: error instanceof Error ? error.name : 'Error',
        },
        'A distributed status check failed.',
      );
      checks.push({
        id: 'checkFailed',
        level: 'recommended',
        title: 'A check could not run',
        detail: `The check "${check.id}" failed; see the application log.`,
        params: { check: check.id },
      });
    }
  }
  const extensions: Record<string, unknown> = {};
  for (const [key, entry] of registry?.data() ?? []) {
    try {
      // The declared fields are the allow-list: values are copied one by one, never an object as a whole.
      extensions[key] =
        projectDistributedData(entry.fields, await entry.read(context)) ?? {};
    } catch (error) {
      logger?.warn(
        { data: key, error: error instanceof Error ? error.name : 'Error' },
        'Distributed status data could not be read.',
      );
    }
  }
  return {
    mode,
    services,
    idGeneration,
    checks: sortChecks(checks),
    extensions,
  };
}

const LEVEL_ORDER = { required: 0, recommended: 1, ok: 2 } as const;

function sortChecks(
  checks: readonly DistributedCheckResult[],
): DistributedCheckResult[] {
  return checks
    .map((check, index) => ({ check, index }))
    .sort(
      (a, b) =>
        LEVEL_ORDER[a.check.level] - LEVEL_ORDER[b.check.level] ||
        a.index - b.index,
    )
    .map(({ check }) => check);
}

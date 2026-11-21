import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { concurrencyServiceToken } from '@nocobase/app-plugin-concurrency/server';
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
  const userProvided = (path: string): boolean =>
    config.isUserProvided?.(path) ?? false;
  const describe = (
    key: DistributedServiceKey,
  ): ServiceDescription | undefined => {
    try {
      switch (key) {
        case 'caching':
          return container.has(cachingToken)
            ? container.resolve(cachingToken).describe()
            : undefined;
        case 'concurrency':
          return container.has(concurrencyServiceToken)
            ? container.resolve(concurrencyServiceToken).describe?.()
            : undefined;
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
  const services = (
    Object.keys(SERVICE_CONFIG_PATHS) as DistributedServiceKey[]
  ).map((key): DistributedService => {
    const description = describe(key);
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
  const mode =
    services.some((service) => service.sharing === 'shared') ||
    idGeneration.mode === 'auto'
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
      checks.push(...(await check.run(context)));
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
  for (const [key, read] of registry?.data() ?? []) {
    try {
      extensions[key] = await read(context);
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

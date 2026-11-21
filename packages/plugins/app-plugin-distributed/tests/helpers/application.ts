// db-test-portability: dialect-specific — a fake configuration names SQLite to exercise the database check; no database is opened
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { concurrencyServiceToken } from '@nocobase/app-plugin-concurrency/server';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { cachingToken } from '@nocobase/app-server/caching';
import { idGeneratorImplementationToken } from '@nocobase/app-server/id-generator';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { queueServiceToken } from '@nocobase/app-server/queue';
import { realtimeBrokerRegistryToken } from '@nocobase/app-server/realtime';
import { ServiceContainer } from '@nocobase/service-provider';
import { vi } from 'vitest';

import {
  createDistributedStatusRegistry,
  distributedStatusToken,
  type DistributedStatusRegistry,
} from '../../server/index.js';

/** Values a leak test looks for anywhere in a response. */
export const SECRETS = [
  'redis.internal',
  'db.internal',
  'hunter2',
  'redis-user',
  'tok_live_123',
  '6379',
] as const;

/** A connection block every fake backend carries, so a copied option shows up in the response. */
const connection = {
  host: 'redis.internal',
  port: 6379,
  username: 'redis-user',
  password: 'hunter2',
  token: 'tok_live_123',
};

type Sharing = 'local' | 'shared' | 'unknown';

export interface ServiceShape {
  readonly default?: string | null;
  readonly adapter: string;
  readonly sharing: Sharing;
  readonly registered?: boolean;
  readonly selections?: readonly { consumer?: string; backend: string }[];
  /** Further configured backends, beside the default one. */
  readonly backends?: readonly {
    name: string;
    adapter: string;
    sharing: Sharing;
  }[];
}

export interface ApplicationOptions {
  readonly identity?: 'anonymous' | 'authenticated';
  readonly can?: (request: unknown) => Promise<boolean>;
  readonly services?: Partial<
    Record<
      'caching' | 'concurrency' | 'jobs' | 'queue' | 'realtime',
      ServiceShape | null
    >
  >;
  readonly config?: Record<string, unknown>;
  readonly userProvided?: readonly string[];
  readonly localDiskUsage?: {
    defaultDiskIsLocal: boolean;
    collections: { connection: string; collection: string }[];
    uncheckedConnections?: string[];
  };
  readonly autoWorkerIds?: boolean;
  readonly registry?: DistributedStatusRegistry;
}

const LOCAL: Record<string, ServiceShape> = {
  caching: { default: 'memory', adapter: 'memory', sharing: 'local' },
  concurrency: { default: 'memory', adapter: 'mutex', sharing: 'local' },
  jobs: { default: null, adapter: 'memory', sharing: 'local' },
  queue: { default: null, adapter: 'inMemory', sharing: 'local' },
  realtime: { default: null, adapter: 'inMemory', sharing: 'local' },
};

/** A description as a careless service might return it: with its configuration attached. */
function leakyDescription(shape: ServiceShape) {
  return {
    default: shape.default ?? null,
    adapter: shape.adapter,
    sharing: shape.sharing,
    registered: shape.registered ?? true,
    options: connection,
    url: 'redis://redis-user:hunter2@redis.internal:6379',
    backends: [
      {
        name: shape.default ?? 'default',
        adapter: shape.adapter,
        sharing: shape.sharing,
        registered: shape.registered ?? true,
        connection,
      },
      ...(shape.backends ?? []).map((backend) => ({
        ...backend,
        registered: true,
        connection,
      })),
    ],
    selections: (shape.selections ?? []).map((selection) => ({
      ...selection,
      connection,
    })),
  };
}

export const DEFAULT_CONFIG: Record<string, unknown> = {
  database: {
    default: 'main',
    connections: {
      main: { dialect: 'sqlite', filename: 'storage/db/main.sqlite' },
      reports: {
        dialect: 'postgres',
        host: 'db.internal',
        username: 'reader',
        password: 'hunter2',
      },
    },
  },
  snowflake: { workerId: 0 },
  secrets: { keys: [] },
  app: {},
  realtime: { broker: { adapter: 'inMemory', options: connection } },
};

export function application(
  options: ApplicationOptions = {},
): AppPluginApplication {
  const container = new ServiceContainer();
  container.singleton(authenticationToken, () => ({
    required:
      () => async (context: { json: unknown }, next: () => Promise<void>) => {
        if (options.identity === 'anonymous')
          return (
            context as { json: (body: unknown, status: number) => unknown }
          ).json({ code: 'UNAUTHENTICATED' }, 401);
        await next();
        return undefined;
      },
  }));
  container.singleton(authorizationToken, () => ({
    middleware:
      () =>
      async (
        context: { set: (key: string, value: unknown) => void },
        next: () => Promise<void>,
      ) => {
        context.set('authz', {
          can: options.can ?? vi.fn().mockResolvedValue(true),
        });
        await next();
      },
  }));
  const services = { ...LOCAL, ...options.services };
  const tokens = {
    caching: cachingToken,
    concurrency: concurrencyServiceToken,
    jobs: jobExecutorServiceToken,
    queue: queueServiceToken,
    realtime: realtimeBrokerRegistryToken,
  } as const;
  for (const [key, token] of Object.entries(tokens)) {
    const shape = services[key];
    if (!shape) continue;
    container.singleton(token as never, () => ({
      describe: () => leakyDescription(shape),
    }));
  }
  if (options.localDiskUsage) {
    const usage = { uncheckedConnections: [], ...options.localDiskUsage };
    container.singleton(serverFileRepositoryManagerToken as never, () => ({
      localDiskUsage: async () => usage,
    }));
  }
  if (options.autoWorkerIds)
    container.singleton(idGeneratorImplementationToken as never, () => ({}));
  container.singleton(
    distributedStatusToken,
    () => options.registry ?? createDistributedStatusRegistry(),
  );
  const config = { ...DEFAULT_CONFIG, ...options.config };
  const userProvided = new Set(options.userProvided ?? []);
  return {
    container,
    config: {
      get: (key: string) => config[key],
      isUserProvided: (path: string) => userProvided.has(path),
    },
  } as unknown as AppPluginApplication;
}

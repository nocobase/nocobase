import type { AppConfigAccessor } from '@nocobase/app-server/config';

import type {
  DistributedCheckLevel,
  DistributedCheckResult,
  DistributedService,
  DistributedServiceKey,
} from '../shared/types.js';
import { REDIS_PLUGINS, sharedBackendSnippet } from '../shared/snippets.js';
import type { DistributedCheck } from './registry.js';

const SERVICE_NAMES: Readonly<Record<DistributedServiceKey, string>> = {
  caching: 'Caching',
  concurrency: 'Concurrency locks',
  jobs: 'Background jobs',
  queue: 'Queue',
  realtime: 'Realtime messages',
};

interface CheckDependencies {
  readonly config: Pick<AppConfigAccessor, 'get'>;
  /** Absent when the file plugin is not registered. */
  readonly localDiskUsage?: () => Promise<{
    readonly defaultDiskIsLocal: boolean;
    readonly collections: readonly string[];
  }>;
}

function blocking(mode: 'single' | 'multi'): DistributedCheckLevel {
  return mode === 'multi' ? 'required' : 'recommended';
}

/** The checks this plugin runs; other plugins add theirs through `distributedStatusToken`. */
export function builtInChecks({
  config,
  localDiskUsage,
}: CheckDependencies): DistributedCheck[] {
  return [
    {
      id: 'database',
      run: ({ mode }) => {
        const database = config.get<{
          default?: unknown;
          connections?: Record<string, { dialect?: unknown } | undefined>;
        }>('database');
        const name =
          typeof database?.default === 'string' ? database.default : undefined;
        const dialect =
          name &&
          database?.connections &&
          Object.hasOwn(database.connections, name)
            ? database.connections[name]?.dialect
            : undefined;
        if (typeof dialect !== 'string') return [];
        return dialect === 'sqlite'
          ? [
              {
                id: 'database.sqlite',
                level: blocking(mode),
                title: 'Database',
                detail:
                  'SQLite serves one instance only. Several instances need PostgreSQL or MySQL.',
                params: { dialect },
                fix: {
                  text: 'Move the data to PostgreSQL or MySQL and point database.connections.main at it.',
                  snippet:
                    'database:\n  connections:\n    main:\n      dialect: postgres\n      # host, database, username and password of the shared database',
                },
              },
            ]
          : [
              {
                id: 'database.shared',
                level: 'ok',
                title: 'Database',
                detail: `${dialect}: every instance connects to the same database.`,
                params: { dialect },
              },
            ];
      },
    },
    {
      id: 'services',
      run: ({ mode, services }) => serviceChecks(mode, services),
    },
    ...(localDiskUsage
      ? [
          {
            id: 'files',
            run: async ({ mode }: { mode: 'single' | 'multi' }) => {
              const usage = await localDiskUsage();
              if (usage.collections.length > 0)
                return [
                  {
                    id: 'files.local',
                    level: blocking(mode),
                    title: 'File storage',
                    detail: `Files in ${usage.collections.join(', ')} are on this host's disk; other instances cannot read them.`,
                    params: { collections: [...usage.collections] },
                    fix: {
                      text: 'Use a shared disk such as S3 for these file collections, and move their existing files there.',
                    },
                  },
                ];
              if (usage.defaultDiskIsLocal)
                return [
                  {
                    id: 'files.defaultLocal',
                    level: blocking(mode),
                    title: 'File storage',
                    detail:
                      "The default disk stores files on this host's disk; other instances cannot read them.",
                    fix: {
                      text: 'Set drive.default to a shared disk such as S3.',
                      snippet:
                        'drive:\n  default: s3\n  disks:\n    s3:\n      driver: s3\n      # bucket, region and credentials of the shared storage',
                    },
                  },
                ];
              return [
                {
                  id: 'files.shared',
                  level: 'ok' as const,
                  title: 'File storage',
                  detail: 'No file collection keeps files on this host’s disk.',
                },
              ];
            },
          },
        ]
      : []),
    {
      id: 'idGeneration',
      run: ({ mode, idGeneration }) =>
        idGeneration.mode === 'auto'
          ? [
              {
                id: 'idGeneration.auto',
                level: 'ok',
                title: 'ID generation',
                detail:
                  'Assigned automatically: every instance takes its own worker ID.',
              },
            ]
          : [
              {
                id: 'idGeneration.manual',
                level: blocking(mode),
                title: 'ID generation',
                detail: `Manual worker ID ${idGeneration.workerId ?? '—'}. Two instances with the same worker ID can generate the same IDs.`,
                params: { workerId: idGeneration.workerId ?? '—' },
                fix: {
                  text: 'Give every instance its own SNOWFLAKE_WORKER_ID, or install a plugin that assigns worker IDs automatically.',
                  snippet:
                    'snowflake:\n  workerId: 1 # unique per instance, 0–31',
                },
              },
            ],
    },
    {
      id: 'secrets',
      run: ({ mode }) => {
        const keys = config.get<{ keys?: unknown }>('secrets')?.keys;
        return Array.isArray(keys) && keys.length > 0
          ? [
              {
                id: 'secrets.set',
                level: 'ok',
                title: 'Secrets',
                detail:
                  'secrets.keys is set. Make sure every instance uses the same keys.',
              },
            ]
          : [
              {
                id: 'secrets.missing',
                level: blocking(mode),
                title: 'Secrets',
                detail:
                  'secrets.keys is not set. Every instance needs the same keys to read what the others encrypt.',
                fix: {
                  text: 'Generate a key with openssl rand -hex 32 and set it on every instance.',
                  snippet:
                    'secrets:\n  keys:\n    - version: 1\n      key: <same 64-character hex key on every instance>',
                },
              },
            ];
      },
    },
    {
      id: 'publicOrigin',
      run: ({ mode }) => {
        const origin = config.get<{ publicOrigin?: unknown }>(
          'app',
        )?.publicOrigin;
        if (typeof origin === 'string' && origin)
          return [
            {
              id: 'publicOrigin.set',
              level: 'ok',
              title: 'Public address',
              detail: `app.publicOrigin = ${origin}`,
              params: { origin },
            },
          ];
        return mode === 'multi'
          ? [
              {
                id: 'publicOrigin.missing',
                level: 'required',
                title: 'Public address',
                detail:
                  'app.publicOrigin is not set. Behind a load balancer, links and callbacks need the public address.',
                fix: {
                  text: 'Set app.publicOrigin to the address users open.',
                  snippet: 'app:\n  publicOrigin: https://apps.example.com',
                },
              },
            ]
          : [];
      },
    },
  ];
}

function serviceChecks(
  mode: 'single' | 'multi',
  services: readonly DistributedService[],
): DistributedCheckResult[] {
  const results: DistributedCheckResult[] = [];
  const present = services.filter((service) => service.available);
  for (const service of present) {
    const params = {
      service: service.key,
      adapter: service.adapter,
      configPath: service.configPath,
      plugin: REDIS_PLUGINS[service.key],
    };
    if (!service.registered) {
      results.push({
        id: 'service.unregistered',
        level: 'required',
        title: SERVICE_NAMES[service.key],
        detail: `${service.configPath} selects the adapter "${service.adapter}", which no registered plugin provides. The service fails when it is first used.`,
        params,
        fix: {
          text: `Install and register the plugin that provides "${service.adapter}", or select another backend.`,
        },
      });
      continue;
    }
    if (mode === 'multi' && service.sharing !== 'shared') {
      results.push({
        id: 'service.local',
        level: 'required',
        title: `${SERVICE_NAMES[service.key]} is still local to this instance`,
        detail: `Each instance keeps its own ${service.key} state. Install ${REDIS_PLUGINS[service.key]} and set ${service.configPath} to a Redis backend.`,
        params,
        fix: {
          text: `Install ${REDIS_PLUGINS[service.key]}, register its server plugin, and select it:`,
          snippet: sharedBackendSnippet(service.key),
        },
      });
    }
    if (mode === 'multi')
      for (const selection of service.selections) {
        const backend = service.backends.find(
          ({ name }) => name === selection.backend,
        );
        if (backend && backend.sharing !== 'shared')
          results.push({
            id: 'service.selectionLocal',
            level: 'recommended',
            title: SERVICE_NAMES[service.key],
            detail: `${selection.consumer ?? 'A caller'} explicitly uses the ${service.key} backend "${selection.backend}", which is local to this instance.`,
            params: {
              ...params,
              consumer: selection.consumer ?? '',
              backend: selection.backend,
            },
          });
      }
  }
  if (mode === 'single') {
    const local = present.filter(
      (service) => service.registered && service.sharing !== 'shared',
    );
    if (local.length > 0)
      results.push({
        id: 'services.local',
        level: 'recommended',
        title: 'Shared services',
        detail: `${local.map((service) => SERVICE_NAMES[service.key]).join(', ')}: all local to this instance.`,
        params: { services: local.map((service) => service.key) },
      });
  }
  return results;
}

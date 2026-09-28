import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppQueueConfig } from '@nocobase/queue';
import { createPluginJobLocations } from '@nocobase/app-server/plugins';

const queue: AppConfigFactory<AppQueueConfig> = defineAppConfig(
  ({ paths, plugins }) => ({
    default: 'sync',
    connections: {
      sync: { driver: 'sync' },
      redis: {
        driver: 'redis',
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        keyPrefix: 'nocobase:queue:',
        tls: false,
      },
      database: {
        driver: 'database',
        table: 'queue_jobs',
        schedulesTable: 'queue_schedules',
      },
    },
    worker: {
      queues: ['default'],
      concurrency: 1,
      idleDelay: '2s',
    },
    jobs: {
      locations: [
        paths.server('jobs/**/*.{ts,js}'),
        ...createPluginJobLocations(
          plugins.plugins.map((plugin) => plugin.metadata),
        ),
      ],
      autoLoad: true,
      hotReload: false,
    },
  }),
);

export default queue;

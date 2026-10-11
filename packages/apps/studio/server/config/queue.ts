import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppQueueConfig } from '@nocobase/app-server/queue';

/**
 * Configurations queues can run on. None is the default: until `queue.default` names one, queues run on the
 * built-in memory configuration, which serves one process and writes its pending jobs under storage/queue when the
 * application stops, and which is reported at startup outside development. Name `memory` to keep that choice without
 * the report, or `redis` to share queues across instances.
 */
const queue: AppConfigFactory<AppQueueConfig> = defineAppConfig(
  ({ paths }) => ({
    memory: {
      adapter: 'inMemory',
      persistence: { path: paths.storage('queue') },
    },
    redis: {
      adapter: 'redis',
      connection: { host: '127.0.0.1', port: 6379, db: 0 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { age: 604_800 },
    },
  }),
);

export default queue;

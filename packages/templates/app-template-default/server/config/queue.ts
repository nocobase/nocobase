import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppQueueConfig } from '@nocobase/app-server/queue';

/**
 * Configurations queues can run on. None is the default: until `queue.default` names one, queues run on the
 * built-in memory configuration, which serves one process and writes its pending jobs under storage/queue when the
 * application stops, and which is reported at startup outside development. Name `memory` to keep that choice without
 * the report. Shared Redis queues require explicit registration of @nocobase/app-plugin-queue-redis/server.
 */
const queue: AppConfigFactory<AppQueueConfig> = defineAppConfig(
  ({ paths }) => ({
    memory: {
      adapter: 'inMemory',
      persistence: { path: paths.storage('queue') },
    },
  }),
);

export default queue;

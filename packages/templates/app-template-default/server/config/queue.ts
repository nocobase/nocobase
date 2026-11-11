import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import {
  validateAppQueueConfig,
  type AppQueueConfig,
} from '@nocobase/app-server/queue';

/** Single-process persistence. Without default, the built-in local configuration remains selected. */
const queue: AppConfigFactory<AppQueueConfig> = defineAppConfig({
  defaults: ({ paths }) => ({
    backends: {
      memory: {
        adapter: 'inMemory',
        persistence: { path: paths.storage('queue') },
      },
    },
  }),
  validate: validateAppQueueConfig,
});

export default queue;

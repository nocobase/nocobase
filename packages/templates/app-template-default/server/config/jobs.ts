import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import {
  validateAppJobsConfig,
  type AppJobsConfig,
} from '@nocobase/app-server/jobs';

/** Single-process persistence. Without default, the built-in local configuration remains selected. */
const jobs: AppConfigFactory<AppJobsConfig> = defineAppConfig({
  defaults: ({ paths }) => ({
    backends: {
      memory: {
        adapter: 'memory',
        persistence: { path: paths.storage('jobs') },
      },
    },
  }),
  validate: validateAppJobsConfig,
});

export default jobs;

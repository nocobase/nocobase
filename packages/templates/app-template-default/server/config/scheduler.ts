import type { SchedulerConfig } from '@nocobase/app-plugin-scheduler/server';
import {
  defineAppConfig,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

/**
 * The Scheduler plugin's settings. `jobs` names the `jobs` configuration its schedules run on; left out, they follow
 * `jobs.default` like every other consumer. A name that `jobs` does not define stops the application from starting.
 */
const scheduler: AppConfigFactory<SchedulerConfig> = defineAppConfig({
  env: { SCHEDULER_JOBS: envString('jobs') },
  defaults: () => ({}),
});

export default scheduler;

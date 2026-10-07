import type { QueueExampleConfig } from '@nocobase/app-plugin-queue-example/server';
import {
  defineAppConfig,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

/**
 * The Queue example plugin's settings. `queue` names the `queue` configuration key its queue runs on; left out, the
 * queue follows `queue.default` like every other queue.
 */
const queueExample: AppConfigFactory<QueueExampleConfig> = defineAppConfig({
  env: {
    QUEUE_EXAMPLE_QUEUE: envString('queue', {
      description:
        'The queue configuration the Queue example runs on; queue.default when unset.',
      required: false,
    }),
  },
  defaults: () => ({}),
});

export default queueExample;

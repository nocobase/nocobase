import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppSnowflakeConfig } from '@nocobase/app-server/id-generator';
import { SNOWFLAKE_EPOCH_SECONDS } from '@nocobase/snowflake';

const snowflake: AppConfigFactory<AppSnowflakeConfig> =
  defineAppConfig<AppSnowflakeConfig>({
    defaults: (runtime) =>
      runtime.config.get('snowflake.mode') === 'auto'
        ? { mode: 'auto' }
        : { mode: 'manual', workerId: 0, epoch: SNOWFLAKE_EPOCH_SECONDS },
    validate: (value, context) => {
      if (value.mode === 'auto') {
        if (value.workerId !== undefined)
          context.error(
            'workerId',
            'Automatic mode forbids workerId, including SNOWFLAKE_WORKER_ID.',
          );
        if (value.epoch !== undefined)
          context.error('epoch', 'Automatic mode uses the standard epoch.');
      }
    },
    env: {
      SNOWFLAKE_WORKER_ID: envInteger('workerId', {
        description:
          'A worker ID unique to each concurrently running manual instance, 0 to 31. Forbidden in auto mode.',
      }),
    },
  });

export default snowflake;

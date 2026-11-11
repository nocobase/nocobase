import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppLoggingConfig } from '@nocobase/app-server/logging';

const logging: AppConfigFactory<AppLoggingConfig> = defineAppConfig(
  (runtime) => ({
    level: 'info',
    file: {
      enabled: true,
      name: 'app',
      retentionDays: 7,
      maxFileSizeMB: 10,
      maxTotalSizeMB: 500,
    },
    loggers: {
      request: { file: { name: 'request' } },
    },
    console: { enabled: true, pretty: runtime.env.NODE_ENV !== 'production' },
  }),
);
export default logging;

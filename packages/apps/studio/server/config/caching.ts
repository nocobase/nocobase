import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { CachingConfig } from '@nocobase/caching';

const caching: AppConfigFactory<CachingConfig> = defineAppConfig(
  (_runtime) => ({
    default: 'memory',
    providers: {
      memory: {
        driver: 'memory',
        defaultTtl: '5m',
        maxSize: 2_000,
        useClone: true,
      },
    },
  }),
);

export default caching;

import {
  defineAppConfig,
  envInteger,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

export interface ReadingListConfig {
  readonly pageSize: number;
  readonly integrationKey?: string;
}

export function defineReadingListConfig(): AppConfigFactory<ReadingListConfig> {
  return defineAppConfig<ReadingListConfig>({
    defaults: { pageSize: 20 },
    env: {
      READING_LIST_PAGE_SIZE: envInteger('pageSize'),
      READING_LIST_INTEGRATION_KEY: envString('integrationKey', {
        secret: true,
      }),
    },
    public: ['pageSize'],
    validate(value, context) {
      if (
        !Number.isInteger(value.pageSize) ||
        value.pageSize < 1 ||
        value.pageSize > 100
      ) {
        context.error('pageSize', 'must be an integer from 1 to 100.');
      }
      if (
        value.integrationKey !== undefined &&
        typeof value.integrationKey !== 'string'
      ) {
        context.error('integrationKey', 'must be a string.');
      }
    },
  });
}

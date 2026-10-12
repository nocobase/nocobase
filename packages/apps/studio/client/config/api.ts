import {
  defineAppConfig,
  resolveAppUrl,
  type AppConfigFactory,
} from '@nocobase/app-client';

const api: AppConfigFactory<{ baseURL: string }> = defineAppConfig(
  (_runtime) => ({
    baseURL: resolveAppUrl('/api'),
  }),
);

export default api;

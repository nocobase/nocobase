import { defineAppConfig, type AppConfigFactory } from '@nocobase/app-client';

const app: AppConfigFactory<{ title: string }> = defineAppConfig(
  (_runtime) => ({
    title: 'NocoBase',
  }),
);
export default app;

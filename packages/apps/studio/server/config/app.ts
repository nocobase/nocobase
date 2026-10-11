import {
  defineAppConfig,
  envBoolean,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppIdentityConfig } from '@nocobase/app-server/config';
import {
  joinBasePath,
  normalizeBasePath,
  resolveAppNameFromBasePath,
} from '@nocobase/app-server/support';

const app: AppConfigFactory<AppIdentityConfig> = defineAppConfig({
  env: {
    APP_PUBLIC_ORIGIN: envString('publicOrigin', {
      description:
        'The origin browsers reach the application at, such as https://apps.example.com, for callbacks and redirects.',
      required: false,
    }),
    APP_SAMPLE_DATA: envBoolean('sampleData', {
      description:
        'Load sample data while the database is first installed: seeds declared with sample: true and sampleDataToken registrations.',
      required: false,
      firstStartOnly: true,
    }),
  },
  defaults: (runtime) => {
    const { routing } = runtime;
    const publicBasePath = normalizeBasePath(routing.publicBasePath || '/main');
    return {
      name: routing.name || resolveAppNameFromBasePath(publicBasePath, 'main'),
      publicBasePath,
      internalBasePath: routing.internalBasePath,
      publicApiUrl: joinBasePath(publicBasePath, '/api'),
    };
  },
});

export default app;

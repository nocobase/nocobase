import defaultConfigs from './config/index.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { defineAppRuntime } from '@nocobase/app-client/runtime';

import locales from './locales/index.js';
import plugins from './plugins.js';
import reactProviders from './react-providers.js';
import { createApplicationRoutes } from './routes.js';
import routeComponentOverrides from './route-overrides.js';
import serviceProviders from './service-provider.js';

const appRuntime = defineAppRuntime({
  packageName: 'multi-app-main',
  createAppConfig: createAppClientConfig,
  defaultConfigs,
  serviceProviders,
  locales,
  reactProviders,
  routes: () => createApplicationRoutes(),
  routeComponentOverrides,
  plugins,
});

export default appRuntime;

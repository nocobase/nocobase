import defaultConfigs from './config/index.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { defineAppRuntime } from '@nocobase/app-client/runtime';

import locales from './locales/index.js';
import plugins from './plugins.js';
import reactProviders from './react-providers.js';
import routeComponentOverrides from './route-overrides.js';
import routes from './routes.js';
import serviceProviders from './service-provider.js';
import sourceExtensions from './source-extensions.js';

const appRuntime = defineAppRuntime({
  packageName: '@nocobase/app-template-hub',
  createAppConfig: createAppClientConfig,
  defaultConfigs,
  serviceProviders,
  locales,
  reactProviders,
  routes,
  plugins,
  routeComponentOverrides,
  sourceExtensions,
});

export default appRuntime;

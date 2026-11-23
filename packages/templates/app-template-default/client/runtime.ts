import defaultConfigs from './config/index.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { defineAppRuntime } from '@nocobase/app-client/runtime';

import { headerActionOverrides, headerActions } from './header-actions.js';
import locales from './locales/index.js';
import plugins from './plugins.js';
import reactProviders from './react-providers.js';
import { createApplicationRoutes } from './routes.js';
import serviceProviders from './service-provider.js';

const appRuntime = defineAppRuntime({
  packageName: '@nocobase/app-template-default',
  createAppConfig: createAppClientConfig,
  defaultConfigs,
  serviceProviders,
  locales,
  reactProviders,
  routes: () => createApplicationRoutes(),
  plugins,
  systemSettingsRoutes: true,
  personalSettingsRoutes: true,
  headerActions,
  headerActionOverrides,
});

export default appRuntime;

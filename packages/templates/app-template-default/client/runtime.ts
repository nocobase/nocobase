import defaultConfigs from './config/index.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { defineAppRuntime } from '@nocobase/app-client/runtime';

import {
  headerActionOverrides,
  createHeaderActions,
} from './header-actions.js';
import locales from './locales/index.js';
import plugins from './plugins.js';
import reactProviders from './react-providers.js';
import { createApplicationRoutes } from './routes.js';
import serviceProviders from './service-provider.js';

const packageName = '@nocobase/app-template-default';

const appRuntime = defineAppRuntime({
  packageName,
  createAppConfig: createAppClientConfig,
  defaultConfigs,
  serviceProviders,
  locales,
  reactProviders,
  routes: () => createApplicationRoutes(),
  plugins,
  headerActions: createHeaderActions(packageName),
  headerActionOverrides,
});

export default appRuntime;

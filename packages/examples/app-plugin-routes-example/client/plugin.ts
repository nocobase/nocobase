import locales from './locales/index.js';
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import reactProviders from './react-providers.js';
import routes, { settingsRoutes } from './routes.js';

const routesExample: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-routes-example',
  locales,
  routes: [routes, settingsRoutes],
  reactProviders,
});

export default routesExample;

import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';

/**
 * The plugins page under System settings › System, and redirects from the earlier App Foundation pages. Takes no
 * options; an application replaces the page with `routeComponentOverrides: { plugins }`.
 */
const foundation: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-foundation',
  locales,
  routes: [routes],
});

export default foundation;

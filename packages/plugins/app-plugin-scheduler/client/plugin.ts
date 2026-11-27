import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { schedulerSettingsRoutes } from './routes.js';

/**
 * Registers the plugin's locales and its System settings page, Schedules (`client/routes.ts`), at
 * `/settings/automation/schedules`. An application replaces the page with `routeComponentOverrides`.
 */
const scheduler: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-scheduler',
  locales,
  routes: [schedulerSettingsRoutes],
});

export default scheduler;

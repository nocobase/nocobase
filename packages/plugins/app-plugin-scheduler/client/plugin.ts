import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';

/**
 * Registers the plugin's locales, which hold the titles its server registers with the authorization catalog. It
 * contributes no pages: an application that lists schedules builds the page on the scheduler API among its own routes.
 */
const scheduler: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-scheduler',
  locales,
});

export default scheduler;

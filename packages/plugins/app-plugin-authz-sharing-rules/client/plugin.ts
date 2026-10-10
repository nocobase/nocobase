import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';

/**
 * Registers the locales for the resource title the plugin's server registers with the authorization catalog. It
 * contributes no pages: an application that edits these rules builds its page on the plugin's API among its own routes.
 */
const authzSharingRules: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-authz-sharing-rules',
  locales,
});

export default authzSharingRules;

import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './service-provider.js';

/**
 * Registers the locales for the resource title the plugin's server registers with the authorization catalog, and adds
 * Sharing rules to the Data rules of the authorization plugin's Roles and permissions page.
 */
const authzSharingRules: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-authz-sharing-rules',
  locales,
  serviceProviders,
});

export default authzSharingRules;

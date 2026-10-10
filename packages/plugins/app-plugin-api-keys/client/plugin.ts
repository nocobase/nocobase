import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

/**
 * Registers the plugin with the client application. It contributes no pages: an application that wants a page for
 * managing keys builds it on `apiKeyClient` and declares it among its own routes.
 */
const apiKeys: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-api-keys',
});

export default apiKeys;

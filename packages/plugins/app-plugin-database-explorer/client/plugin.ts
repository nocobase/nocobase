import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

/**
 * Registers the plugin with the client application. It contributes no pages: an application that wants to browse its
 * schema builds a page on `DatabaseExplorerClient` and declares it among its own routes.
 */
const databaseExplorer: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-database-explorer',
});

export default databaseExplorer;

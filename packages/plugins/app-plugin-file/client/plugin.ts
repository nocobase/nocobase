import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import locales from './locales/index.js';
import serviceProviders from './providers/index.js';
import routes from './routes.js';
const plugin: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-file',
  serviceProviders,
  locales,
  routes: [routes],
});
export default plugin;

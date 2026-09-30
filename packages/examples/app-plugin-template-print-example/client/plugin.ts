import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';

const plugin: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-template-print-example',
  routes,
  locales,
});

export default plugin;

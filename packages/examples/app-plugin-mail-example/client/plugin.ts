import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';

const mailExample: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-mail-example',
  locales,
  routes,
});

export default mailExample;

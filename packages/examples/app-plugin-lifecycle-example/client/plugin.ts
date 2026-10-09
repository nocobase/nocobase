import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';

const lifecycleExample: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-lifecycle-example',
  locales,
  routes,
});

export default lifecycleExample;

import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';

const repositoryExample: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-repository-example',
  locales,
  routes,
});

export default repositoryExample;

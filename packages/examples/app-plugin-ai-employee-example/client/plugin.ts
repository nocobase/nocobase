import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';

const aiEmployeeExample: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-ai-employee-example',
  locales,
  routes,
});

export default aiEmployeeExample;

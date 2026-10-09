import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';

const officeFlowsExample: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-office-flows-example',
  locales,
  routes,
});

export default officeFlowsExample;

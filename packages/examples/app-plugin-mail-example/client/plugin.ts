import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './service-provider.js';

const mailExample: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-mail-example',
  locales,
  serviceProviders,
});

export default mailExample;

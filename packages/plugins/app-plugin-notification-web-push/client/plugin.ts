import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './service-provider.js';

const webPush: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-notification-web-push',
  serviceProviders,
  locales,
});

export default webPush;

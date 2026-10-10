import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';

const notificationInApp: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-notification-in-app',
  locales,
});

export default notificationInApp;

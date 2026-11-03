import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';

const webPush: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-notification-web-push',
  locales,
});

export default webPush;

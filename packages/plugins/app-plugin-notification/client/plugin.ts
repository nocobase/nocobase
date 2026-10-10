import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './service-provider.js';

export interface NotificationClientOptions {
  readonly placeholder?: never;
}

const notification: AppClientPluginFactory<NotificationClientOptions> =
  defineClientPlugin({
    packageName: '@nocobase/app-plugin-notification',
    serviceProviders,
    locales,
  });

export default notification;

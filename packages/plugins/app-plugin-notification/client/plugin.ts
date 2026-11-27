import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import {
  createNotificationRoutes,
  type NotificationRouteOptions,
} from './routes.js';
import serviceProviders from './service-provider.js';

export type NotificationClientOptions = NotificationRouteOptions;

const notification: AppClientPluginFactory<NotificationClientOptions> =
  defineClientPlugin({
    packageName: '@nocobase/app-plugin-notification',
    serviceProviders,
    locales,
    routes: (options: NotificationClientOptions) =>
      createNotificationRoutes(options ?? {}),
  });

export default notification;

import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

import type { NotificationProviderApplicationConfig } from './providers/notification.js';
import locales from './locales/index.js';

const notificationPlugin: AppServerPlugin<NotificationProviderApplicationConfig> =
  defineServerPlugin<NotificationProviderApplicationConfig>({
    baseDir: path.resolve(import.meta.dirname, '..'),
    packageName: '@nocobase/app-plugin-notification',
    locales,
    serviceProviders,
    routes,
    database: {
      migrations: './database/migrations',
      seeds: './database/seeds',
    },
  });

export default notificationPlugin;

import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';

const messageBrokerPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-message-broker',
  serviceProviders,
  database: {
    migrations: './database/migrations',
  },
});

export default messageBrokerPlugin;

import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes from './routes/index.js';
import locales from './locales/index.js';

const authorizationPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-authorization',
  serviceProviders,
  routes,
  locales,
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default authorizationPlugin;

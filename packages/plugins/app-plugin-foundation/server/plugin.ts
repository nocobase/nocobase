import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const foundationPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-foundation',
  serviceProviders,
  routes,
  // Only the migration that drops the snapshot table an earlier version kept remains in use.
  database: { migrations: './database/migrations' },
});

export default foundationPlugin;

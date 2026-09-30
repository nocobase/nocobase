import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import { __NOCOBASE_SYMBOL_NAME__JobsProvider } from './jobs/provider.js';
import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const __NOCOBASE_MODULE_NAME__Plugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, ".."),
  packageName: __NOCOBASE_PACKAGE_NAME_LITERAL__,
  serviceProviders: [...serviceProviders, __NOCOBASE_SYMBOL_NAME__JobsProvider],
  routes,
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default __NOCOBASE_MODULE_NAME__Plugin;

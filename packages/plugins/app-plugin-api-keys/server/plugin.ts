import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import { ApiKeysProvider } from './providers/api-keys.js';

const apiKeysPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-api-keys',
  serviceProviders: [ApiKeysProvider],
  database: {
    migrations: './database/migrations',
  },
});

export default apiKeysPlugin;

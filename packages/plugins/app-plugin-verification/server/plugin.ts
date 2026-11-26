import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const verificationPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-verification',
  serviceProviders,
  routes,
  database: {
    migrations: './database/migrations',
  },
});

export default verificationPlugin;

import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const projectsPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-projects',
  locales: () => import('./locales/index.js'),
  serviceProviders,
  routes,
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default projectsPlugin;

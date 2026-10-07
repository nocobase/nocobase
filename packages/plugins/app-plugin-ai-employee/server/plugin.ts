import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import locales from './locales/index.js';
import serviceProviders from './provider/index.js';
import routes from './route/plugin.js';
export { aiManagerToken } from './provider/ai-employee.js';

const aiEmployeePlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-ai-employee',
  locales,
  serviceProviders,
  routes,
  database: {
    migrations: './database/migrations',
  },
});

export default aiEmployeePlugin;

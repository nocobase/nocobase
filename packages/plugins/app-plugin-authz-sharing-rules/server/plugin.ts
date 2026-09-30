import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import locales from './locales/index.js';

const authzSharingRulesPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-authz-sharing-rules',
  locales,
  database: {
    migrations: './database/migrations',
  },
});

export default authzSharingRulesPlugin;

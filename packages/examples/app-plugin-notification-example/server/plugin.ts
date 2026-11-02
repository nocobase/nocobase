import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import routes from './routes/index.js';
import { TaskRealtimeProvider } from './task-realtime.js';

const notificationExamplePlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-notification-example',
  routes,
  serviceProviders: [TaskRealtimeProvider],
  database: {
    migrations: './database/migrations',
  },
});

export default notificationExamplePlugin;

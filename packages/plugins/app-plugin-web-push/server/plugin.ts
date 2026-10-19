import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import { createDeviceRoutes } from './routes/devices.js';
import { createWorkerRoutes, type PushWorkerOptions } from './worker.js';

export function defineWebPushPlugin(
  worker: PushWorkerOptions = {},
): AppServerPlugin {
  return defineServerPlugin({
    baseDir: path.resolve(import.meta.dirname, '..'),
    packageName: '@nocobase/app-plugin-web-push',
    serviceProviders,
    routes: [createDeviceRoutes(), createWorkerRoutes(worker)],
    database: {
      migrations: './database/migrations',
    },
  });
}

const plugin: AppServerPlugin = defineWebPushPlugin();
export default plugin;

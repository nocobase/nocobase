import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import serviceProviders from './providers/index.js';
import { storageRoutes } from './storage-routes.js';

export interface FileServerPluginOptions {
  /** Register the storage overview and disk check endpoints. Defaults to true. */
  storageManagementRoutes?: boolean;
}

export function createFileServerPlugin(
  options: FileServerPluginOptions = {},
): AppServerPlugin {
  return defineServerPlugin({
    baseDir: path.resolve(import.meta.dirname, '..'),
    packageName: '@nocobase/app-plugin-file',
    serviceProviders,
    routes: options.storageManagementRoutes === false ? [] : [storageRoutes],
  });
}

export default createFileServerPlugin();

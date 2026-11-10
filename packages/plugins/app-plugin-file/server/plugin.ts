import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import { uploadLimitRoutes } from './upload-limit.routes.js';
import serviceProviders from './providers/index.js';
const plugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-file',
  serviceProviders,
  routes: [uploadLimitRoutes],
});
export default plugin;

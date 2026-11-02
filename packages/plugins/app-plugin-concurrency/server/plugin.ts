import path from 'node:path';
import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import serviceProviders from './providers/index.js';

const concurrency: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-concurrency',
  baseDir: path.resolve(import.meta.dirname, '..'),
  serviceProviders,
});
export default concurrency;

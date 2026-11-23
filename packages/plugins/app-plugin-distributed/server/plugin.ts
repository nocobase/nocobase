import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import { DistributedStatusProvider } from './provider.js';
import routes from './routes/index.js';

const distributed: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-distributed',
  baseDir: path.resolve(import.meta.dirname, '..'),
  serviceProviders: [DistributedStatusProvider],
  routes,
});

export default distributed;

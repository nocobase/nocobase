import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import metadata from '../package.json' with { type: 'json' };
import serviceProviders from './providers/index.js';
import { readingListRoutes } from './routes.js';

const plugin: AppServerPlugin = defineServerPlugin({
  packageName: metadata.name,
  baseDir: path.resolve(import.meta.dirname, '..'),
  database: { migrations: './database/migrations' },
  serviceProviders,
  routes: [readingListRoutes],
});

export default plugin;
export { defineReadingListConfig, type ReadingListConfig } from './config.js';
export { readingListToken, type ReadingEntry } from './service.js';

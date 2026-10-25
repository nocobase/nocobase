import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes from './routes/index.js';
import { indexingProvider } from './providers/indexing.js';
import { sqliteVecIndexingExtension } from './extension/sqlite-vec/index.js';
import { pgvectorIndexingExtension } from './extension/pgvector/index.js';
import type { KnowledgeIndexingExtension } from './indexing/types.js';

export function createKnowledgePlugin(
  options: {
    readonly indexingExtensions?: readonly KnowledgeIndexingExtension[];
  } = {},
): AppServerPlugin {
  return defineServerPlugin({
    baseDir: path.resolve(import.meta.dirname, '..'),
    packageName: '@nocobase/app-plugin-knowledge',
    locales: () => import('./locales/index.js'),
    serviceProviders: [
      ...serviceProviders,
      indexingProvider([
        sqliteVecIndexingExtension,
        pgvectorIndexingExtension,
        ...(options.indexingExtensions ?? []),
      ]),
    ],
    routes,
    database: {
      migrations: './database/migrations',
    },
  });
}

const knowledgePlugin: AppServerPlugin = createKnowledgePlugin();
export default knowledgePlugin;

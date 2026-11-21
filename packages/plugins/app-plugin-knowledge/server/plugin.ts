import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes, { createApiRoutes } from './routes/index.js';
import { indexingProvider } from './providers/indexing.js';
import { sqliteVecIndexingExtension } from './extension/sqlite-vec/index.js';
import { pgvectorIndexingExtension } from './extension/pgvector/index.js';
import type { KnowledgeIndexingExtension } from './indexing/types.js';

export interface KnowledgePluginOptions {
  /**
   * `false` leaves semantic indexing out: no index provider or backends, no `/knowledge` indexing routes and no
   * `kb.indexing` settings item, so search ranks with the built-in text match only. Defaults to `true`.
   */
  readonly indexing?: boolean;
  /** Index backends beside the built-in sqlite-vec and pgvector ones; only with indexing on. */
  readonly indexingExtensions?: readonly KnowledgeIndexingExtension[];
}

export function createKnowledgePlugin(
  options: KnowledgePluginOptions = {},
): AppServerPlugin {
  const indexing = options.indexing !== false;
  if (!indexing && options.indexingExtensions?.length)
    throw new TypeError(
      'Knowledge indexing extensions require indexing; remove them or leave `indexing` on.',
    );
  return defineServerPlugin({
    baseDir: path.resolve(import.meta.dirname, '..'),
    packageName: '@nocobase/app-plugin-knowledge',
    locales: () => import('./locales/index.js'),
    serviceProviders: indexing
      ? [
          ...serviceProviders,
          indexingProvider([
            sqliteVecIndexingExtension,
            pgvectorIndexingExtension,
            ...(options.indexingExtensions ?? []),
          ]),
        ]
      : serviceProviders,
    routes: indexing ? routes : [createApiRoutes({ indexing: false })],
    database: {
      migrations: './database/migrations',
    },
  });
}

const knowledgePlugin: AppServerPlugin = createKnowledgePlugin();
export default knowledgePlugin;

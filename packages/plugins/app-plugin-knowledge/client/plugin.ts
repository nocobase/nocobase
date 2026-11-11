import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import type { IndexingFormDefinition } from './indexing/types.js';
import { KnowledgeIndexingFormsProvider } from './indexing/provider.js';
import locales from './locales/index.js';
import { createKnowledgeRoutes, type KnowledgeRouteOptions } from './routes.js';

export interface KnowledgeClientOptions extends KnowledgeRouteOptions {
  /**
   * `false` leaves the page unregistered, for an application that routes it itself from `client/pages.ts`. Defaults to
   * `true`.
   */
  readonly routes?: boolean;
  /**
   * `false` matches a server composed with `createKnowledgePlugin({ indexing: false })`: the index form registry stays
   * unregistered, so `KnowledgeIndexingEntry` renders nothing. Defaults to `true`.
   */
  readonly indexing?: boolean;
  readonly indexingForms?: readonly IndexingFormDefinition[];
}

const knowledge: AppClientPluginFactory<KnowledgeClientOptions> =
  defineClientPlugin<KnowledgeClientOptions>({
    packageName: '@nocobase/app-plugin-knowledge',
    locales,
    serviceProviders: (options) =>
      options.indexing === false ? [] : [KnowledgeIndexingFormsProvider],
    routes: (options) =>
      options.routes === false ? [] : createKnowledgeRoutes(options),
  });

export default knowledge;

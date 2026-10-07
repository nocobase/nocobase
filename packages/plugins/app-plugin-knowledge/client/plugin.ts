import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { createKnowledgeRoutes, type KnowledgeRouteOptions } from './routes.js';

export interface KnowledgeClientOptions extends KnowledgeRouteOptions {
  /**
   * `false` leaves the page unregistered, for an application that routes it itself from `client/pages.ts`. Defaults to
   * `true`.
   */
  readonly routes?: boolean;
}

const knowledge: AppClientPluginFactory<KnowledgeClientOptions> =
  defineClientPlugin<KnowledgeClientOptions>({
    packageName: '@nocobase/app-plugin-knowledge',
    locales,
    routes: (options) =>
      options.routes === false ? [] : createKnowledgeRoutes(options),
  });

export default knowledge;

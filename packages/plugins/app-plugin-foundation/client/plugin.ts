import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import {
  createFoundationRoutes,
  type FoundationRouteOptions,
} from './routes.js';

export interface FoundationClientOptions extends FoundationRouteOptions {
  /**
   * `false` leaves the page unregistered, for an application that routes `FoundationPage` itself. Defaults to `true`.
   */
  readonly routes?: boolean;
}

const foundation: AppClientPluginFactory<FoundationClientOptions> =
  defineClientPlugin<FoundationClientOptions>({
    packageName: '@nocobase/app-plugin-foundation',
    locales,
    routes: (options) =>
      options.routes === false ? [] : createFoundationRoutes(options),
  });

export default foundation;

import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { createReleasesRoutes, type ReleasesRouteOptions } from './routes.js';
import serviceProviders from './service-provider.js';

export interface ReleasesClientOptions extends ReleasesRouteOptions {
  /**
   * `false` leaves the pages unregistered, for an application that routes them itself from `client/pages.ts` (under a
   * navigation group or settings area of its own). Defaults to `true`.
   */
  readonly routes?: boolean;
}

const releases: AppClientPluginFactory<ReleasesClientOptions> =
  defineClientPlugin<ReleasesClientOptions>({
    packageName: '@nocobase/app-plugin-releases',
    locales,
    serviceProviders,
    routes: (options) =>
      options.routes === false ? [] : createReleasesRoutes(options),
  });

export default releases;

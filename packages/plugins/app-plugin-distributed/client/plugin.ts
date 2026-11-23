import {
  defineClientPlugin,
  type AppClientPluginFactory,
  type AppClientRouteComponentLoader,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes, { DISTRIBUTED_STATUS_ROUTE_ID } from './routes.js';
import { DistributedStatusSlotsProvider } from './slots.js';

export interface DistributedClientOptions {
  /** Replaces the whole status page; the replacement reads the same `GET /api/distributed/status`. */
  readonly statusComponentLoader?: AppClientRouteComponentLoader;
}

const distributed: AppClientPluginFactory<DistributedClientOptions> =
  defineClientPlugin<DistributedClientOptions>({
    packageName: '@nocobase/app-plugin-distributed',
    locales,
    serviceProviders: [DistributedStatusSlotsProvider],
    routes,
    routeComponentOverrides: (options) =>
      options?.statusComponentLoader
        ? [
            {
              routeId: DISTRIBUTED_STATUS_ROUTE_ID,
              componentLoader: options.statusComponentLoader,
            },
          ]
        : [],
  });

export default distributed;

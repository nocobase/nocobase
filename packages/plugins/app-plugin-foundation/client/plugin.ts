import {
  defineAppRoutes,
  defineClientPlugin,
  SETTINGS_ROUTE_PATH,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import { createElement } from 'react';
import { Navigate, useLocation } from 'react-router';

import locales from './locales/index.js';
import {
  createFoundationRoutes,
  foundationDefinition,
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
    routes: (options) => {
      if (options.routes === false) return [];
      const { path, auth, authz } = foundationDefinition(options);
      const settings = createFoundationRoutes(options);
      if (path.startsWith(SETTINGS_ROUTE_PATH + '/')) return settings;
      return [
        settings,
        defineAppRoutes([
          {
            name: 'legacyFoundation',
            path,
            auth,
            authz,
            componentLoader: async () => ({
              default: function LegacyFoundationRedirect() {
                const { search, hash } = useLocation();
                return createElement(Navigate, {
                  replace: true,
                  to: { pathname: SETTINGS_ROUTE_PATH + path, search, hash },
                });
              },
            }),
          },
        ]),
      ];
    },
  });

export default foundation;

import {
  defineClientPlugin,
  defineClientReactProviders,
  type AppClientRouteComponentLoader,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { UserLocaleProvider } from './locale-provider.js';
import routes, { INVITE_ROUTE_ID } from './routes.js';

export interface UsersClientOptions {
  /** Replaces the invitation page, for example to match the application's own sign-in pages. */
  readonly inviteComponentLoader?: AppClientRouteComponentLoader;
}

/**
 * Registers the invitation page an invitation email links to. The plugin contributes no user management page: an
 * application that manages users builds that page on `UsersClient` and declares it among its own routes.
 */
const users: AppClientPluginFactory<UsersClientOptions> = defineClientPlugin({
  packageName: '@nocobase/app-plugin-users',
  locales,
  reactProviders: defineClientReactProviders([
    {
      name: 'localePreference',
      component: UserLocaleProvider,
      after: ['@nocobase/app-plugin-authentication:authentication'],
    },
  ]),
  routes,
  routeComponentOverrides: (options) =>
    options.inviteComponentLoader
      ? [
          {
            routeId: INVITE_ROUTE_ID,
            componentLoader: options.inviteComponentLoader,
          },
        ]
      : [],
});

export default users;

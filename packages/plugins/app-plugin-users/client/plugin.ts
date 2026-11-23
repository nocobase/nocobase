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
 * Registers User management under System settings (`/settings/users`, with its New user dialog and Edit user drawer)
 * and the invitation page an invitation email links to. An application replaces any of the management pages through
 * `routeComponentOverrides` with `USERS_ROUTE_ID`, `USER_CREATE_ROUTE_ID` or `USER_EDIT_ROUTE_ID`.
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

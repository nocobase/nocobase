import {
  defineClientPlugin,
  type AppClientRouteComponentLoader,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import {
  createUsersRoutes,
  INVITE_ROUTE_ID,
  USERS_ROUTE_ID,
} from './routes.js';

export interface UsersClientOptions {
  readonly mount?: 'settings' | 'app';
  /** Path relative to the selected mount, for example `/users`. */
  readonly path?: string;
  readonly title?: string;
  /** Replaces only the page implementation; mount and path remain owned here. */
  readonly componentLoader?: AppClientRouteComponentLoader;
  /** Replaces the invitation page, for example to match the application's own sign-in pages. */
  readonly inviteComponentLoader?: AppClientRouteComponentLoader;
}

const users: AppClientPluginFactory<UsersClientOptions> = defineClientPlugin({
  packageName: '@nocobase/app-plugin-users',
  locales,
  routes: (options) => createUsersRoutes(options),
  routeComponentOverrides: (options) => [
    ...(options.componentLoader
      ? [{ routeId: USERS_ROUTE_ID, componentLoader: options.componentLoader }]
      : []),
    ...(options.inviteComponentLoader
      ? [
          {
            routeId: INVITE_ROUTE_ID,
            componentLoader: options.inviteComponentLoader,
          },
        ]
      : []),
  ],
});

export default users;

import type { ReactElement } from 'react';
import { beforeEach } from 'vitest';
import { renderWithApp } from '@nocobase/app-testing/client';
import {
  defineClientPlugin,
  defineClientReactProviders,
} from '@nocobase/app-client/plugins';
import {
  AuthenticationProvider,
  authenticationClientToken,
  type AuthClient,
} from '@nocobase/app-plugin-authentication/client';

import { apiClientToken } from '@nocobase/app-client';
import { AuthorizationClient } from '../../client/authorization-client.js';
import locales from '../../client/locales/index.js';
import type { AuthorizationClientOptions } from '../../client/plugin.js';
import reactProviders from '../../client/react-providers.js';
import { authorizationSettingsRoutes } from '../../client/routes.js';
import { authorizationSettingsProvider } from '../../client/service-provider.js';
import { authorizationClientToken } from '../../client/tokens.js';

/** The namespace the Roles and permissions pages translate in. */
export const AUTHORIZATION_SETTINGS_NAMESPACE =
  '@nocobase/app-plugin-authorization';

export type SettingsRenderOptions = Parameters<typeof renderWithApp>[1] & {
  /** The plugin's options, as an application passes them in `client/plugins.ts`. */
  readonly authorization?: AuthorizationClientOptions;
};

// The authentication plugin's provider without its services: the session below stands in for its client.
const signedIn = defineClientPlugin({
  packageName: '@nocobase/app-plugin-authentication',
  reactProviders: defineClientReactProviders([
    { name: 'authentication', component: AuthenticationProvider },
  ]),
})();

/**
 * This plugin as an application registers it, except that its client answers at once: the real one waits for the
 * realtime connection a test application never opens.
 */
const authorization = (options: AuthorizationClientOptions) =>
  defineClientPlugin<AuthorizationClientOptions>({
    packageName: '@nocobase/app-plugin-authorization',
    locales,
    serviceProviders: (settings) => [authorizationSettingsProvider(settings)],
    reactProviders,
    routes: (settings) =>
      settings.routes === false ? [] : [authorizationSettingsRoutes()],
  })(options);

// Presentation tests answer the API with doubles; native authentication is exercised separately against the server.
beforeEach(() => window.sessionStorage.clear());

/**
 * Renders a Roles and permissions page in a started application with this plugin registered, so the page reads its
 * real services, extension points and translations. A signed-in session stands in for the authentication plugin.
 */
export function renderSettingsClient(
  ui: ReactElement,
  options: SettingsRenderOptions = {},
): ReturnType<typeof renderWithApp> {
  const { authorization: settings, ...rest } = options;
  return renderWithApp(ui, {
    namespace: AUTHORIZATION_SETTINGS_NAMESPACE,
    ...rest,
    plugins: [signedIn, authorization(settings ?? {}), ...(rest.plugins ?? [])],
    services: (app) => {
      rest.services?.(app);
      app.container.instance(
        authorizationClientToken,
        new AuthorizationClient(app.container.resolve(apiClientToken)),
      );
      app.container.instance(authenticationClientToken, {
        getSession: async () => ({
          data: {
            user: { id: 'settings-test-user' },
            session: { id: 'settings-test-session' },
          },
          error: null,
        }),
      } as unknown as AuthClient);
    },
  });
}

import {
  defineClientPlugin,
  type AppClientPluginFactory,
  type AppClientRouteComponentLoader,
  type AppClientRouteComponentOverrideDefinition,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './service-provider.js';
import reactProviders from './react-provider.js';
import {
  ACCOUNT_SECURITY_ROUTE_ID,
  AUTHENTICATION_SETTINGS_ROUTE_ID,
  personalSettingsRoutes,
  systemSettingsRoutes,
} from './routes.js';

export interface AuthenticationClientOptions {
  /** Replaces System settings › Accounts › Authentication. */
  readonly settingsComponentLoader?: AppClientRouteComponentLoader;
  /** Replaces Personal settings › Account › Account and security. */
  readonly accountSecurityComponentLoader?: AppClientRouteComponentLoader;
  /**
   * The single sign-on or social providers the application's sign-in page shows a button for, by provider id, such as
   * `['github']`. The Authentication page lists only these as sign-in page entries; a provider configured
   * on the server without a button here is shown as configured but not on the sign-in page.
   */
  readonly signInButtons?: readonly string[];
}

/**
 * Creates the Better Auth client and the session provider, and registers two settings pages: Sign-in and
 * authentication in System settings (read-only, behind the `authentication.settings` settings item) and Account and
 * security in Personal settings. Replace either page with the options here or with `routeComponentOverrides` and the
 * route ids `client/routes.ts` exports.
 */
const authentication: AppClientPluginFactory<AuthenticationClientOptions> =
  defineClientPlugin<AuthenticationClientOptions>({
    packageName: '@nocobase/app-plugin-authentication',
    locales,
    serviceProviders,
    reactProviders,
    routes: [systemSettingsRoutes, personalSettingsRoutes],
    routeComponentOverrides: (options) => {
      const overrides: AppClientRouteComponentOverrideDefinition[] = [];
      if (options?.settingsComponentLoader)
        overrides.push({
          routeId: AUTHENTICATION_SETTINGS_ROUTE_ID,
          componentLoader: options.settingsComponentLoader,
        });
      if (options?.accountSecurityComponentLoader)
        overrides.push({
          routeId: ACCOUNT_SECURITY_ROUTE_ID,
          componentLoader: options.accountSecurityComponentLoader,
        });
      return overrides;
    },
  });

export default authentication;

import {
  definePersonalSettingsRoutes,
  defineSystemSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { ShieldCheckIcon, LockKeyholeIcon } from 'lucide-react';

const PACKAGE = '@nocobase/app-plugin-authentication';

/** System settings › Accounts › Sign-in and authentication (`/settings/authentication`). */
export const AUTHENTICATION_SETTINGS_ROUTE_ID: string = `${PACKAGE}:authenticationSettings`;
/** The single sign-on guide it links to (`/settings/authentication/sso`). */
export const AUTHENTICATION_SSO_GUIDE_ROUTE_ID: string = `${PACKAGE}:authenticationSsoGuide`;
/** Personal settings › Account › Account and security (`/me/security`). */
export const ACCOUNT_SECURITY_ROUTE_ID: string = `${PACKAGE}:accountSecurity`;

/** The settings item `GET /api/authentication/settings` requires; the authorization plugin declares it. */
const readSettings = {
  resource: { type: 'settings', id: 'authentication.settings' },
  action: 'read',
} as const;

/**
 * The read-only Sign-in and authentication page in the built-in Accounts category, for whoever may read the
 * `authentication.settings` settings item. An application replaces either page through `routeComponentOverrides`
 * with the route ids above.
 */
export const systemSettingsRoutes: AppClientRouteContribution =
  defineSystemSettingsRoutes([
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'authenticationSettings',
      path: '/authentication',
      authz: readSettings,
      navigation: {
        title: 'settings.title',
        description: 'settings.navigationDescription',
        icon: ShieldCheckIcon,
        order: 150,
      },
      breadcrumb: { title: 'settings.title' },
      componentLoader: () => import('./pages/authentication-settings-page.js'),
    },
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'authenticationSsoGuide',
      path: '/authentication/sso',
      authz: readSettings,
      breadcrumb: { title: 'sso.title' },
      componentLoader: () => import('./pages/sso-guide-page.js'),
    },
  ]);

/** Account and security in the built-in personal Account category, open to every signed-in person. */
export const personalSettingsRoutes: AppClientRouteContribution =
  definePersonalSettingsRoutes([
    {
      parent: PERSONAL_SETTINGS_CATEGORIES.account,
      name: 'accountSecurity',
      path: '/security',
      navigation: {
        title: 'account.title',
        description: 'account.navigationDescription',
        icon: LockKeyholeIcon,
        order: 100,
      },
      breadcrumb: { title: 'account.title' },
      componentLoader: () => import('./pages/account-security-page.js'),
    },
  ]);

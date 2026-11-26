import {
  definePersonalSettingsRoutes,
  defineSystemSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { ShieldCheckIcon, LockKeyholeIcon } from 'lucide-react';

const PACKAGE = '@nocobase/app-plugin-authentication';

/** System settings › Accounts › Authentication (`/settings/authentication`). */
export const AUTHENTICATION_SETTINGS_ROUTE_ID: string = `${PACKAGE}:authenticationSettings`;
/** The single sign-on guide it links to (`/settings/authentication/sso`). */
export const AUTHENTICATION_SSO_GUIDE_ROUTE_ID: string = `${PACKAGE}:authenticationSsoGuide`;
/** The guide to turning on two-factor authentication (`/settings/authentication/two-factor`). */
export const AUTHENTICATION_TWO_FACTOR_GUIDE_ROUTE_ID: string = `${PACKAGE}:authenticationTwoFactorGuide`;
/** The guide to turning on passkeys (`/settings/authentication/passkey`). */
export const AUTHENTICATION_PASSKEY_GUIDE_ROUTE_ID: string = `${PACKAGE}:authenticationPasskeyGuide`;
/** Personal settings › Account › Account and security (`/me/security`). */
export const ACCOUNT_SECURITY_ROUTE_ID: string = `${PACKAGE}:accountSecurity`;

/** The settings item `GET /api/authentication/settings` requires; the authorization plugin declares it. */
const readSettings = {
  resource: { type: 'settings', id: 'authentication.settings' },
  action: 'read',
} as const;

/**
 * The read-only Authentication page in the built-in Accounts category, for whoever may read the
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
      breadcrumb: { title: 'sso.breadcrumb' },
      componentLoader: () => import('./pages/sso-guide-page.js'),
    },
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'authenticationTwoFactorGuide',
      path: '/authentication/two-factor',
      authz: readSettings,
      breadcrumb: { title: 'guide.twoFactor.title' },
      componentLoader: () =>
        import('./pages/method-guide-page.js').then((module) => ({
          default: module.TwoFactorGuidePage,
        })),
    },
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'authenticationPasskeyGuide',
      path: '/authentication/passkey',
      authz: readSettings,
      breadcrumb: { title: 'guide.passkey.title' },
      componentLoader: () =>
        import('./pages/method-guide-page.js').then((module) => ({
          default: module.PasskeyGuidePage,
        })),
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

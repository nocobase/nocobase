import {
  defineAppRoutes,
  definePersonalSettingsRoutes,
  defineSystemSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
  type AppClientRouteNavigation,
} from '@nocobase/app-client/plugins';
import { Mail, UsersRound } from 'lucide-react';

import { MAIL_ACCESS } from '../shared/access.js';
import { useMailNavigationBadge } from './hooks/use-mail-navigation-badge.js';

/** Where a business page sits in the application's navigation; `false` leaves it out of the menu. */
export interface MailNavigationOptions {
  /** Lower first among its siblings; defaults to 0. */
  readonly order?: number;
  /** A navigation group of the application, as `packageName:name` for another package's group. */
  readonly parent?: string;
}

export interface MailRouteOptions {
  /** The Mail page, `/mail`. */
  readonly mail?: false | MailNavigationOptions;
  /** The Team mail page, `/mail/team`. */
  readonly mailTeam?: false | MailNavigationOptions;
}

/**
 * The plugin's four pages. `mail` and `mailTeam` are business pages whose navigation entries an application may move or
 * leave out (the pages and their permissions remain); the personal Mail accounts page and the Mail settings page are
 * always registered in their settings' Messages category. Each is replaceable by name with `routeComponentOverrides`.
 */
export function mailRoutes(
  options: MailRouteOptions = {},
): readonly AppClientRouteContribution[] {
  return [
    defineAppRoutes([
      {
        ...parentOf(options.mail),
        name: 'mail',
        path: '/mail',
        auth: 'required',
        authz: MAIL_ACCESS.workspace,
        ...navigationOf(options.mail, {
          title: 'navigation.mail',
          icon: Mail,
          badge: useMailNavigationBadge,
        }),
        breadcrumb: { title: 'navigation.mail' },
        componentLoader: () => import('./pages/mail-page.js'),
      },
      {
        ...parentOf(options.mailTeam),
        name: 'mailTeam',
        path: '/mail/team',
        auth: 'required',
        authz: MAIL_ACCESS.teamView,
        ...navigationOf(options.mailTeam, {
          title: 'navigation.mailTeam',
          icon: UsersRound,
        }),
        breadcrumb: { title: 'navigation.mailTeam' },
        componentLoader: () => import('./pages/mail-team-page.js'),
      },
    ]),
    definePersonalSettingsRoutes([
      {
        parent: PERSONAL_SETTINGS_CATEGORIES.messages,
        name: 'mailAccounts',
        path: '/mail',
        navigation: {
          title: 'navigation.mailAccounts',
          description: 'navigation.mailAccountsDescription',
        },
        breadcrumb: { title: 'navigation.mailAccounts' },
        componentLoader: () => import('./pages/mail-accounts-settings-page.js'),
      },
    ]),
    defineSystemSettingsRoutes([
      {
        parent: SYSTEM_SETTINGS_CATEGORIES.messages,
        name: 'mailSettings',
        path: '/mail',
        authz: MAIL_ACCESS.settingsRead,
        navigation: {
          title: 'navigation.mailSettings',
          description: 'navigation.mailSettingsDescription',
        },
        breadcrumb: { title: 'navigation.mailSettings' },
        componentLoader: () => import('./pages/mail-settings-page.js'),
      },
    ]),
  ];
}

function parentOf(option: false | MailNavigationOptions | undefined): {
  readonly parent?: string;
} {
  return option && option.parent ? { parent: option.parent } : {};
}

function navigationOf(
  option: false | MailNavigationOptions | undefined,
  navigation: AppClientRouteNavigation,
): { readonly navigation?: AppClientRouteNavigation } {
  if (option === false) return {};
  return {
    navigation:
      option?.order === undefined
        ? navigation
        : { ...navigation, order: option.order },
  };
}

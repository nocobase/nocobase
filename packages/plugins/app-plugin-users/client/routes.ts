import {
  defineAppRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { UsersRound } from 'lucide-react';

import type { UsersClientOptions } from './plugin.js';

export const USERS_ROUTE_ID = '@nocobase/app-plugin-users:users';
export const INVITE_ROUTE_ID = '@nocobase/app-plugin-users:invite';
export const USERS_PAGE_ACCESS = {
  resource: { type: 'page', id: 'users' },
  action: 'access',
} as const;

/**
 * The page an invitation email links to. Public (`optional`) because the invitee has no account yet; the token in the
 * path is the only credential, and the page asks a signed-in visitor to sign out first.
 */
const invitePage = {
  name: 'invite',
  path: '/invite/:token',
  auth: 'optional',
  authz: 'skip',
  componentLoader: () => import('./pages/accept-invitation-page.js'),
} as const;

export function createUsersRoutes(
  options: UsersClientOptions,
): readonly AppClientRouteContribution[] {
  const path = normalizeUsersRoutePath(options.path ?? '/users');
  const page = {
    name: 'users',
    path,
    authz: USERS_PAGE_ACCESS,
    componentLoader: () => import('./pages/users-page.js'),
  } as const;
  if ((options.mount ?? 'settings') === 'app') {
    return [
      defineAppRoutes([
        {
          ...page,
          auth: 'required',
          navigation: {
            title: options.title ?? 'nav.users',
            icon: UsersRound,
          },
        },
        invitePage,
      ]),
    ];
  }
  return [
    defineSettingsRoutes([
      {
        ...page,
        navigation: { title: options.title ?? 'nav.users', icon: UsersRound },
      },
    ]),
    defineAppRoutes([invitePage]),
  ];
}

export function normalizeUsersRoutePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    throw new TypeError('Users route path must contain a path segment');
  }
  const path = `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
  if (path === '/settings' || path.startsWith('/settings/')) {
    throw new TypeError(
      'Users route path is relative to its mount and must not include /settings',
    );
  }
  return path;
}

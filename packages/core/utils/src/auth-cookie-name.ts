/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AuthCookieType = 'authToken' | 'authenticator' | 'role' | 'csrfToken';

const cookieNamePrefixes: Record<AuthCookieType, string> = {
  authToken: 'nb_auth_token',
  authenticator: 'nb_authenticator',
  role: 'nb_role',
  csrfToken: 'nb_csrf_token',
};

export function getAuthCookieName(type: AuthCookieType, appName?: string) {
  return `${cookieNamePrefixes[type]}_${appName || 'main'}`;
}

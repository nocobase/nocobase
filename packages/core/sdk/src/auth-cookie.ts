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

export function setRoleCookie(appName: string | undefined, role?: string | null) {
  if (typeof document === 'undefined') {
    return;
  }
  const name = getAuthCookieName('role', appName);
  const expires = role ? '' : '; Max-Age=0';
  const value = role ? encodeURIComponent(role) : '';
  const secure = globalThis.location?.protocol === 'https:' ? '; Secure' : '';
  const publicPath =
    (window as unknown as { __nocobase_public_path__?: string }).__nocobase_public_path__?.replace(/\/+$/g, '') || '/';
  document.cookie = `${name}=${value}; Path=${publicPath || '/'}; SameSite=Lax${secure}${expires}`;
}

export function getAuthCookieValue(type: AuthCookieType, appName: string | undefined) {
  if (typeof document === 'undefined') {
    return;
  }
  const name = `${getAuthCookieName(type, appName)}=`;
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(name))
    ?.slice(name.length);
}

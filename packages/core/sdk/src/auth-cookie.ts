/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AuthCookieType } from '@nocobase/utils/client';
import { getAuthCookieName } from '@nocobase/utils/client';

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

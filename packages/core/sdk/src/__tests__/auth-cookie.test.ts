/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAuthCookieName as getSharedAuthCookieName } from '@nocobase/utils/client';

import { type AuthCookieType, getAuthCookieName, getAuthCookieValue, setRoleCookie } from '../auth-cookie';

describe('auth cookie helpers', () => {
  let cookies: Map<string, string>;
  let writtenCookies: string[];

  beforeEach(() => {
    cookies = new Map();
    writtenCookies = [];
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        __nocobase_public_path__: '/console/',
        location: { protocol: 'https:' },
      },
    });
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { protocol: 'https:' },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        get cookie() {
          return Array.from(cookies.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');
        },
        set cookie(value: string) {
          writtenCookies.push(value);
          const [cookiePair, ...attributes] = value.split(';').map((item) => item.trim());
          const separator = cookiePair.indexOf('=');
          const name = cookiePair.slice(0, separator);
          const cookieValue = cookiePair.slice(separator + 1);
          if (attributes.some((item) => item.toLowerCase() === 'max-age=0')) {
            cookies.delete(name);
          } else {
            cookies.set(name, cookieValue);
          }
        },
      },
    });
  });

  it('reads the standard application-scoped CSRF cookie', () => {
    cookies.set(getAuthCookieName('csrfToken', 'inventory'), 'csrf-token');

    expect(getAuthCookieValue('csrfToken', 'inventory')).toBe('csrf-token');
    expect(getAuthCookieValue('csrfToken', 'main')).toBeUndefined();
  });

  it('keeps every public cookie name aligned with the shared authentication contract', () => {
    const types: AuthCookieType[] = ['authToken', 'authenticator', 'role', 'csrfToken'];

    for (const type of types) {
      expect(getAuthCookieName(type, 'inventory')).toBe(getSharedAuthCookieName(type, 'inventory'));
    }
  });

  it('writes and removes the standard role cookie on the deployment path', () => {
    setRoleCookie('inventory', 'member');

    expect(document.cookie).toContain(`${getAuthCookieName('role', 'inventory')}=member`);
    expect(writtenCookies.at(-1)).toContain('Path=/console');
    expect(writtenCookies.at(-1)).toContain('SameSite=Lax');
    expect(writtenCookies.at(-1)).toContain('Secure');

    setRoleCookie('inventory', null);

    expect(document.cookie).not.toContain(`${getAuthCookieName('role', 'inventory')}=member`);
    expect(writtenCookies.at(-1)).toContain('Max-Age=0');
  });
});

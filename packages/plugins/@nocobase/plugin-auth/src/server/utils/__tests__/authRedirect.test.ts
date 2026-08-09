/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { appendAuthRedirectQuery, resolveAuthRedirect } from '../authRedirect';

const originalWhitelist = process.env.CORS_ORIGIN_WHITELIST;

function createContext(host = 'nocobase.example') {
  const headers = { host };
  return {
    protocol: 'https',
    headers,
    get: (name: string) => headers[name.toLowerCase()] || '',
    t: (key: string) => key,
    throw: (status: number, message: string): never => {
      throw Object.assign(new Error(message), { status });
    },
  };
}

afterEach(() => {
  if (originalWhitelist === undefined) {
    delete process.env.CORS_ORIGIN_WHITELIST;
  } else {
    process.env.CORS_ORIGIN_WHITELIST = originalWhitelist;
  }
});

describe('resolveAuthRedirect', () => {
  it('keeps NocoBase root-relative redirects and applies their runtime prefix', () => {
    expect(
      resolveAuthRedirect(createContext(), {
        appPublicPath: '/nocobase',
        subAppSegment: '/apps/crm',
        target: '/admin/users',
      }).target,
    ).toBe('/nocobase/apps/crm/admin/users');
  });

  it('allows a same-origin Portal callback without adding NocoBase route prefixes', () => {
    expect(
      resolveAuthRedirect(createContext(), {
        appPublicPath: '/nocobase',
        subAppSegment: '/apps/crm',
        target: 'https://nocobase.example/nocobase/x/apps/crm/customer/?tab=profile#details',
      }).target,
    ).toBe('https://nocobase.example/nocobase/x/apps/crm/customer/?tab=profile#details');
  });

  it('does not add the legacy sub-app prefix to a root-relative Portal callback', () => {
    expect(
      resolveAuthRedirect(createContext(), {
        subAppSegment: '/apps/crm',
        target: '/x/apps/crm/customer/?tab=profile#details',
      }).target,
    ).toBe('/x/apps/crm/customer/?tab=profile#details');
  });

  it('allows a standalone Portal dev callback only from a trusted CORS origin', () => {
    process.env.CORS_ORIGIN_WHITELIST = 'http://localhost:5173';

    expect(
      resolveAuthRedirect(createContext(), {
        target: 'http://localhost:5173/x/customer/',
      }).target,
    ).toBe('http://localhost:5173/x/customer/');
  });

  it('does not treat the CORS wildcard as a trusted SSO callback origin', () => {
    process.env.CORS_ORIGIN_WHITELIST = '*';

    expect(() =>
      resolveAuthRedirect(createContext(), {
        target: 'https://evil.example/steal-token',
      }),
    ).toThrowError('Invalid sign-in origin');
  });

  it('rejects an untrusted absolute target instead of redirecting', () => {
    delete process.env.CORS_ORIGIN_WHITELIST;

    expect(() =>
      resolveAuthRedirect(createContext(), {
        appPublicPath: '/nocobase',
        target: 'https://evil.example/steal-token',
      }),
    ).toThrowError('Invalid sign-in origin');
  });
});

describe('appendAuthRedirectQuery', () => {
  it('merges callback data before the hash and replaces injected values', () => {
    expect(
      appendAuthRedirectQuery('/x/customer/?tab=profile&token=stale#details', {
        authenticator: 'oidc-auth',
        token: 'new-token',
      }),
    ).toBe('/x/customer/?tab=profile&token=new-token&authenticator=oidc-auth#details');
  });

  it('keeps absolute Portal callback URLs absolute', () => {
    expect(
      appendAuthRedirectQuery('http://localhost:5173/x/customer/', {
        authenticator: 'saml-auth',
        token: 'test-token',
      }),
    ).toBe('http://localhost:5173/x/customer/?authenticator=saml-auth&token=test-token');
  });
});

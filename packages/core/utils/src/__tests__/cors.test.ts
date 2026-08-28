/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getCorsWhitelist, getOrigin, getRequestOrigin, isTrustedOrigin } from '../cors';

const createContext = (headers: Record<string, string | string[] | undefined> = {}, protocol = 'http') => ({
  protocol,
  headers,
  get: (name: string) => {
    const value = headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value || '';
  },
});

describe('cors utils', () => {
  const originalWhitelist = process.env.CORS_ORIGIN_WHITELIST;

  afterEach(() => {
    if (originalWhitelist === undefined) {
      delete process.env.CORS_ORIGIN_WHITELIST;
    } else {
      process.env.CORS_ORIGIN_WHITELIST = originalWhitelist;
    }
  });

  it('trusts only same-origin requests when CORS_ORIGIN_WHITELIST is not configured', () => {
    delete process.env.CORS_ORIGIN_WHITELIST;

    const ctx = createContext({ host: 'example.com' });

    expect(getCorsWhitelist()).toBeNull();
    expect(isTrustedOrigin(ctx, 'http://example.com')).toBe(true);
    expect(isTrustedOrigin(ctx, 'https://evil.example')).toBe(false);
  });

  it('trusts whitelisted origins when CORS_ORIGIN_WHITELIST is configured', () => {
    process.env.CORS_ORIGIN_WHITELIST = 'https://trusted.example, https://admin.example';

    const ctx = createContext({ host: 'example.com' });

    expect(isTrustedOrigin(ctx, 'https://trusted.example')).toBe(true);
    expect(isTrustedOrigin(ctx, 'https://evil.example')).toBe(false);
  });

  it('trusts every origin when CORS_ORIGIN_WHITELIST contains an asterisk', () => {
    process.env.CORS_ORIGIN_WHITELIST = '*';

    const ctx = createContext({ host: 'example.com' });

    expect(isTrustedOrigin(ctx, 'https://trusted.example')).toBe(true);
    expect(isTrustedOrigin(ctx, 'https://evil.example')).toBe(true);
  });

  it('resolves forwarded request origins and referer origins', () => {
    const ctx = createContext(
      {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
        host: 'internal.example',
      },
      'http',
    );

    expect(getRequestOrigin(ctx)).toBe('https://example.com');
    expect(getOrigin('https://example.com/signin?foo=bar')).toBe('https://example.com');
    expect(getOrigin('not a url')).toBeNull();
  });
});

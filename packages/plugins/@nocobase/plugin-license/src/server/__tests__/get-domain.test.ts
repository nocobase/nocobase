/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getClientDomain } from '../utils';

describe('getClientDomain', () => {
  test('should return origin from valid referer', () => {
    const ctx = {
      get: () => 'https://example.com/page?a=1',
    };
    expect(getClientDomain(ctx)).toBe('https://example.com');
  });

  test('should ignore invalid referer and fallback', () => {
    const ctx = {
      get: () => 'not a valid url',
      protocol: 'http',
      host: 'localhost:3000',
    };
    expect(getClientDomain(ctx)).toBe('http://localhost:3000');
  });

  test('fallback when no referer', () => {
    const ctx = {
      get: () => undefined,
      protocol: 'https',
      host: 'myapp.com',
    };
    expect(getClientDomain(ctx)).toBe('https://myapp.com');
  });

  test('fallback using x-forwarded headers', () => {
    const ctx = {
      get: () => undefined,
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'forwarded.com',
      },
    };
    expect(getClientDomain(ctx)).toBe('https://forwarded.com');
  });

  test('fallback when ctx.get is not a function', () => {
    const ctx = {
      get: 'not-a-function',
      protocol: 'http',
      host: 'domain.com',
    };
    expect(getClientDomain(ctx)).toBe('http://domain.com');
  });

  test('fallback using ctx.request.*', () => {
    const ctx = {
      get: () => undefined,
      request: {
        protocol: 'https',
        host: 'reqhost.com',
      },
    };
    expect(getClientDomain(ctx)).toBe('https://reqhost.com');
  });

  test('return empty string if no host found', () => {
    const ctx = {
      get: () => undefined,
      protocol: 'http',
    };
    expect(getClientDomain(ctx)).toBe('');
  });

  test('ctx is null', () => {
    expect(getClientDomain(null)).toBe('');
  });
});

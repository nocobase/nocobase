/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { BaseAuth } from '../base/auth';

describe('base-auth', () => {
  it('should validate username', () => {
    const auth = new BaseAuth({
      userCollection: {},
    } as any);

    expect(auth.validateUsername('')).toBe(false);
    expect(auth.validateUsername('a@')).toBe(false);
    expect(auth.validateUsername('a.')).toBe(false);
    expect(auth.validateUsername('a<')).toBe(false);
    expect(auth.validateUsername('a>')).toBe(false);
    expect(auth.validateUsername('a"')).toBe(false);
    expect(auth.validateUsername('a/')).toBe(false);
    expect(auth.validateUsername("a'")).toBe(false);
    expect(auth.validateUsername('ab')).toBe(true);
    // 50 characters
    expect(auth.validateUsername('01234567890123456789012345678901234567890123456789a')).toBe(false);
  });

  it('check: should return user null when no token', async () => {
    const auth = new BaseAuth({
      userCollection: {},
      ctx: {
        getBearerToken: () => null,
      },
    } as any);
    let user = null;
    try {
      user = await auth.check();
      expect(user).toBe(null);
    } catch (error) {
      expect(user).toBe(null);
    }
  });

  it('check: should set roleName to headers', async () => {
    const ctx = {
      getBearerToken: () => 'token',
      headers: {},
      logger: {
        error: (...args) => console.log(args),
      },
      app: {
        authManager: {
          jwt: {
            verify: () => ({ status: 'valid', payload: { userId: 1, roleName: 'admin' } }),
            blacklist: {
              has: () => false,
            },
          },
          tokenController: {
            check: () => ({ status: 'valid' }),
            removeLoginExpiredTokens: async () => null,
          },
        },
      },
      cache: {
        wrap: async (key, fn) => fn(),
      },
    };
    const auth = new BaseAuth({
      ctx,
      userCollection: {
        repository: {
          findOne: () => ({ id: 1 }),
        },
      },
    } as any);

    await auth.check();
    expect(ctx.headers['x-role']).toBe('admin');
  });

  it('check: should return user', async () => {
    const ctx = {
      getBearerToken: () => 'token',
      headers: {},
      logger: {
        error: (...args) => console.log(args),
      },
      app: {
        authManager: {
          jwt: {
            verify: () => ({ status: 'valid', payload: { userId: 1, roleName: 'admin' } }),
            blacklist: {
              has: () => false,
            },
          },
          tokenController: {
            check: () => ({ status: 'valid' }),
          },
        },
      },
      cache: {
        wrap: async (key, fn) => fn(),
      },
    };
    const auth = new BaseAuth({
      ctx,
      userCollection: {
        repository: {
          findOne: () => ({ id: 1 }),
        },
      },
    } as any);
    expect(await auth.check()).toEqual({ id: 1 });
  });

  it('signIn: should throw 401', async () => {
    const ctx = {
      throw: vi.fn().mockImplementation((status, message) => {
        throw new Error(message);
      }),
    };

    const auth = new BaseAuth({
      userCollection: {},
      ctx,
    } as any);
    await expect(auth.signIn()).rejects.toThrowError('Unauthorized');
  });

  it('signIn: should return user and token', async () => {
    class TestAuth extends BaseAuth {
      async validate() {
        return { id: 1 } as any;
      }
    }

    const ctx = {
      throw: vi.fn().mockImplementation((status, message) => {
        throw new Error(message);
      }),
      app: {
        authManager: {
          jwt: {
            sign: () => 'token',
          },
          tokenController: {
            add: () => 'access',
            getConfig: () => ({
              tokenExpirationTime: '30m',
              sessionExpirationTime: '1d',
              expiredTokenRenewLimit: '15m',
            }),
            removeLoginExpiredTokens: async () => null,
          },
        },
      },
    };

    const auth = new TestAuth({
      userCollection: {},
      ctx,
    } as any);

    const res = await auth.signIn();
    expect(res.token).toBe('token');
    expect(res.user).toEqual({ id: 1 });
  });
});

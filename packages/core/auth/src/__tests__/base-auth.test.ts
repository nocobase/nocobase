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
import { AuthErrorCode } from '../auth';

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
        t: (s) => s,
        getBearerToken: () => null,
        throw: (httpCode, err) => {
          throw new Error(err.message);
        },
      },
    } as any);

    expect(auth.check()).rejects.toThrow('Unauthenticated. Please sign in to continue.');
  });

  it('check: should set roleName to headers', async () => {
    const ctx = {
      getBearerToken: () => 'token',
      t: (s) => s,
      headers: {},
      logger: {
        error: (...args) => console.log(args),
      },
      app: {
        authManager: {
          jwt: {
            decode: () => ({ userId: 1, roleName: 'admin', signInTime: Date.now() }),
            blacklist: {
              has: () => false,
            },
          },
          tokenController: {
            check: () => ({ status: 'valid' }),
            removeLoginExpiredTokens: async () => null,
            getConfig: async () => ({
              tokenExpirationTime: '30m',
              sessionExpirationTime: '1d',
              expiredTokenRenewLimit: '15m',
            }),
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
      t: (s) => s,
      getBearerToken: () => 'token',
      headers: {},
      logger: {
        error: (...args) => console.log(args),
      },
      app: {
        authManager: {
          jwt: {
            decode: () => ({ userId: 1, roleName: 'admin', signInTime: Date.now() }),
            blacklist: {
              has: () => false,
            },
          },
          tokenController: {
            check: () => ({ status: 'valid' }),
            removeLoginExpiredTokens: () => null,
            getConfig: async () => ({
              tokenExpirationTime: '30m',
              sessionExpirationTime: '1d',
              expiredTokenRenewLimit: '15m',
            }),
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
      t: (s) => s,
      throw: (httpCode, error) => {
        throw new Error(error.code);
      },
    };

    const auth = new BaseAuth({
      userCollection: {},
      ctx,
    } as any);
    try {
      await auth.signIn();
    } catch (e) {
      expect(e.message).toBe(AuthErrorCode.NOT_EXIST_USER);
    }
    await expect(auth.signIn()).rejects.toThrow();
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
            getConfig: async () => ({
              tokenExpirationTime: '30m',
              sessionExpirationTime: '1d',
              expiredTokenRenewLimit: '15m',
            }),
            removeLoginExpiredTokens: () => null,
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

  it('should throw invalid error', async () => {
    const ctx = {
      t: (s) => s,
      getBearerToken: () => 'token',
      throw: (httpCode, error) => {
        throw new Error(error.code);
      },
    };

    const auth = new BaseAuth({
      userCollection: {},
      ctx,
    } as any);
    try {
      await auth.validate();
    } catch (e) {
      expect(e.message).toBe(AuthErrorCode.INVALID_TOKEN);
    }
  });
});

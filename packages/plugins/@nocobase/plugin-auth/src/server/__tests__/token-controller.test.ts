/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseAuth } from '@nocobase/auth';
import { Database, Model } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { AuthErrorType } from '@nocobase/auth';
import { RENEWED_JTI_CACHE_MS } from '../../constants';
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class MockContext {
  token: string;
  header: Map<string, string> = new Map();
  public app: MockServer;
  constructor({ app }: { app: MockServer }) {
    this.app = app;
  }
  get logger() {
    return this.app.logger;
  }
  res = {
    setHeader: (key: string, value: string) => {
      this.header.set(key, value);
    },
    getHeader: (key: string) => {
      return this.header.get(key);
    },
  };
  t = (s) => s;
  setToken(token: string) {
    this.token = token;
  }
  getBearerToken() {
    return this.token;
  }
  throw(status, errData) {
    throw new Error(errData.code);
  }
  cache = {
    wrap: async (key, fn) => fn(),
  };
}

describe('auth', () => {
  let auth: BaseAuth;
  let app: MockServer;
  let db: Database;
  let user: Model;
  let ctx: MockContext;

  beforeEach(async () => {
    if (process.env.CACHE_REDIS_URL) {
      app = await createMockServer({
        cacheManager: {
          defaultStore: 'redis',
          stores: {
            redis: {
              url: process.env.CACHE_REDIS_URL,
            },
          },
        },
        plugins: ['field-sort', 'users', 'auth'],
      });
    } else {
      app = await createMockServer({
        plugins: ['field-sort', 'users', 'auth'],
      });
    }
    db = app.db;
    app.authManager.setTokenBlacklistService({
      has: async () => false,
      add: async () => true,
    });

    user = await db.getRepository('users').create({
      values: {
        username: 'admin',
      },
    });

    class MockBaseAuth extends BaseAuth {
      async validate() {
        return user;
      }
    }
    ctx = new MockContext({ app });
    auth = new MockBaseAuth({
      userCollection: db.getCollection('users'),
      ctx,
    } as any);
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1d',
      sessionExpirationTime: '1d',
      expiredTokenRenewLimit: '1d',
    });

    await app.cache.reset();
  });

  afterEach(async () => {
    await app.cache.reset();
    await app.destroy();
  });

  it('when token expired and login valid, it generate a new token', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1s',
      sessionExpirationTime: '1d',
      expiredTokenRenewLimit: '1d',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    await auth.check();
    expect(typeof ctx.res.getHeader('x-new-token')).toBe('string');
  });

  it('when exceed logintime, throw Unauthorized', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1s',
      sessionExpirationTime: '2s',
      expiredTokenRenewLimit: '1d',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    await expect(auth.check()).rejects.toThrowError('EXPIRED_SESSION' satisfies AuthErrorType);
  });

  it('when exceed inactiveInterval, throw Unauthorized', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1s',
      sessionExpirationTime: '1d',
      expiredTokenRenewLimit: '1s',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    await expect(auth.check()).rejects.toThrowError('EXPIRED_SESSION' satisfies AuthErrorType);
  });

  it('when token expired but not refresh,  not throw error', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1s',
      sessionExpirationTime: '1d',
      expiredTokenRenewLimit: '1d',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    const checkedUser = await auth.check();
    expect(checkedUser.id).toEqual(user.id);
  });

  it('when call renew token with same jti multiple times within 10s, the result is same', async () => {
    const user = await db.getRepository('users').findOne();
    const tokenInfo = await auth.tokenController.add({ userId: user.id });
    const renewTasks = Array(15)
      .fill(null)
      .map(() => auth.tokenController.renew(tokenInfo.jti));
    const results = await Promise.all(renewTasks);
    expect(
      results.every((result) => result.jti === results[0].jti && result.issuedTime === results[0].issuedTime),
    ).toBe(true);
  });

  it('after JTI is renewed for 10s, any further renewal should fail.', async () => {
    const user = await db.getRepository('users').findOne();
    const tokenInfo = await auth.tokenController.add({ userId: user.id });
    await auth.tokenController.renew(tokenInfo.jti);
    const renewedIntervals = [
      RENEWED_JTI_CACHE_MS - 1000,
      RENEWED_JTI_CACHE_MS - 2000,
      RENEWED_JTI_CACHE_MS + 1000,
      RENEWED_JTI_CACHE_MS + 2000,
    ];
    const renewTasks = renewedIntervals.map(async (interval) => {
      try {
        await sleep(interval);
        const result = await auth.tokenController.renew(tokenInfo.jti);
        return [interval, 'resolved', result];
      } catch (e) {
        return [interval, 'rejected', e];
      }
    });
    const results = await Promise.all(renewTasks);
    expect(
      results.every(([interval, status, result]) => {
        if (interval < RENEWED_JTI_CACHE_MS) {
          return status === 'resolved';
        } else {
          return status === 'rejected';
        }
      }),
    ).toBe(true);
  });

  it('use token policy tokenExpirationTime as token expirein', async () => {
    const config = await auth.tokenController.getConfig();
    const { token } = await auth.signIn();
    const decoded = await auth.jwt.decode(token);
    expect(decoded.exp - decoded.iat).toBe(Math.floor(config.tokenExpirationTime / 1000));
    expect(decoded.signInTime).toBeTruthy();
  });
});

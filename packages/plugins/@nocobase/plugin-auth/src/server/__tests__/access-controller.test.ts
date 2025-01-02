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
  res = {
    setHeader: (key: string, value: string) => {
      this.header.set(key, value);
    },
    getHeader: (key: string) => {
      return this.header.get(key);
    },
  };
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
    app = await createMockServer({
      plugins: ['field-sort', 'users', 'auth'],
    });
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
      maxTokenLifetime: '1d',
      maxInactiveInterval: '1d',
    });

    await app.cache.reset();
  });

  afterEach(async () => {
    await app.cache.reset();
    await app.destroy();
  });
  const not_exist_jwtid = 'access_id_not_exist';
  it('should throw error when accessId not exist', async () => {
    const token = app.authManager.jwt.sign(
      { userId: user.id, temp: true },
      { jwtid: not_exist_jwtid, expiresIn: '1d' },
    );
    ctx.setToken(token);
    await expect(auth.check()).rejects.toThrowError('missing');
  });
  it('api token do not check accsss', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '0s',
      maxTokenLifetime: '0s',
      maxInactiveInterval: '0s',
    });
    const token = app.authManager.jwt.sign({ userId: user.id }, { expiresIn: '1d' });
    ctx.setToken(token);
    await sleep(2000);
    await expect(auth.check()).resolves.not.toThrow();
  });
  it('when token expired and login valid, it generate a new token', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1s',
      maxTokenLifetime: '1d',
      maxInactiveInterval: '1d',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    await auth.check();
    expect(typeof ctx.res.getHeader('x-new-token')).toBe('string');
  });

  it('when exceed logintime, throw Unauthorized', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1d',
      maxTokenLifetime: '1s',
      maxInactiveInterval: '1d',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    await expect(auth.check()).rejects.toThrowError('login-timeout');
  });

  it('when exceed inactiveInterval, throw Unauthorized', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1d',
      maxTokenLifetime: '1d',
      maxInactiveInterval: '1s',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    await expect(auth.check()).rejects.toThrowError('inactive');
  });

  it('when token expired but not refresh,  not throw error', async () => {
    await auth.tokenController.setConfig({
      tokenExpirationTime: '1s',
      maxTokenLifetime: '1d',
      maxInactiveInterval: '1d',
    });
    const { token } = await auth.signIn();
    ctx.setToken(token);
    await sleep(3000);
    const checkedUser = await auth.check();
    expect(checkedUser.id).toEqual(user.id);
  });

  it('when call refreshAccess with same jti multiple times, only one refreshed', async () => {
    const jti = await auth.tokenController.add();
    const allSettled = await Promise.allSettled([
      auth.tokenController.renew(jti),
      auth.tokenController.renew(jti),
      auth.tokenController.renew(jti),
      auth.tokenController.renew(jti),
    ]);
    const result = allSettled.filter((result) => result.status === 'fulfilled' && result.value.status === 'renewing');
    expect(result).toHaveLength(1);
  });
});

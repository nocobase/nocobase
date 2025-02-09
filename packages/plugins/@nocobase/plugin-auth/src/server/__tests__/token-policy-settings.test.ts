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
import ms from 'ms';
import { tokenPolicyCollectionName, tokenPolicyRecordKey } from '../../constants';

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
  let adminAgent;

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
    adminAgent = await app.agent().login(user, 'admin');

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
  });

  afterEach(async () => {
    await app.cache.reset();
    await app.destroy();
  });

  it('token policy has a default poilcy', async () => {
    const config = await auth.tokenController.getConfig();
    expect(typeof config.expiredTokenRenewLimit).toBe('number');
    expect(typeof config.sessionExpirationTime).toBe('number');
    expect(typeof config.tokenExpirationTime).toBe('number');
  });

  it('This test verifies that when the token policy configuration changes, the cache is automatically synchronized.', async () => {
    await adminAgent.resource(tokenPolicyCollectionName).update({
      values: {
        config: {
          tokenExpirationTime: '5h',
          sessionExpirationTime: '2h',
          expiredTokenRenewLimit: '3h',
        },
      },
      filterByTk: tokenPolicyRecordKey,
    });
    const config = await auth.tokenController.getConfig();
    expect(config.tokenExpirationTime).toBe(ms('5h'));
    expect(config.sessionExpirationTime).toBe(ms('2h'));
    expect(config.expiredTokenRenewLimit).toBe(ms('3h'));
  });
});

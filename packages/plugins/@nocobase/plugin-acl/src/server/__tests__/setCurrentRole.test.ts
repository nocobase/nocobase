/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { createMockServer, MockServer } from '@nocobase/test';
import { vi } from 'vitest';
import { setCurrentRole } from '../middlewares/setCurrentRole';
import { prepareApp } from './prepare';

describe('role', () => {
  let api: MockServer;
  let db: Database;

  let usersPlugin: UsersPlugin;
  let ctx;

  beforeEach(async () => {
    api = await prepareApp();

    db = api.db;
    usersPlugin = api.getPlugin('users');

    ctx = {
      db,
      cache: api.cache,
      state: {
        currentRole: '',
      },
      t: (key) => key,
    };
  });

  afterEach(async () => {
    await api.destroy();
  });

  it('should set role with X-Role when exists', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'admin';
      }
    };
    await setCurrentRole(ctx, () => {});
    expect(ctx.state.currentRole).toBe('admin');
  });

  it('should set role with default', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return '';
      }
    };
    await setCurrentRole(ctx, () => {});
    expect(ctx.state.currentRole).toBe('root');
  });

  it('should throw error', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'abc';
      }
    };
    const throwFn = vi.fn();
    ctx.throw = throwFn;
    await setCurrentRole(ctx, () => {});
    expect(throwFn).lastCalledWith(401, {
      code: 'ROLE_NOT_FOUND_FOR_USER',
      message: 'The role does not belong to the user',
    });
  });

  it('should set role with anonymous', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'anonymous';
      }
    };
    await setCurrentRole(ctx, () => {});
    expect(ctx.state.currentRole).toBe('anonymous');
  });

  it('should set role in cache', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'admin';
      }
    };
    await setCurrentRole(ctx, () => {});
    const roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();
  });

  it('should update cache when role added', async () => {
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'admin';
      }
    };
    await db.getRepository('roles').create({
      values: {
        name: 'test',
        title: 'Test',
      },
    });
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    await setCurrentRole(ctx, () => {});
    let roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();
    let testRole = roles.find((role) => role.name === 'test');
    expect(testRole).toBeUndefined();

    await db.getRepository('users').update({
      values: {
        roles: [
          ...ctx.state.currentUser.roles,
          {
            name: 'test',
          },
        ],
      },
      filterByTk: ctx.state.currentUser.id,
    });
    roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeUndefined();
    await setCurrentRole(ctx, () => {});
    roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();
    testRole = roles.find((role) => role.name === 'test');
    expect(testRole).toBeDefined();
  });

  it('should update cache when one role removed', async () => {
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'admin';
      }
    };
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    await setCurrentRole(ctx, () => {});
    let roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();
    let testRole = roles.find((role) => role.name === 'member');
    expect(testRole).toBeDefined();

    await db.getRepository('users').update({
      values: {
        roles: [
          {
            name: 'root',
          },
          {
            name: 'admin',
          },
        ],
      },
      filterByTk: ctx.state.currentUser.id,
    });
    roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeUndefined();
    await setCurrentRole(ctx, () => {});
    roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();
    testRole = roles.find((role) => role.name === 'member');
    expect(testRole).toBeUndefined();
  });

  it('should update cache when all roles removed', async () => {
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'admin';
      }
    };
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    await setCurrentRole(ctx, () => {});
    let roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();

    await db.getRepository('users').update({
      values: {
        roles: null,
      },
      filterByTk: ctx.state.currentUser.id,
    });
    roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeUndefined();
    const throwFn = vi.fn();
    ctx.throw = throwFn;
    await setCurrentRole(ctx, () => {});
    expect(throwFn).lastCalledWith(401, {
      code: 'USER_HAS_NO_ROLES_ERR',
      message: 'The current user has no roles. Please try another account.',
    });
    expect(ctx.state.currentRole).not.toBeDefined();
  });

  it('should update cache when role deleted', async () => {
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'admin';
      }
    };
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    await setCurrentRole(ctx, () => {});
    let roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();
    let testRole = roles.find((role) => role.name === 'member');
    expect(testRole).toBeDefined();

    await db.getRepository('roles').destroy({
      filter: {
        name: 'member',
      },
    });
    roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeUndefined();
    await setCurrentRole(ctx, () => {});
    roles = await ctx.cache.get(`roles:${ctx.state.currentUser.id}`);
    expect(roles).toBeDefined();
    testRole = roles.find((role) => role.name === 'member');
    expect(testRole).toBeUndefined();
  });
});

describe('cache role', async () => {
  it('should do not throw error when user no default role', async () => {
    let app;
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
        registerActions: true,
        acl: true,
        plugins: [
          'acl',
          'error-handler',
          'field-sort',
          'users',
          'ui-schema-storage',
          'data-source-main',
          'auth',
          'data-source-manager',
          'collection-tree',
          'system-settings',
        ],
      });
    } else {
      app = await prepareApp();
    }
    const ctx: any = {
      db: app.db,
      cache: app.cache,
      state: {
        currentRole: '',
      },
      t: (key) => key,
    };
    const user = await app.db.getRepository('users').create({
      values: { name: 'zhangsan', roles: ['member'] },
    });
    ctx.state.currentUser = user;
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return '';
      }
    };
    await setCurrentRole(ctx, () => {});
    expect(ctx.state.currentRole).toBe('member');
  });
});

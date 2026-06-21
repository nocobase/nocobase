/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import compose from 'koa-compose';
import { vi } from 'vitest';
import { Database } from '@nocobase/database';
import { cacheMiddleware, checkPermission, parseVariables } from '../actions/query';

describe('query', () => {
  describe('action helpers', () => {
    let ctx: any;
    let app: MockServer;
    let db: Database;
    beforeAll(async () => {
      app = await createMockServer({
        plugins: ['field-sort', 'data-source-manager', 'users', 'acl'],
      });
      db = app.db;
      db.options.underscored = true;
      db.collection({
        name: 'orders',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
          },
          {
            name: 'price',
            type: 'double',
          },
          {
            name: 'createdAt',
            type: 'date',
          },
          {
            type: 'belongsTo',
            name: 'user',
            target: 'users',
            targetKey: 'id',
            foreignKey: 'userId',
          },
        ],
      });
      ctx = {
        app,
        db,
        database: db,
      };
    });

    afterAll(async () => {
      await app.destroy();
    });

    it('should check permissions', async () => {
      const context = {
        ...ctx,
        state: {
          currentRole: '',
        },
        action: {
          params: {
            values: {
              collection: 'users',
            },
          },
        },
        throw: vi.fn(),
      };
      await checkPermission(context, async () => {});
      expect(context.throw).toBeCalledWith(403, 'No permissions');
    });

    it('parse variables', async () => {
      const user = await db.getRepository('users').findOne();
      const context = {
        ...ctx,
        state: {
          currentUser: user,
        },
        get: (key: string) => {
          return {
            'x-timezone': '',
          }[key];
        },
        action: {
          params: {
            values: {
              filter: {
                $and: [
                  {
                    createdAt: { $dateOn: '{{$nDate.now}}' },
                  },
                  {
                    userId: { $eq: '{{$user.id}}' },
                  },
                ],
              },
            },
          },
        },
      };
      await parseVariables(context, async () => {});
      const { filter } = context.action.params.values;
      const dateOn = filter.$and[0].createdAt.$dateOn;
      expect(new Date(dateOn).getTime()).toBeLessThanOrEqual(new Date().getTime());
      const userId = filter.$and[1].userId.$eq;
      expect(userId).toBe(user.id);
    });

    it('should reuse flow-engine variable resolver for filter values', async () => {
      const user = await db.getRepository('users').findOne();
      const context = {
        ...ctx,
        auth: {
          user,
        },
        state: {
          currentUser: user,
        },
        get: (key: string) => {
          return {
            'x-timezone': '',
          }[key];
        },
        getCurrentLocale: () => 'en-US',
        action: {
          params: {
            values: {
              filter: {
                userId: { $eq: '{{ ctx.user.id }}' },
              },
            },
          },
        },
      };

      await parseVariables(context, async () => {});

      expect(context.action.params.values.filter.userId.$eq).toBe(user.id);
    });
  });

  describe('cacheMiddleware', () => {
    const key = 'test-key';
    const value = 'test-val';
    const query = vi.fn().mockImplementation(async (ctx, next) => {
      ctx.body = value;
      await next();
    });

    class MockCache {
      map: Map<string, any> = new Map();

      get(key: string) {
        return this.map.get(key);
      }

      set(key: string, value: any) {
        this.map.set(key, value);
      }
    }

    let ctx: any;
    beforeEach(() => {
      const cache = new MockCache();
      ctx = {
        app: {
          cacheManager: {
            getCache: () => cache,
          },
        },
      };
    });
    it('should use cache', async () => {
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              cache: {
                enabled: true,
              },
              refresh: false,
              uid: key,
            },
          },
        },
      };
      const cache = context.app.cacheManager.getCache();
      expect(cache.get(key)).toBeUndefined();
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(query).toBeCalled();
      expect(context.body).toEqual(value);
      expect(cache.get(key)).toEqual(value);
      vi.clearAllMocks();
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(context.body).toEqual(value);
      expect(query).not.toBeCalled();
    });
    it('should not use cache', async () => {
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              uid: key,
            },
          },
        },
      };
      const cache = context.app.cacheManager.getCache();
      cache.set(key, value);
      expect(cache.get(key)).toBeDefined();
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(query).toBeCalled();
      expect(context.body).toEqual(value);
    });
    it('should refresh', async () => {
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              cache: {
                enabled: true,
              },
              refresh: true,
              uid: key,
            },
          },
        },
      };
      const cache = context.app.cacheManager.getCache();
      expect(cache.get(key)).toBeUndefined();
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(query).toBeCalled();
      expect(context.body).toEqual(value);
      expect(cache.get(key)).toEqual(value);
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(query).toBeCalled();
      expect(context.body).toEqual(value);
    });
  });
});

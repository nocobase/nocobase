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
import { FlowModelRepository } from '@nocobase/plugin-flow-engine';
import { generateFlowModelRd } from '@nocobase/utils';
import { cacheMiddleware, checkPermission, parseVariables } from '../actions/query';

describe('query', () => {
  describe('action helpers', () => {
    let ctx: any;
    let app: MockServer;
    let db: Database;
    const createSession = (userId: number) => {
      const signInTime = `chart-query-${userId}`;
      const payload = Buffer.from(JSON.stringify({ userId, signInTime })).toString('base64url');
      return {
        rd: (flowModelUid: string) => generateFlowModelRd(flowModelUid, `${userId}:${signInTime}`),
        token: `test.${payload}.sig`,
      };
    };
    const insertFlowModel = async (uid: string, template: unknown) => {
      const repository = db.getCollection('flowModels').repository as FlowModelRepository;
      await repository.insertModel({ uid, use: 'ChartBlockModel', props: template });
    };

    beforeAll(async () => {
      app = await createMockServer({
        plugins: ['field-sort', 'data-source-manager', 'users', 'acl', 'flow-engine'],
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
              mode: 'sql',
              variableResolution: 'legacy-schema',
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
      expect(context.action.params.values).not.toHaveProperty('variableResolution');
      const dateOn = filter.$and[0].createdAt.$dateOn;
      expect(new Date(dateOn).getTime()).toBeLessThanOrEqual(new Date().getTime());
      const userId = filter.$and[1].userId.$eq;
      expect(userId).toBe(user.id);
    });

    it('parses legacy schema variables in the explicit builder lane', async () => {
      const user = await db.getRepository('users').findOne();
      const next = vi.fn();
      const context = {
        ...ctx,
        state: { currentUser: user },
        get: (key: string) => ({ 'x-timezone': '' })[key],
        action: {
          params: {
            values: {
              mode: 'builder',
              variableResolution: 'legacy-schema',
              filter: {
                $and: [{ createdAt: { $dateOn: '{{$nDate.now}}' } }, { userId: { $eq: '{{$user.id}}' } }],
              },
            },
          },
        },
      };

      await parseVariables(context, next);

      expect(next).toHaveBeenCalledOnce();
      expect(context.action.params.values).not.toHaveProperty('variableResolution');
      expect(context.action.params.values.filter.$and[1].userId.$eq).toBe(user.id);
      expect(new Date(context.action.params.values.filter.$and[0].createdAt.$dateOn).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });

    it.each([
      [
        'Record context params',
        {
          mode: 'builder',
          variableResolution: 'legacy-schema',
          contextParams: { 'view.record': { collection: 'users', filterByTk: 1 } },
          filter: { id: { $eq: 1 } },
        },
      ],
      [
        'ctx paths',
        {
          mode: 'builder',
          variableResolution: 'legacy-schema',
          filter: { id: { $eq: '{{ ctx.user.id }}' } },
        },
      ],
      [
        'unsupported expressions',
        {
          mode: 'builder',
          variableResolution: 'legacy-schema',
          filter: { id: { $eq: '{{ ctx.other() }}' } },
        },
      ],
      [
        'an rd',
        {
          mode: 'builder',
          variableResolution: 'legacy-schema',
          rd: 'invalid-rd',
          filter: { id: { $eq: 1 } },
        },
      ],
      ['a missing mode', { variableResolution: 'legacy-schema', filter: { id: { $eq: 1 } } }],
      ['a missing marker', { mode: 'builder', filter: { id: { $eq: 1 } } }],
    ])('rejects a legacy request with %s', async (_title, values) => {
      const next = vi.fn();
      const context = {
        ...ctx,
        get: () => '',
        action: { params: { values } },
      };

      await parseVariables(context, next);

      expect(context.body).toEqual([]);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reuse flow-engine variable resolver for filter values', async () => {
      const user = await db.getRepository('users').findOne();
      const uid = 'chart-query-user';
      const session = createSession(user.id);
      await insertFlowModel(uid, { filter: { userId: { $eq: '{{ ctx.user.id }}' } } });
      const context = {
        ...ctx,
        auth: {
          user,
        },
        state: {
          currentRole: 'member',
          currentRoles: ['member'],
          currentUser: user,
        },
        get: (key: string) => {
          return {
            authorization: `Bearer ${session.token}`,
            'x-timezone': '',
          }[key.toLowerCase()];
        },
        getCurrentLocale: () => 'en-US',
        action: {
          params: {
            values: {
              mode: 'builder',
              rd: session.rd(uid),
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

    it('should not resolve unregistered Record context params', async () => {
      const user = await db.getRepository('users').findOne();
      const uid = 'chart-query-unregistered-record';
      const session = createSession(user.id);
      await insertFlowModel(uid, { filter: { userId: { $eq: '{{ ctx.chart.record.id }}' } } });
      const context = {
        ...ctx,
        auth: { user },
        get: (key: string) => (key.toLowerCase() === 'authorization' ? `Bearer ${session.token}` : ''),
        getCurrentLocale: () => 'en-US',
        state: { currentRole: 'member', currentRoles: ['member'], currentUser: user },
        action: {
          params: {
            values: {
              mode: 'builder',
              rd: session.rd(uid),
              contextParams: {
                'chart.record': {
                  collection: 'users',
                  dataSourceKey: 'main',
                  fields: ['id'],
                  filterByTk: user.id,
                },
              },
              filter: { userId: { $eq: '{{ ctx.chart.record.id }}' } },
            },
          },
        },
      };

      const next = vi.fn();
      await parseVariables(context, next);

      expect(context.body).toEqual([]);
      expect(context.action.params.values.filter.userId.$eq).toBe('{{ ctx.chart.record.id }}');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('cacheMiddleware', () => {
    const key = 'test-key';
    const cacheKey = JSON.stringify([key, {}]);
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
      expect(cache.get(cacheKey)).toBeUndefined();
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(query).toBeCalled();
      expect(context.body).toEqual(value);
      expect(cache.get(cacheKey)).toEqual(value);
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
      expect(cache.get(cacheKey)).toBeUndefined();
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(query).toBeCalled();
      expect(context.body).toEqual(value);
      expect(cache.get(cacheKey)).toEqual(value);
      await compose([cacheMiddleware, query])(context, async () => {});
      expect(query).toBeCalled();
      expect(context.body).toEqual(value);
    });
    it('isolates cache entries by resolved query', async () => {
      const first = {
        ...ctx,
        action: {
          params: {
            values: { cache: { enabled: true }, filter: { id: 1 }, uid: key },
          },
        },
      };
      const second = {
        ...ctx,
        action: {
          params: {
            values: { cache: { enabled: true }, filter: { id: 2 }, uid: key },
          },
        },
      };

      await cacheMiddleware(first, async () => {
        first.body = 'first';
      });
      await cacheMiddleware(second, async () => {
        second.body = 'second';
      });

      expect(first.body).toBe('first');
      expect(second.body).toBe('second');
    });
  });
});

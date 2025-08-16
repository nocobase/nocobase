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
import {
  cacheMiddleware,
  checkPermission,
  parseFieldAndAssociations,
  parseVariables,
  postProcess,
} from '../actions/query';
import { Database } from '@nocobase/database';
import { createQueryParser } from '../query-parser';

describe('query', () => {
  describe('parseBuilder', () => {
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

    it('should parse field and associations', async () => {
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              collection: 'orders',
              measures: [
                {
                  field: ['price'],
                  aggregation: 'sum',
                  alias: 'price',
                },
              ],
              dimensions: [
                {
                  field: ['createdAt'],
                },
                {
                  field: ['user', 'name'],
                },
              ],
            },
          },
        },
      };
      await parseFieldAndAssociations(context, async () => {});
      expect(context.action.params.values).toMatchObject({
        measures: [
          {
            field: 'orders.price',
            aggregation: 'sum',
            alias: 'price',
            type: 'double',
          },
        ],
        dimensions: [
          {
            field: 'orders.created_at',
            alias: 'createdAt',
            type: 'date',
          },
          {
            field: 'user.name',
            alias: 'user.name',
          },
        ],
        include: [
          {
            association: 'user',
          },
        ],
      });
    });

    it('should parse measures', async () => {
      const measures1 = [
        {
          field: ['price'],
        },
      ];
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              collection: 'orders',
              measures: measures1,
            },
          },
        },
      };
      const queryParser = createQueryParser(db);
      await compose([parseFieldAndAssociations, queryParser.parse()])(context, async () => {});
      expect(context.action.params.values.queryParams.attributes).toEqual([
        [db.sequelize.col('orders.price'), 'price'],
      ]);
      const measures2 = [
        {
          field: ['price'],
          aggregation: 'sum',
          alias: 'price-alias',
        },
      ];
      const context2 = {
        ...ctx,
        action: {
          params: {
            values: {
              collection: 'orders',
              measures: measures2,
            },
          },
        },
      };
      await compose([parseFieldAndAssociations, queryParser.parse()])(context2, async () => {});
      expect(context2.action.params.values.queryParams.attributes).toEqual([
        [db.sequelize.fn('sum', db.sequelize.col('orders.price')), 'price-alias'],
      ]);
    });

    it('should throw error if invalid aggregation function', async () => {
      const measures = [
        {
          field: ['price'],
          aggregation: 'if(1=2,sleep(1),sleep(3)) and sum',
        },
      ];
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              collection: 'orders',
              measures,
            },
          },
        },
      };
      const queryParser = createQueryParser(db);
      try {
        await compose([parseFieldAndAssociations, queryParser.parse()])(context, async () => {});
      } catch (error) {
        expect(error.message).toBe('Invalid aggregation function: if(1=2,sleep(1),sleep(3)) and sum');
      }
    });

    it('should parse dimensions', async () => {
      const queryParser = createQueryParser(db);
      vi.spyOn(queryParser.formatter, 'format').mockImplementation(() => 'formatted-field' as any);
      const dimensions = [
        {
          field: ['createdAt'],
          format: 'YYYY-MM-DD',
          alias: 'Created at',
        },
      ];
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              collection: 'orders',
              dimensions,
            },
          },
        },
      };
      await compose([parseFieldAndAssociations, queryParser.parse()])(context, async () => {});
      expect(context.action.params.values.queryParams.attributes).toEqual([['formatted-field', 'Created at']]);
      expect(context.action.params.values.queryParams.group).toEqual([]);
      const measures = [
        {
          field: ['field'],
          aggregation: 'sum',
        },
      ];
      const context2 = {
        ...ctx,
        action: {
          params: {
            values: {
              collection: 'orders',
              measures,
              dimensions,
            },
          },
        },
      };
      await compose([parseFieldAndAssociations, queryParser.parse()])(context2, async () => {});
      expect(context2.action.params.values.queryParams.group).toEqual(['formatted-field']);
    });

    it('should parse filter', async () => {
      const filter = {
        createdAt: {
          $gt: '2020-01-01',
        },
      };
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              collection: 'orders',
              filter,
            },
          },
        },
      };
      const queryParser = createQueryParser(db);
      await compose([parseFieldAndAssociations, queryParser.parse()])(context, async () => {});
      expect(context.action.params.values.queryParams.where.createdAt).toBeDefined();
    });

    it('post process', async () => {
      const context = {
        ...ctx,
        action: {
          params: {
            values: {
              data: [{ key: '123' }],
              fieldMap: {
                key: { type: 'bigInt' },
              },
            },
          },
        },
      };
      await postProcess(context, async () => {});
      expect(context.body).toEqual([{ key: 123 }]);
    });

    it('parse variables', async () => {
      const context = {
        ...ctx,
        state: {
          currentUser: {
            id: 1,
          },
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
      expect(userId).toEqualNumberOrString(1);
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

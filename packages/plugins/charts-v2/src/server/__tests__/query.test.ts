import { MockServer, mockServer } from '@nocobase/test';
import * as formatter from '../actions/formatter';
import { cacheWrap, parseBuilder, parseFieldAndAssociations } from '../actions/query';

describe('query', () => {
  describe('parseBuilder', () => {
    const sequelize = {
      fn: jest.fn().mockImplementation((fn: string, field: string) => [fn, field]),
      col: jest.fn().mockImplementation((field: string) => field),
    };
    let ctx: any;
    let app: MockServer;

    beforeAll(() => {
      app = mockServer();
      app.db.collection({
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
      app.db.collection({
        name: 'users',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
          },
          {
            name: 'name',
            type: 'string',
          },
        ],
      });
      ctx = {
        db: {
          sequelize,
          getRepository: (name: string) => app.db.getRepository(name),
          getModel: (name: string) => app.db.getModel(name),
          getCollection: (name: string) => app.db.getCollection(name),
          options: {
            underscored: true,
          },
        },
      };
    });

    it('should parse field and associations', () => {
      const associations = parseFieldAndAssociations(ctx, {
        collection: 'orders',
        measures: [{ field: ['price'], aggregation: 'sum', alias: 'price' }],
        dimensions: [{ field: ['createdAt'] }, { field: ['user', 'name'] }],
      });
      expect(associations).toMatchObject({
        measures: [{ field: 'orders.price', aggregation: 'sum', alias: 'price', type: 'double' }],
        dimensions: [
          { field: 'orders.created_at', alias: 'createdAt', type: 'date' },
          { field: 'user.name', alias: 'user.name' },
        ],
        include: [{ association: 'user' }],
      });
    });

    it('should parse measures', () => {
      const measures1 = [
        {
          field: ['price'],
        },
      ];
      const { queryParams: result1 } = parseBuilder(ctx, { collection: 'orders', measures: measures1 });
      expect(result1.attributes).toEqual([['orders.price', 'price']]);

      const measures2 = [
        {
          field: ['price'],
          aggregation: 'sum',
          alias: 'price-alias',
        },
      ];
      const { queryParams: result2 } = parseBuilder(ctx, { collection: 'orders', measures: measures2 });
      expect(result2.attributes).toEqual([[['sum', 'orders.price'], 'price-alias']]);
    });

    it('should parse dimensions', () => {
      jest.spyOn(formatter, 'formatter').mockReturnValue('formatted-field');
      const dimensions = [
        {
          field: ['createdAt'],
          format: 'YYYY-MM-DD',
          alias: 'Created at',
        },
      ];
      const { queryParams: result } = parseBuilder(ctx, { collection: 'orders', dimensions });
      expect(result.attributes).toEqual([['formatted-field', 'Created at']]);
      expect(result.group).toEqual([]);

      const measures = [
        {
          field: ['field'],
          aggregation: 'sum',
        },
      ];
      const { queryParams: result2 } = parseBuilder(ctx, { collection: 'orders', measures, dimensions });
      expect(result2.group).toEqual(['formatted-field']);
    });

    it('should parse filter', () => {
      const filter = {
        createdAt: {
          $gt: '2020-01-01',
        },
      };
      const { queryParams: result } = parseBuilder(ctx, { collection: 'orders', filter });
      expect(result.where.createdAt).toBeDefined();
    });
  });

  describe('cacheWrap', () => {
    const key = 'test-key';
    const value = 'test-val';
    class MockCache {
      map: Map<string, any> = new Map();
      async func() {
        return value;
      }

      get(key: string) {
        return this.map.get(key);
      }
      set(key: string, value: any) {
        this.map.set(key, value);
      }
    }
    let cache: any;
    let query: () => Promise<any>;

    beforeEach(() => {
      cache = new MockCache();
    });

    it('should use cache', async () => {
      query = async () =>
        await cacheWrap(cache, {
          key,
          func: cache.func,
          useCache: true,
          refresh: false,
        });

      const spy = jest.spyOn(cache, 'func');
      expect(cache.get(key)).toBeUndefined();
      const result = await query();
      expect(cache.func).toBeCalled();
      expect(result).toEqual(value);
      expect(cache.get(key)).toEqual(value);

      spy.mockReset();
      const result2 = await query();
      expect(result2).toEqual(value);
      expect(cache.func).not.toBeCalled();
    });

    it('should not use cache', async () => {
      query = async () =>
        await cacheWrap(cache, {
          key,
          func: cache.func,
          useCache: false,
          refresh: false,
        });

      cache.set(key, value);
      expect(cache.get(key)).toBeDefined();
      jest.spyOn(cache, 'func');
      const result = await query();
      expect(cache.func).toBeCalled();
      expect(result).toEqual(value);
    });

    it('should refresh', async () => {
      query = async () =>
        await cacheWrap(cache, {
          key,
          func: cache.func,
          useCache: true,
          refresh: true,
        });

      const spy = jest.spyOn(cache, 'func');
      expect(cache.get(key)).toBeUndefined();
      const result = await query();
      expect(cache.func).toBeCalled();
      expect(result).toEqual(value);
      expect(cache.get(key)).toEqual(value);

      spy.mockClear();
      const result2 = await query();
      expect(cache.func).toBeCalled();
      expect(result2).toEqual(value);
    });
  });
});

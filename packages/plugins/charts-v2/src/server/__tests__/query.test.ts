import { MockServer, mockServer } from '@nocobase/test';
import { cacheWrap, parseFieldAndAssociations } from '../actions/query';

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
        include: [{ model: app.db.getModel('users'), as: 'user' }],
      });
    });

    // it('should parse measures', () => {
    //   const measures1 = [
    //     {
    //       field: 'field',
    //     },
    //   ];
    //   const { queryParams: result1 } = parseBuilder(ctx, { measures: measures1 });
    //   expect(result1.attributes).toEqual(['field']);

    //   const measures2 = [
    //     {
    //       field: 'field',
    //       aggregation: 'sum',
    //       alias: 'alias',
    //     },
    //   ];
    //   const { queryParams: result2 } = parseBuilder(ctx, { measures: measures2 });
    //   expect(result2.attributes).toEqual([[['sum', 'field'], 'alias']]);
    // });

    // it('should parse dimensions', () => {
    //   jest.spyOn(formatter, 'formatter').mockReturnValue('formatted-field');
    //   const dimensions = [
    //     {
    //       field: 'testField',
    //       format: 'YYYY-MM-DD',
    //       alias: 'alias',
    //     },
    //   ];
    //   const { queryParams: result } = parseBuilder(ctx, { dimensions });
    //   expect(result.attributes).toEqual([['formatted-field', 'alias']]);
    //   expect(result.group).toEqual([]);

    //   const measures = [
    //     {
    //       field: 'field',
    //       aggregation: 'sum',
    //     },
    //   ];
    //   const { queryParams: result2 } = parseBuilder(ctx, { measures, dimensions });
    //   expect(result2.group).toEqual(['alias']);
    // });

    // it('should parse filter', () => {
    //   const filter = {
    //     testField: {
    //       $gt: '2020-01-01',
    //     },
    //   };
    //   const { queryParams: result } = parseBuilder(ctx, { filter });
    //   expect(result.where.testField).toBeDefined();
    // });
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

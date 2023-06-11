import { cacheWrap, parseBuilder } from '../actions/query';
import { MockServer, mockServer } from '@nocobase/test';
import * as formatter from '../actions/formatter';

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
        name: 'test',
        fields: [
          {
            name: 'testField',
            type: 'date',
          },
        ],
      });
      ctx = {
        db: {
          sequelize,
          getRepository: () => app.db.getRepository('test'),
        },
      };
    });

    it('should parse measures', () => {
      const measures1 = [
        {
          field: 'field',
        },
      ];
      const result1 = parseBuilder(ctx, { measures: measures1 });
      expect(result1.attributes).toEqual(['field']);

      const measures2 = [
        {
          field: 'field',
          aggregation: 'sum',
          alias: 'alias',
        },
      ];
      const result2 = parseBuilder(ctx, { measures: measures2 });
      expect(result2.attributes).toEqual([[['sum', 'field'], 'alias']]);
    });

    it('should parse dimensions', () => {
      jest.spyOn(formatter, 'formatter').mockReturnValue('formatted-field');
      const dimensions = [
        {
          field: 'testField',
          format: 'YYYY-MM-DD',
          alias: 'alias',
        },
      ];
      const result = parseBuilder(ctx, { dimensions });
      expect(result.attributes).toEqual([['formatted-field', 'alias']]);
      expect(result.group).toEqual(['alias']);
    });

    it('should parse filter', () => {
      const filter = {
        testField: {
          $gt: '2020-01-01',
        },
      };
      const result = parseBuilder(ctx, { filter });
      expect(result.where.testField).toBeDefined();
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

import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { queryData } from '../actions/query';
import ChartsV2Plugin from '../plugin';

describe('api', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({
      acl: true,
      plugins: ['users', 'auth'],
    });
    app.plugin(ChartsV2Plugin);
    await app.loadAndInstall({ clean: true });
    db = app.db;

    db.collection({
      name: 'chart_test',
      fields: [
        {
          type: 'double',
          name: 'price',
        },
        {
          type: 'bigInt',
          name: 'count',
        },
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'date',
          name: 'createdAt',
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('chart_test');
    await repo.create({
      values: [
        { price: 1, count: 1, title: 'title1' },
        { price: 2, count: 2, title: 'title2' },
      ],
    });
  });

  afterAll(async (done) => {
    await db.close();
    done();
  });

  test('query', () => {
    expect.assertions(1);
    return expect(
      queryData({ db } as any, {
        collection: 'chart_test',
        measures: [
          {
            field: 'price',
            alias: 'Price',
          },
          {
            field: 'count',
            alias: 'Count',
          },
        ],
        dimensions: [
          {
            field: 'title',
            alias: 'Title',
          },
        ],
      }),
    ).resolves.toBeDefined();
  });

  test('query with sort', () => {
    expect.assertions(1);
    return expect(
      queryData({ db } as any, {
        collection: 'chart_test',
        measures: [
          {
            field: 'price',
            aggregation: 'sum',
            alias: 'Price',
          },
        ],
        dimensions: [
          {
            field: 'title',
            alias: 'Title',
          },
          {
            field: 'createdAt',
            format: 'YYYY',
            alias: 'Created At',
          },
        ],
        orders: [{ field: 'createdAt', order: 'asc' }],
      }),
    ).resolves.toBeDefined();
  });
});

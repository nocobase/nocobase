import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { parseBuilder, parseFieldAndAssociations, queryData } from '../actions/query';
import ChartsV2Plugin from '../plugin';
import compose from 'koa-compose';

describe('api', () => {
  let app: MockServer;
  let db: Database;

  beforeAll(async () => {
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
        { price: 1, count: 1, title: 'title1', createdAt: '2023-02-02' },
        { price: 2, count: 2, title: 'title2', createdAt: '2023-01-01' },
      ],
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  test('query', async () => {
    const ctx = {
      db,
      action: {
        params: {
          values: {
            collection: 'chart_test',
            measures: [
              {
                field: ['price'],
                alias: 'Price',
              },
              {
                field: ['count'],
                alias: 'Count',
              },
            ],
            dimensions: [
              {
                field: ['title'],
                alias: 'Title',
              },
            ],
          },
        },
      },
    } as any;
    await compose([parseFieldAndAssociations, parseBuilder, queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
  });

  test('query with sort', async () => {
    const ctx = {
      db,
      action: {
        params: {
          values: {
            collection: 'chart_test',
            measures: [
              {
                field: ['price'],
                aggregation: 'sum',
                alias: 'Price',
              },
            ],
            dimensions: [
              {
                field: ['title'],
                alias: 'Title',
              },
              {
                field: ['createdAt'],
                format: 'YYYY-MM',
              },
            ],
            orders: [{ field: 'createdAt', order: 'asc' }],
          },
        },
      },
    } as any;
    await compose([parseFieldAndAssociations, parseBuilder, queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
    expect(ctx.action.params.values.data).toMatchObject([{ createdAt: '2023-01' }, { createdAt: '2023-02' }]);
  });
});

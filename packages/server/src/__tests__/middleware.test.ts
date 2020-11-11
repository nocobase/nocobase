import Koa from 'koa';
import request from 'supertest';
import http from 'http';
import Resourcer from '@nocobase/resourcer';
import Database from '@nocobase/database';
import middleware from '../middleware';

describe('middleware', () => {
  let app: Koa;
  let resourcer: Resourcer;
  let database: Database;

  beforeAll(() => {
    app = new Koa();
    resourcer = new Resourcer();
    resourcer.registerHandlers({
      list: async (ctx, next) => {
        ctx.body = [1,2];
        await next();
      },
      get: async (ctx, next) => {
        ctx.body = [3,4];
        await next();
      },
    });
    console.log({
      username: process.env.TEST_DB_USER,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_DATABASE,
      host: process.env.TEST_DB_HOST,
      port: process.env.TEST_DB_PORT as any,
      dialect: process.env.TEST_DB_DIALECT as any,
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    });
    database = new Database({
      username: process.env.TEST_DB_USER,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_DATABASE,
      host: process.env.TEST_DB_HOST,
      port: process.env.TEST_DB_PORT as any,
      dialect: process.env.TEST_DB_DIALECT as any,
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    });
    app.use(middleware({
      prefix: '/api',
      database,
      resourcer,
    }));
  });
  it('shound work', async () => {
    database.table({
      name: 'tests',
    });
    const response = await request(http.createServer(app.callback())).get('/api/tests');
    expect(response.body).toEqual([1,2]);
  });
  it('shound work', async () => {
    database.table({
      name: 'foos',
      fields: [
        {
          type: 'hasmany',
          name: 'bars',
        }
      ]
    });
    database.table({
      name: 'bars',
      fields: [
        {
          type: 'belongsTo',
          name: 'foo',
        },
      ],
    });
    let response = await request(http.createServer(app.callback())).get('/api/foos/1/bars');
    expect(response.body).toEqual([1,2]);
    response = await request(http.createServer(app.callback())).get('/api/bars/1/foo');
    expect(response.body).toEqual([3,4]);
  });
});

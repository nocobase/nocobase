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
      'foo2s.bar2s:list': async (ctx, next) => {
        ctx.body = [5,6];
        await next();
      },
    });
    database = new Database({
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT as any,
      dialect: process.env.DB_DIALECT as any,
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
  it('shound work', async () => {
    database.table({
      name: 'foo2s',
      fields: [
        {
          type: 'belongsToMany',
          name: 'bar2s',
        }
      ]
    });
    database.table({
      name: 'bar2s',
      fields: [
        {
          type: 'belongsToMany',
          name: 'foo2s',
        },
      ],
    });
    let response = await request(http.createServer(app.callback())).get('/api/foo2s/1/bar2s');
    expect(response.body).toEqual([5,6]);
    response = await request(http.createServer(app.callback())).get('/api/bar2s/1/foo2s');
    expect(response.body).toEqual([1,2]);
  });
});

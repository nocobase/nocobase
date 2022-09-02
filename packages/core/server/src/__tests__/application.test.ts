import supertest from 'supertest';
import { Application } from '../application';
import { Plugin } from '../plugin';

class MyPlugin extends Plugin {
  async load() {}

  getName(): string {
    return 'MyPlugin';
  }
}

describe('application', () => {
  let app: Application;
  let agent;

  beforeEach(() => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        dialectModule: require('sqlite3'),
        storage: ':memory:',
      },
      resourcer: {
        prefix: '/api',
      },
      dataWrapping: false,
      registerActions: false,
    });
    app.resourcer.registerActionHandlers({
      list: async (ctx, next) => {
        ctx.body = [1, 2];
        await next();
      },
      get: async (ctx, next) => {
        ctx.body = [3, 4];
        await next();
      },
      'foo2s.bar2s:list': async (ctx, next) => {
        ctx.body = [5, 6];
        await next();
      },
    });
    agent = supertest.agent(app.callback());
  });

  afterEach(async () => {
    return app.db.close();
  });

  it('resourcer.define', async () => {
    app.resourcer.define({
      name: 'test',
    });
    const response = await agent.get('/api/test');
    expect(response.body).toEqual([1, 2]);
  });

  it('resourcer.define', async () => {
    app.resourcer.define({
      type: 'hasMany',
      name: 'test.abc',
    });
    const response = await agent.get('/api/test/1/abc');
    expect(response.body).toEqual([1, 2]);
  });

  it('db.table', async () => {
    app.collection({
      name: 'tests',
    });
    const response = await agent.get('/api/tests');
    expect(response.body).toEqual([1, 2]);
  });

  it('db.association', async () => {
    app.collection({
      name: 'bars',
    });
    app.collection({
      name: 'foos',
      fields: [
        {
          type: 'hasMany',
          name: 'bars',
        },
      ],
    });
    const response = await agent.get('/api/foos/1/bars');
    expect(response.body).toEqual([1, 2]);
  });

  it('db.middleware', async () => {
    const index = app.middleware.findIndex((m) => m.name === 'table2resource');
    app.middleware.splice(index, 0, async (ctx, next) => {
      app.collection({
        name: 'tests',
      });
      await next();
    });
    const response = await agent.get('/api/tests');
    expect(response.body).toEqual([1, 2]);
  });

  it('db.middleware', async () => {
    const index = app.middleware.findIndex((m) => m.name === 'table2resource');
    app.middleware.splice(index, 0, async (ctx, next) => {
      app.collection({
        name: 'bars',
      });
      app.collection({
        name: 'foos',
        fields: [
          {
            type: 'hasMany',
            name: 'bars',
          },
        ],
      });
      await next();
    });

    const response = await agent.get('/api/foos/1/bars');
    expect(response.body).toEqual([1, 2]);
  });

  it('should create application with plugins config', async () => {});
});

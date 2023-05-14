import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import Plugin from '../index';
import PluginACL from '@nocobase/plugin-acl';

describe('actions test', () => {
  let app: MockServer;
  let db: Database;
  let ctx;
  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });
    app.plugin(PluginACL, {
      name: 'acl',
    });
    ctx = {
      db,
      state: {
        currentRole: 'admin',
      },
    };
    await app.cleanDb();

    app.plugin(Plugin);
    await app.load();
    await app.db.sync();

    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should call list action', async () => {
    const listResponse = await app.agent().resource('customRequest').list();

    expect(listResponse.statusCode).toEqual(200);
  });
  it('should call set action', async () => {
    app.resourcer.use(
      (ctx, next) => {
        ctx.state.currentRole = 'admin';
        ctx.state.currentUser = {
          id: 1,
        };

        return next();
      },
      {
        before: 'acl',
      },
    );
    const setResponse = await app
      .agent()
      .resource('customRequest')
      .set({
        filterByTk: 'evhgnygin9z',
        values: {
          headers: {
            'x-Role': 'admin',
          },
          key: 'evhgnygin9z',
          options: { name: 'oeclpwnszc1', method: 'GET', headers: [], params: [], url: 'http://baidu.com' },
        },
      });
    expect(setResponse.statusCode).toEqual(200);
  });

  it('should call get action', async () => {
    app.resourcer.use(
      (ctx, next) => {
        ctx.state.currentRole = 'admin';
        ctx.state.currentUser = {
          id: 1,
        };

        return next();
      },
      {
        before: 'acl',
      },
    );
    await app
      .agent()
      .resource('customRequest')
      .set({
        filterByTk: 'evhgnygin9m',
        values: {
          key: 'evhgnygin9m',
          options: { name: 'oeclpwnszc1', method: 'GET', headers: [], params: [], url: 'http://baidu.com' },
        },
      });
    const getRes = await app.agent().resource('customRequest').get({
      filterByTk: 'evhgnygin9m',
    });
    expect(getRes.statusCode).toEqual(200);
  });
  it('should call send action', async () => {
    app.resourcer.use(
      (ctx, next) => {
        ctx.state.currentRole = 'admin';
        ctx.state.currentUser = {
          id: 1,
        };

        return next();
      },
      {
        before: 'acl',
      },
    );
    await app
      .agent()
      .resource('customRequest')
      .set({
        filterByTk: 'evhgnygin9m',
        values: {
          headers: {
            'x-Role': 'admin',
          },
          key: 'evhgnygin9m',
          options: { name: 'oeclpwnszc1', method: 'GET', headers: [], params: [], url: 'http://baidu.com' },
        },
      });
    const sendRes = await app.agent().resource('customRequest').send({
      filterByTk: 'evhgnygin9m',
    });
    expect(sendRes.statusCode).toBeLessThanOrEqual(500);
  });
});

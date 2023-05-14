import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import Plugin from '../index';
import PluginACL from '@nocobase/plugin-acl';

describe('roles custom request action test', () => {
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
    const listResponse = await app.agent().resource('rolesCustomRequest').list();

    expect(listResponse.statusCode).toEqual(200);
  });
  it('should call set and get action', async () => {
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
      .resource('rolesCustomRequest')
      .set({
        filterByTk: 'evhgnygin9z',
        values: {
          headers: {
            'x-Role': 'admin',
          },
          customRequestKey: 'evhgnygin9z',
          roleName: 'admin',
        },
      });

    const getResponse = await app
      .agent()
      .resource('rolesCustomRequest')
      .get({
        filterByTk: 'evhgnygin9z',
        values: {
          headers: {
            'x-Role': 'admin',
          },
        },
      });

    expect(setResponse.statusCode).toEqual(200);
    expect(getResponse.statusCode).toEqual(200);
  });
});

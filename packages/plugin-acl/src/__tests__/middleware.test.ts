import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';
import { Database, Model } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import PluginACL from '@nocobase/plugin-acl';

describe('middleware', () => {
  let app: MockServer;
  let role: Model;
  let db: Database;
  let acl: ACL;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();

    db = app.db;
    const aclPlugin = app.getPlugin<PluginACL>('PluginACL');
    acl = aclPlugin.getACL();

    await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
      context: {},
    });
  });

  it('should throw 403 when no permission', async () => {
    const response = await app.agent().resource('posts').create({
      values: {},
    });

    expect(response.statusCode).toEqual(403);
  });

  it('should return 200 when role has permission', async () => {
    await db.getRepository('roles').update({
      filterByTk: 'admin',
      values: {
        strategy: {
          actions: ['create:all'],
        },
      },
    });

    const response = await app.agent().resource('posts').create({
      values: {},
    });

    expect(response.statusCode).toEqual(200);
  });
});

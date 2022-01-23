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

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.getPlugin<PluginACL>('PluginACL').getACL();

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
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'posts').create({
      values: {
        name: 'title',
        type: 'string',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'posts').create({
      values: {
        name: 'description',
        type: 'string',
      },
      context: {},
    });
  });

  afterAll(async () => {
    await app.destroy();
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

  it('should merge can result params', async () => {
    await app
      .agent()
      .resource('roles.resources')
      .create({
        associatedIndex: role.get('name') as string,
        values: {
          name: 'posts',
          usingActionsConfig: true,
          actions: [
            {
              name: 'create',
              fields: ['title'],
            },
          ],
        },
      });

    await app
      .agent()
      .resource('posts')
      .create({
        values: {
          title: 'post-title',
          description: 'post-description',
        },
      });

    const post = await db.getRepository('posts').findOne();
    expect(post.get('title')).toEqual('post-title');
    expect(post.get('description')).toBeNull();
  });
});

import { MockServer } from '@nocobase/test';
import { changeMockUser, prepareApp } from './prepare';
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

    await db.getRepository('collections.fields', 'posts').create({
      values: {
        name: 'createdById',
        type: 'integer',
      },
      context: {},
    });
  });

  afterEach(async () => {
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

  it('should limit fields on view actions', async () => {
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
              fields: ['title', 'description'],
            },
            {
              name: 'view',
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
    expect(post.get('description')).toEqual('post-description');

    const response = await app.agent().resource('posts').list({});
    expect(response.statusCode).toEqual(200);

    const data = response.body.data[0];

    expect(data['id']).not.toBeUndefined();
    expect(data['title']).toEqual('post-title');
    expect(data['description']).toBeUndefined();
  });

  it('should parse template value on action params', async () => {
    changeMockUser({
      id: 2,
    });

    await app
      .agent()
      .resource('rolesResourcesScopes')
      .create({
        values: {
          name: 'own',
          scope: {
            createdById: '{{ ctx.state.currentUser.id }}',
          },
        },
      });

    const scope = await db.getRepository('rolesResourcesScopes').findOne();

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
              fields: ['title', 'description', 'createdById'],
            },
            {
              name: 'view',
              fields: ['title'],
              scope: scope.get('id'),
            },
          ],
        },
      });

    await app
      .agent()
      .resource('posts')
      .create({
        values: {
          title: 't1',
          description: 'd1',
          createdById: 1,
        },
      });

    await app
      .agent()
      .resource('posts')
      .create({
        values: {
          title: 't2',
          description: 'p2',
          createdById: 2,
        },
      });

    const response = await app.agent().resource('posts').list();
    const data = response.body.data;
    expect(data.length).toEqual(1);
  });

  it('should change fields params to whitelist in create action', async () => {
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

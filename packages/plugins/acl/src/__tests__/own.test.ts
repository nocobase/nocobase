import { ACL } from '@nocobase/acl';
import { Database } from '@nocobase/database';
import PluginACL from '@nocobase/plugin-acl';
import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import PluginUser from '@nocobase/plugin-users';
import { mockServer, MockServer } from '@nocobase/test';
import supertest from 'supertest';

describe('own test', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  let pluginUser: PluginUser;
  let adminToken: string;
  let userToken: string;

  let admin;
  let user;

  let role;
  let agent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });

    await app.cleanDb();

    app.plugin(PluginUiSchema);
    app.plugin(PluginCollectionManager);
    app.plugin(PluginUser, {
      jwt: {
        secret: process.env.APP_KEY || 'test-key',
      },
    });

    app.plugin(PluginACL);
    await app.loadAndInstall();
    db = app.db;

    const PostCollection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsToMany', name: 'tags' },
      ],
      createdBy: true,
    });

    const TagCollection = db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'posts' },
      ],
      createdBy: true,
    });

    const TestCollection = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name' }],
    });

    await app.db.sync();

    agent = supertest.agent(app.callback());

    acl = app.acl;

    role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    admin = await db.getRepository('users').findOne();

    pluginUser = app.getPlugin('@nocobase/plugin-users');

    adminToken = pluginUser.jwtService.sign({ userId: admin.get('id') });

    user = await db.getRepository('users').create({
      values: {
        nickname: 'test',
        roles: ['admin'],
      },
    });

    userToken = pluginUser.jwtService.sign({ userId: user.get('id') });
  });

  it('should list without createBy', async () => {
    let response = await agent
      .patch('/roles/admin')
      .send({
        strategy: {
          actions: ['view:own'],
        },
      })
      .set({ Authorization: 'Bearer ' + adminToken });

    response = await agent.get('/tests:list').set({ Authorization: 'Bearer ' + userToken });
    expect(response.statusCode).toEqual(200);
  });

  it('should delete with createdBy', async () => {
    let response = await agent
      .patch('/roles/admin')
      .send({
        strategy: {
          actions: ['view:own', 'create', 'destroy:own'],
        },
      })
      .set({ Authorization: 'Bearer ' + adminToken });

    response = await agent
      .get('/posts:create')
      .send({
        title: 't1',
      })
      .set({ Authorization: 'Bearer ' + userToken });

    expect(response.statusCode).toEqual(200);

    const data = response.body;
    const id = data.data['id'];

    response = await agent.delete(`/posts/${id}`).set({ Authorization: 'Bearer ' + userToken });
    expect(response.statusCode).toEqual(200);
    expect(await db.getRepository('posts').count()).toEqual(0);
  });
});

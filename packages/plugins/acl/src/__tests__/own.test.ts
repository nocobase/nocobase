import { ACL } from '@nocobase/acl';
import { Database } from '@nocobase/database';
import PluginUser from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

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
  let adminAgent;
  let userAgent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
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

    await db.sync();

    agent = app.agent();

    acl = app.acl;

    role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    admin = await db.getRepository('users').findOne();

    pluginUser = app.getPlugin('users');

    adminAgent = app.agent().login(admin);

    user = await db.getRepository('users').create({
      values: {
        nickname: 'test',
        roles: ['admin'],
      },
    });

    userAgent = app.agent().login(user);
  });

  it('should list without createBy', async () => {
    await adminAgent
      .patch('/roles/admin')
      .send({
        strategy: {
          actions: ['view:own'],
        },
      })
      .set({ Authorization: 'Bearer ' + adminToken });

    const response = await userAgent.get('/tests:list');
    expect(response.statusCode).toEqual(200);
  });

  it('should delete with createdBy', async () => {
    await adminAgent.resource('roles').update({
      filterByTk: 'admin',
      values: {
        strategy: {
          actions: ['view:own', 'create', 'destroy:own'],
        },
      },
    });

    let response = await userAgent.resource('posts').create({
      values: {
        title: 't1',
      },
    });

    expect(response.statusCode).toEqual(200);

    const data = response.body;
    const id = data.data['id'];

    response = await userAgent.resource('posts').destroy({
      filterByTk: id,
    });
    expect(response.statusCode).toEqual(200);
    expect(await db.getRepository('posts').count()).toEqual(0);
  });
});

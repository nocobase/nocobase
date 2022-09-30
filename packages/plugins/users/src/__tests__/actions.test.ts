import Database from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import PluginUsers from '../server';
import { userPluginConfig } from './utils';
import PluginACL from '@nocobase/plugin-acl';

describe('actions', () => {
  let app: MockServer;
  let db: Database;
  let adminUser;
  const roleNames: string[] = [];
  let agent;
  let adminAgent;
  let pluginUser;

  beforeEach(async () => {
    app = mockServer();
    await app.cleanDb();
    process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
    process.env.INIT_ROOT_PASSWORD = '123456';
    process.env.INIT_ROOT_NICKNAME = 'Test';
    app.plugin(PluginACL);
    app.plugin(PluginUsers, userPluginConfig);


    await app.loadAndInstall();
    db = app.db;

    pluginUser = app.getPlugin('@nocobase/plugin-users');
    adminUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
    });
    // const repository = db.getRepository('rolesUsers', adminUser.get('id')) as any;
    // const roles = await db.getRepository('rolesUsers').find({
    //   filter: {
    //     userId: adminUser.get('id'),
    //   },
    //   order: [['default', 'DESC']],
    // });
    const repository = db.getRepository('users.roles', adminUser.get('id')) as any;
    const roles = await repository.find({
      order: [['default', 'DESC']],
    });

    roles.forEach((role) => {
      roleNames.push(role.get('name') as string);
    });

    agent = app.agent();
    adminAgent = app.agent().auth(
      pluginUser.jwtService.sign({
        userId: adminUser.get('id'),
        roleNames,
      }),
      { type: 'bearer' },
    );
  });

  afterEach(async () => {
    await db.close();
  });

  it('should login user with password', async () => {
    const { INIT_ROOT_EMAIL, INIT_ROOT_PASSWORD } = process.env;

    let response = await agent.resource('users').check();
    expect(response.body?.data?.id).toBeUndefined();

    response = await agent.post('/users:signin').send({
      email: INIT_ROOT_EMAIL,
      password: INIT_ROOT_PASSWORD,
    });

    expect(response.statusCode).toEqual(200);

    const data = response.body.data;
    const token = data.token;
    expect(token).toBeDefined();

    response = await agent.get('/users:check').set({ Authorization: 'Bearer ' + token });
    expect(response.body.data.id).toBeDefined();
  });

  it('update profile', async () => {
    const res1 = await agent.resource('users').updateProfile({
      filterByTk: adminUser.id,
      values: {
        nickname: 'a',
      },
    });
    // because load PluginACL plugin ,so status will be 403
    expect(res1.status).toBe(403);

    // need req login api first , set cache user login status (token status)
    const { INIT_ROOT_EMAIL, INIT_ROOT_PASSWORD } = process.env;
     await agent.post('/users:signin').send({
      email: INIT_ROOT_EMAIL,
      password: INIT_ROOT_PASSWORD,
    });
    const res2 = await adminAgent.resource('users').updateProfile({
      filterByTk: adminUser.id,
      values: {
        nickname: 'a',
      },
    });
    expect(res2.status).toBe(200);
  });
});

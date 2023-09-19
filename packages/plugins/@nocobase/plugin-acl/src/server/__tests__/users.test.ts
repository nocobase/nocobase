import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('actions', () => {
  let app: MockServer;
  let db: Database;
  let adminUser;
  let agent;
  let adminAgent;
  let pluginUser;

  beforeEach(async () => {
    process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
    process.env.INIT_ROOT_PASSWORD = '123456';
    process.env.INIT_ROOT_NICKNAME = 'Test';

    app = await prepareApp();
    db = app.db;

    pluginUser = app.getPlugin('users');
    adminUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
      appends: ['roles'],
    });

    agent = app.agent();
    adminAgent = app.agent().login(adminUser);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('update profile with roles', async () => {
    const res2 = await adminAgent.resource('users').updateProfile({
      filterByTk: adminUser.id,
      values: {
        nickname: 'a',
        roles: adminUser.roles,
      },
    });
    expect(res2.status).toBe(200);
  });

  it('can destroy users role', async () => {
    const role2 = await db.getRepository('roles').create({
      values: {
        name: 'test',
      },
    });

    const users2 = await db.getRepository('users').create({
      values: {
        email: 'test2@nocobase.com',
        name: 'test2',
        password: '123456',
        roles: [
          {
            name: 'test',
          },
        ],
      },
    });

    let response = await agent.post('/auth:signIn').send({
      email: 'test2@nocobase.com',
      password: '123456',
    });

    expect(response.statusCode).toEqual(200);

    const token = response.body.data.token;

    const loggedAgent = app.agent().auth(token, { type: 'bearer' });

    const rolesCheckResponse = (await loggedAgent.set('Accept', 'application/json').get('/roles:check')) as any;

    expect(rolesCheckResponse.statusCode).toEqual(200);

    await db.getRepository('roles').destroy({
      filterByTk: 'test',
    });

    response = await agent.post('/auth:signIn').send({
      email: 'test2@nocobase.com',
      password: '123456',
    });

    expect(response.statusCode).toEqual(200);

    const rolesCheckResponse2 = (await loggedAgent.set('Accept', 'application/json').get('/roles:check')) as any;

    expect(rolesCheckResponse2.status).toEqual(401);
    expect(rolesCheckResponse2.body.errors[0].code).toEqual('ROLE_NOT_FOUND_ERR');
  });

  it('should destroy through table record when destroy role', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test',
      },
    });

    const users2 = await db.getRepository('users').create({
      values: {
        email: 'test2@nocobase.com',
        name: 'test2',
        password: '123456',
        roles: [
          {
            name: 'test',
          },
        ],
      },
    });

    expect(await users2.countRoles()).toEqual(1);

    await db.getRepository('roles').destroy({
      filterByTk: 'test',
    });

    expect(await users2.countRoles()).toEqual(0);

    await db.getRepository('roles').create({
      values: {
        name: 'test',
      },
    });

    expect(await users2.countRoles()).toEqual(0);
  });
});

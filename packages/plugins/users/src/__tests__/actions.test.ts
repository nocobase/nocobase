import Database from '@nocobase/database';
import PluginACL from '@nocobase/plugin-acl';
import { mockServer, MockServer } from '@nocobase/test';
import supertest from 'supertest';
import PluginUsers from '../server';
import { userPluginConfig } from './utils';

describe('actions', () => {
  let api: MockServer;
  let db: Database;
  let agent;
  let pluginUser;

  beforeEach(async () => {
    api = mockServer();
    await api.cleanDb();
    process.env.INIT_ADMIN_EMAIL = 'test@nocobase.com';
    process.env.INIT_ADMIN_PASSWORD = '123456';
    process.env.INIT_ADMIN_NICKNAME = 'Test';
    api.plugin(PluginUsers, userPluginConfig);
    api.plugin(PluginACL);

    await api.loadAndInstall();
    db = api.db;

    agent = supertest.agent(api.callback());
    pluginUser = api.getPlugin('@nocobase/plugin-users');
  });

  afterEach(async () => {
    await db.close();
  });

  it('should login user with password', async () => {
    const { INIT_ADMIN_EMAIL, INIT_ADMIN_PASSWORD } = process.env;

    let response = await api.agent().resource('users').check();
    expect(response.body.data.id).toBeUndefined();

    response = await agent.post('/users:signin').send({
      email: INIT_ADMIN_EMAIL,
      password: INIT_ADMIN_PASSWORD,
    });

    expect(response.statusCode).toEqual(200);

    const data = response.body.data;
    const token = data.token;
    expect(token).toBeDefined();

    response = await agent.get('/users:check').set({ Authorization: 'Bearer ' + token });
    expect(response.body.data.id).toBeDefined();
  });
});

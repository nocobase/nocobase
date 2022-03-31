import { mockServer, MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import PluginACL from '@nocobase/plugin-acl';
import PluginUsers from '../server';
import supertest from 'supertest';
import { userPluginConfig } from './utils';

describe('actions', () => {
  let api: MockServer;
  let db: Database;
  let agent;
  let pluginUser;

  beforeEach(async () => {
    api = mockServer();
    await api.cleanDb();
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
    const { adminEmail, adminPassword } = userPluginConfig;

    let response = await api.agent().resource('users').check();
    expect(response.statusCode).toEqual(401);

    response = await agent.post('/users:signin').send({
      email: adminEmail,
      password: adminPassword,
    });

    expect(response.statusCode).toEqual(200);

    const data = response.body.data;
    const token = data.token;
    expect(token).toBeDefined();

    response = await agent.get('/users:check').set({ Authorization: 'Bearer ' + token });
    expect(response.statusCode).toEqual(200);
  });
});

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

    pluginUser = app.getPlugin('@nocobase/plugin-users');
    adminUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL
      },
      appends: ['roles']
    });

    agent = app.agent();
    adminAgent = app.agent().auth(
      pluginUser.jwtService.sign({
        userId: adminUser.get('id'),
      }),
      { type: 'bearer' },
    );
  });

  afterEach(async () => {
    await db.close();
  });

  it('update profile with roles', async () => {
    const res2 = await adminAgent.resource('users').updateProfile({
      filterByTk: adminUser.id,
      values: {
        nickname: 'a',
        roles: adminUser.roles
      }
    });
    expect(res2.status).toBe(200);
  });
});

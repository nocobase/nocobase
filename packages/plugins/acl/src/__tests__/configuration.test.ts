import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { prepareApp } from './prepare';

describe('configuration', () => {
  let app: MockServer;
  let db: Database;
  let admin;
  let adminAgent;
  let user;
  let userAgent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    const UserRepo = db.getCollection('users').repository;
    admin = await UserRepo.create({
      values: {
        roles: ['admin']
      }
    });
    user = await UserRepo.create({
      values: {}
    });

    const userPlugin = app.getPlugin('@nocobase/plugin-users') as UsersPlugin;
    adminAgent = app.agent().auth(userPlugin.jwtService.sign({
      userId: admin.get('id'),
    }), { type: 'bearer' });

    userAgent = app.agent().auth(userPlugin.jwtService.sign({
      userId: user.get('id'),
    }), { type: 'bearer' });
  });

  it.skip('should list collections', async () => {
    expect((await userAgent.resource('collections').create()).statusCode).toEqual(403);
    expect((await userAgent.resource('collections').list()).statusCode).toEqual(200);
  });

  it('should allow when role has allowConfigure with true value', async () => {
    expect((await adminAgent.resource('collections').create()).statusCode).toEqual(200);
    expect((await adminAgent.resource('collections').list()).statusCode).toEqual(200);
  });
});

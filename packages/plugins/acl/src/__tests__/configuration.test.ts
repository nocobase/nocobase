import { Database } from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('configuration', () => {
  let app: MockServer;
  let db: Database;
  let admin;
  let adminAgent;
  let user;
  let userAgent;
  let guestAgent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    await db.getRepository('roles').create({
      values: {
        name: 'test1',
        allowConfigure: true,
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test2',
      },
    });

    const UserRepo = db.getCollection('users').repository;
    admin = await UserRepo.create({
      values: {
        roles: ['test1'],
      },
    });
    user = await UserRepo.create({
      values: {
        roles: ['test2'],
      },
    });

    await app.cache.set(admin.get('id'), 1);
    await app.cache.set(user.get('id'), 1);

    const userPlugin = app.getPlugin('@nocobase/plugin-users') as UsersPlugin;
    adminAgent = app.agent().auth(
      userPlugin.jwtService.sign({
        userId: admin.get('id'),
        roleNames: admin.get('roles'),
      }),
      { type: 'bearer' },
    );

    userAgent = app.agent().auth(
      userPlugin.jwtService.sign({
        userId: user.get('id'),
        roleNames: user.get('roles'),
      }),
      { type: 'bearer' },
    );

    guestAgent = app.agent();
  });

  it('should list collections', async () => {
    expect((await userAgent.resource('collections').create()).statusCode).toEqual(403);
    expect((await userAgent.resource('collections').list()).statusCode).toEqual(200);
  });

  it('should not create/list collections', async () => {
    expect((await guestAgent.resource('collections').create()).statusCode).toEqual(403);
    expect((await guestAgent.resource('collections').list()).statusCode).toEqual(403);
  });

  it('should allow when role has allowConfigure with true value', async () => {
    expect((await adminAgent.resource('collections').create()).statusCode).toEqual(200);
    expect((await adminAgent.resource('collections').list()).statusCode).toEqual(200);
  });
});

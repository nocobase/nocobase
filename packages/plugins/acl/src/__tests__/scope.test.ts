import { prepareApp } from './prepare';
import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { Cache } from '@nocobase/cache';
import UsersPlugin from '@nocobase/plugin-users';

describe('scope api', () => {
  let app: MockServer;
  let db: Database;
  let cache: Cache;

  let admin;
  let adminAgent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    process.env.APP_KEY = 'secret'
    app = await prepareApp();
    db = app.db;
    cache = app.cache;

    const UserRepo = db.getCollection('users').repository;
    admin = await UserRepo.create({
      values: {
        roles: ['admin'],
      },
    });
    await cache.set(admin.get('id'),1);
    const userPlugin = app.getPlugin('@nocobase/plugin-users') as UsersPlugin;
    adminAgent = app.agent().auth(
      userPlugin.jwtService.sign({
        userId: admin.get('id'),
        roleNames: admin.get('roles'),
      }),
      { type: 'bearer' },
    );
  });

  it('should create scope of resource', async () => {
    const response = await adminAgent.resource('rolesResourcesScopes').create({
      values: {
        resourceName: 'posts',
        name: 'published posts',
        scope: {
          published: true,
        },
      },
    });

    expect(response.statusCode).toEqual(200);

    const scope = await db.getRepository('rolesResourcesScopes').findOne({
      filter: {
        name: 'published posts',
      },
    });

    expect(scope.get('scope')).toMatchObject({
      published: true,
    });
  });
});

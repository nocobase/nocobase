import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { prepareApp } from './prepare';
import UsersPlugin from '@nocobase/plugin-users';

describe('write role to acl', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should write role to acl if role instance exists in db', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'test',
      },
    });

    // remove role from acl
    app.acl.removeRole('test');

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test'],
      },
    });

    const userPlugin = app.getPlugin('users') as UsersPlugin;
    const agent = app.agent().auth(
      userPlugin.jwtService.sign({
        userId: user.get('id'),
      }),
      { type: 'bearer' },
    );

    // @ts-ignore
    const response = await agent.resource('roles').check();

    expect(response.statusCode).toEqual(200);
  });
});

import { Database } from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';

import { prepareApp } from './prepare';

describe('role check action', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should return role info', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'test',
      },
    });
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

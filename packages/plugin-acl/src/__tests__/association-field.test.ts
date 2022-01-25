import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import { prepareApp } from './prepare';
import PluginACL from '@nocobase/plugin-acl';

describe('association field acl', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    const aclPlugin = app.getPlugin<PluginACL>('PluginACL');

    acl = aclPlugin.getACL();
  });

  it('should allow association fields access', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'users',
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'orders',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'users').create({
      values: {
        interface: 'linkTo',
        name: 'orders',
        type: 'hasMany',
        target: 'orders',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'orders').create({
      values: {
        name: 'content',
        type: 'string',
      },
      context: {},
    });

    await app
      .agent()
      .resource('roles.resources')
      .create({
        associatedIndex: role.get('name') as string,
        values: {
          name: 'users',
          usingActionsConfig: true,
          actions: [
            {
              name: 'create',
              fields: ['orders'],
            },
            {
              name: 'list',
              fields: ['orders'],
            },
          ],
        },
      });

    const createResponse = await app
      .agent()
      .resource('users')
      .create({
        values: {
          orders: [
            {
              content: 'apple',
            },
          ],
        },
      });

    expect(createResponse.statusCode).toEqual(200);

    const user = await db.getRepository('users').findOne();
    // @ts-ignore
    expect(await user.countOrders()).toEqual(1);

    expect(
      acl.can({
        role: 'admin',
        resource: 'users.orders',
        action: 'list',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'users.orders',
      action: 'list',
    });

    expect(
      acl.can({
        role: 'admin',
        resource: 'orders',
        action: 'list',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'orders',
      action: 'list',
    });
  });
});

import { MockServer } from '@nocobase/test';
import { Database, Model } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import { prepareApp } from './prepare';
import PluginACL from '@nocobase/plugin-acl';

describe('association field acl', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  let role: Model;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    const aclPlugin = app.getPlugin<PluginACL>('PluginACL');

    acl = aclPlugin.getACL();

    role = await db.getRepository('roles').create({
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
        associatedIndex: 'admin',
        values: {
          name: 'users',
          usingActionsConfig: true,
          actions: [
            {
              name: 'create',
              fields: ['orders'],
            },
            {
              name: 'view',
              fields: ['orders'],
            },
          ],
        },
      });
  });

  it('should revoke association action on action revoke', async () => {
    expect(
      acl.can({
        role: 'admin',
        resource: 'users.orders',
        action: 'add',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'users.orders',
      action: 'add',
    });

    const viewAction = await db.getRepository('rolesResourcesActions').findOne({
      filter: {
        name: 'view',
      },
    });

    const actionId = viewAction.get('id') as number;

    const response = await app
      .agent()
      .resource('roles.resources')
      .update({
        associatedIndex: 'admin',
        values: {
          name: 'users',
          usingActionsConfig: true,
          actions: [
            {
              id: actionId,
            },
          ],
        },
      });

    expect(response.statusCode).toEqual(200);

    expect(
      acl.can({
        role: 'admin',
        resource: 'users.orders',
        action: 'add',
      }),
    ).toBeNull();
  });

  it('should revoke association action on field deleted', async () => {});

  it('should allow association fields access', async () => {
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

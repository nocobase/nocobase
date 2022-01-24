import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';
import { Database } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import PluginACL from '../server';

describe('acl', () => {
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

  it('should works with universal actions', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    const role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'create',
      }),
    ).toBeNull();

    // grant universal action
    await app
      .agent()
      .resource('roles')
      .update({
        resourceIndex: 'admin',
        values: {
          strategy: {
            actions: ['create'],
          },
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });
  });

  it('should works with resources actions', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    const role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'c1',
        title: 'table1',
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'c2',
        title: 'table2',
      },
    });

    await app
      .agent()
      .resource('rolesResourcesScopes')
      .create({
        values: {
          resourceName: 'c1',
          name: 'published',
          scope: {
            published: true,
          },
        },
      });

    const publishedScope = await db.getRepository('rolesResourcesScopes').findOne();

    await app
      .agent()
      .resource('roles.resources')
      .create({
        associatedIndex: role.get('name') as string,
        values: {
          name: 'c1',
          usingActionsConfig: true,
          actions: [
            {
              name: 'create',
              scope: publishedScope.get('id'),
            },
            {
              name: 'view',
              fields: ['title', 'age'],
            },
          ],
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'c1',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'c1',
      action: 'create',
      params: {
        filter: { published: true },
        fields: [],
      },
    });

    expect(
      acl.can({
        role: 'admin',
        resource: 'c1',
        action: 'view',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'c1',
      action: 'view',
      params: {
        fields: ['title', 'age'],
      },
    });

    // revoke action
    const response = await app
      .agent()
      .resource('roles.resources')
      .list({
        associatedIndex: role.get('name') as string,
        appends: ['actions'],
      });

    const actions = response.body.data[0].actions;
    const resourceId = response.body.data[0].id;

    const viewActionId = actions.find((action) => action.name === 'view').id;

    await app
      .agent()
      .resource('roles.resources')
      .update({
        associatedIndex: role.get('name') as string,
        resourceIndex: resourceId,
        values: {
          name: 'c1',
          usingActionsConfig: true,
          actions: [
            {
              id: viewActionId,
              name: 'view',
              fields: ['title', 'age'],
            },
          ],
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'c1',
        action: 'create',
      }),
    ).toBeNull();
  });

  it('should revoke actions when not using actions config', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    const role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        title: 'posts',
      },
    });

    await app
      .agent()
      .resource('roles.resources')
      .create({
        associatedIndex: role.get('name') as string,
        values: {
          name: 'posts',
          usingActionsConfig: true,
          actions: [
            {
              name: 'create',
            },
          ],
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });

    await app
      .agent()
      .resource('roles.resources')
      .update({
        associatedIndex: role.get('name') as string,
        resourceIndex: (
          await db.getRepository('rolesResources').findOne({
            filter: {
              name: 'posts',
              roleName: 'admin',
            },
          })
        ).get('id') as string,
        values: {
          usingActionsConfig: false,
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'create',
      }),
    ).toBeNull();

    await app
      .agent()
      .resource('roles.resources')
      .update({
        associatedIndex: role.get('name') as string,
        resourceIndex: (
          await db.getRepository('rolesResources').findOne({
            filter: {
              name: 'posts',
              roleName: 'admin',
            },
          })
        ).get('id') as string,
        values: {
          usingActionsConfig: true,
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });
  });
});

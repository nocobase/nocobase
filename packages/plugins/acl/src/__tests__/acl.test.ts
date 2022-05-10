import { ACL } from '@nocobase/acl';
import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { changeMockRole, prepareApp } from './prepare';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';

describe('acl', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  let uiSchemaRepository: UiSchemaRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    uiSchemaRepository = db.getRepository('uiSchemas');
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

  it('should deny when resource action has no resource', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
        strategy: {
          actions: ['update:own', 'destroy:own', 'create', 'view'],
        },
      },
    });

    changeMockRole('admin');

    // create c1 collection
    await db.getRepository('collections').create({
      values: {
        name: 'c1',
        title: 'table1',
      },
    });

    // create c2 collection
    await db.getRepository('collections').create({
      values: {
        name: 'c2',
        title: 'table2',
      },
    });

    await app
      .agent()
      .resource('roles.resources', 'admin')
      .create({
        values: {
          name: 'c1',
          usingActionsConfig: true,
          actions: [],
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'c1',
        action: 'list',
      }),
    ).toBeNull();
  });

  it('should works with resources actions', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
        strategy: {
          actions: ['list'],
        },
      },
    });

    changeMockRole('admin');

    // create c1 collection
    await db.getRepository('collections').create({
      values: {
        name: 'c1',
        title: 'table1',
      },
    });

    // create c2 collection
    await db.getRepository('collections').create({
      values: {
        name: 'c2',
        title: 'table2',
      },
    });

    // create c1 published scope
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

    // set admin resources
    await app
      .agent()
      .resource('roles.resources', 'admin')
      .create({
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
        fields: ['age', 'title', 'id', 'createdAt', 'updatedAt'],
      },
    });

    // revoke action
    const response = await app
      .agent()
      .resource('roles.resources', role.get('name'))
      .list({
        appends: ['actions'],
      });

    expect(response.statusCode).toEqual(200);

    const actions = response.body.data[0].actions;
    const collectionName = response.body.data[0].name;

    await app
      .agent()
      .resource('roles.resources', role.get('name'))
      .update({
        filterByTk: collectionName,
        values: {
          name: 'c1',
          usingActionsConfig: true,
          actions: [
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
    ).toBeNull();
  });

  it('should revoke resource when collection destroy', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        collectionName: 'posts',
        type: 'string',
        name: 'title',
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
              name: 'view',
              fields: ['title'],
            },
          ],
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'view',
      }),
    ).not.toBeNull();

    await db.getRepository('collections').destroy({
      filter: {
        name: 'posts',
      },
    });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'view',
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
      .resource('roles.resources', role.get('name'))
      .update({
        filterByTk: (
          await db.getRepository('rolesResources').findOne({
            filter: {
              name: 'posts',
              roleName: 'admin',
            },
          })
        ).get('name') as string,
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
      .resource('roles.resources', role.get('name'))
      .update({
        filterByTk: (
          await db.getRepository('rolesResources').findOne({
            filter: {
              name: 'posts',
              roleName: 'admin',
            },
          })
        ).get('name') as string,
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

  it('should add fields when field created', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        collectionName: 'posts',
        type: 'string',
        name: 'title',
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
              name: 'view',
              fields: ['title'],
            },
          ],
        },
      });

    const allowFields = acl.can({
      role: 'admin',
      resource: 'posts',
      action: 'view',
    })['params']['fields'];

    expect(allowFields.includes('title')).toBeTruthy();

    await db.getRepository('fields').create({
      values: {
        collectionName: 'posts',
        type: 'string',
        name: 'description',
      },
    });

    const newAllowFields = acl.can({
      role: 'admin',
      resource: 'posts',
      action: 'view',
    })['params']['fields'];

    expect(newAllowFields.includes('description')).toBeTruthy();
  });

  it('should get role menus', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
        strategy: {
          actions: ['view'],
        },
      },
    });

    changeMockRole('admin');

    const menuResponse = await app.agent().resource('roles.menuUiSchemas', 'admin').list();

    expect(menuResponse.statusCode).toEqual(200);
  });

  it('should toggle role menus', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
        strategy: {
          actions: ['*'],
        },
      },
    });

    changeMockRole('admin');

    const schema = {
      'x-uid': 'test',
    };

    await uiSchemaRepository.insert(schema);

    const response = await app
      .agent()
      .resource('roles.menuUiSchemas', 'admin')
      .toggle({
        values: { tk: 'test' },
      });

    expect(response.statusCode).toEqual(200);
  });

  it('should sync data to acl before app start', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
        resources: [
          {
            name: 'posts',
            usingActionsConfig: true,
            actions: [
              {
                name: 'view',
                fields: ['title'],
              },
            ],
          },
        ],
      },
      hooks: false,
    });

    expect(acl.getRole('admin')).toBeUndefined();

    await app.start();

    expect(acl.getRole('admin')).toBeDefined();

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'view',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'view',
    });
  });
});

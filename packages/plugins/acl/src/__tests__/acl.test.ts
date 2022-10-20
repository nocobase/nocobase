import { ACL } from '@nocobase/acl';
import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import UsersPlugin from '@nocobase/plugin-users';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { prepareApp } from './prepare';

describe('acl', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;
  let admin;
  let adminAgent;

  let uiSchemaRepository: UiSchemaRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    const UserRepo = db.getCollection('users').repository;
    admin = await UserRepo.create({
      values: {
        roles: ['admin'],
      },
    });

    const userPlugin = app.getPlugin('@nocobase/plugin-users') as UsersPlugin;

    adminAgent = app.agent().auth(
      userPlugin.jwtService.sign({
        userId: admin.get('id'),
      }),
      { type: 'bearer' },
    );

    uiSchemaRepository = db.getRepository('uiSchemas');
  });

  it('should works with universal actions', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'new',
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'posts',
        action: 'create',
      }),
    ).toBeNull();

    // grant universal action
    await adminAgent.resource('roles').update({
      resourceIndex: 'new',
      values: {
        strategy: {
          actions: ['create'],
        },
      },
      forceUpdate: true,
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'posts',
      action: 'create',
    });
  });

  it('should deny when resource action has no resource', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'new',
        strategy: {
          actions: ['update:own', 'destroy:own', 'create', 'view'],
        },
      },
    });

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

    await adminAgent.resource('roles.resources', 'new').create({
      values: {
        name: 'c1',
        usingActionsConfig: true,
        actions: [],
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'c1',
        action: 'list',
      }),
    ).toBeNull();
  });

  it('should works with resources actions', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'new',
        strategy: {
          actions: ['list'],
        },
      },
    });

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
    const {
      body: { data: publishedScope },
    } = await adminAgent.resource('rolesResourcesScopes').create({
      values: {
        resourceName: 'c1',
        name: 'published',
        scope: {
          published: true,
        },
      },
    });

    // await db.getRepository('rolesResourcesScopes').findOne();

    // set admin resources
    await adminAgent.resource('roles.resources', 'new').create({
      values: {
        name: 'c1',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
            scope: publishedScope.id,
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
        role: 'new',
        resource: 'c1',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'c1',
      action: 'create',
      params: {
        filter: { published: true },
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'c1',
        action: 'view',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'c1',
      action: 'view',
      params: {
        fields: ['age', 'title', 'id', 'createdAt', 'updatedAt'],
      },
    });

    // revoke action
    const response = await adminAgent.resource('roles.resources', role.get('name')).list({
      appends: ['actions'],
    });

    expect(response.statusCode).toEqual(200);

    const actions = response.body.data[0].actions;
    const collectionName = response.body.data[0].name;

    await adminAgent.resource('roles.resources', role.get('name')).update({
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
        role: 'new',
        resource: 'c1',
        action: 'create',
      }),
    ).toBeNull();
  });

  it('should revoke resource when collection destroy', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'new',
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

    await adminAgent.resource('roles.resources').create({
      associatedIndex: 'new',
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
        role: 'new',
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
        role: 'new',
        resource: 'posts',
        action: 'view',
      }),
    ).toBeNull();
  });

  it('should revoke actions when not using actions config', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'new',
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        title: 'posts',
      },
    });

    await adminAgent.resource('roles.resources').create({
      associatedIndex: 'new',
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
        role: 'new',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'posts',
      action: 'create',
    });

    await adminAgent.resource('roles.resources', 'new').update({
      filterByTk: (
        await db.getRepository('rolesResources').findOne({
          filter: {
            name: 'posts',
            roleName: 'new',
          },
        })
      ).get('name') as string,
      values: {
        usingActionsConfig: false,
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'posts',
        action: 'create',
      }),
    ).toBeNull();

    await adminAgent.resource('roles.resources', 'new').update({
      filterByTk: (
        await db.getRepository('rolesResources').findOne({
          filter: {
            name: 'posts',
            roleName: 'new',
          },
        })
      ).get('name') as string,
      values: {
        usingActionsConfig: true,
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'posts',
      action: 'create',
    });
  });

  it('should add fields when field created', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'new',
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

    await adminAgent.resource('roles.resources').create({
      associatedIndex: 'new',
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
      role: 'new',
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
      role: 'new',
      resource: 'posts',
      action: 'view',
    })['params']['fields'];

    expect(newAllowFields.includes('description')).toBeTruthy();
  });

  it('should get role menus', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'new',
        strategy: {
          actions: ['view'],
        },
      },
    });

    const menuResponse = await adminAgent.resource('roles.menuUiSchemas', 'new').list();

    expect(menuResponse.statusCode).toEqual(200);
  });

  it('should toggle role menus', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'new',
        strategy: {
          actions: ['*'],
        },
      },
    });
    const UserRepo = db.getCollection('users').repository;
    const user = await UserRepo.create({
      values: {
        roles: ['new'],
      },
    });

    const userPlugin = app.getPlugin('@nocobase/plugin-users') as UsersPlugin;
    const userAgent = app.agent().auth(
      userPlugin.jwtService.sign({
        userId: user.get('id'),
      }),
      { type: 'bearer' },
    );

    const schema = {
      'x-uid': 'test',
    };

    await uiSchemaRepository.insert(schema);

    const response = await userAgent
      // @ts-ignore
      .resource('roles.menuUiSchemas', 'new')
      .toggle({
        values: { tk: 'test' },
      });

    expect(response.statusCode).toEqual(200);
  });

  it('should sync data to acl before app start', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'new',
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

    expect(acl.getRole('new')).toBeUndefined();

    await app.start();

    expect(acl.getRole('new')).toBeDefined();

    expect(
      acl.can({
        role: 'new',
        resource: 'posts',
        action: 'view',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'posts',
      action: 'view',
    });
  });
});

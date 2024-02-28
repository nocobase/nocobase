import { ACL } from '@nocobase/acl';
import { Database } from '@nocobase/database';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('acl', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;
  let admin;
  let adminAgent;

  let userPlugin;

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

    adminAgent = app.agent().login(admin);
    uiSchemaRepository = db.getRepository('uiSchemas');
  });

  test('append createById', async () => {
    const Company = await db.getRepository('collections').create({
      context: {},
      values: {
        name: 'companies',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'hasMany',
            name: 'users',
          },
        ],
      },
    });

    const Repair = await db.getRepository('collections').create({
      context: {},
      values: {
        name: 'repairs',
        createdBy: true,
        fields: [
          {
            type: 'belongsTo',
            name: 'company',
          },
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
    });

    const c1 = await db.getRepository('companies').create({
      values: {
        name: 'c1',
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
      },
    });

    const createResp = await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        name: 'repairs',
        usingActionsConfig: true,
        actions: [
          {
            name: 'list',
            fields: ['id'],
          },
        ],
      },
    });

    expect(createResp.statusCode).toEqual(200);

    const u1 = await db.getRepository('users').create({
      values: {
        name: 'u1',
        company: { id: c1.get('id') },
        roles: ['test-role'],
      },
    });

    const r1 = await db.getRepository('repairs').create({
      values: {
        name: 'r1',
        company: { id: c1.get('id') },
      },
    });

    userPlugin = app.getPlugin('users') as UsersPlugin;

    const testAgent = app.agent().login(u1);

    // @ts-ignore
    const response1 = await testAgent.resource('repairs').list({
      filter: {
        company: {
          id: {
            $isVar: 'currentUser.company.id',
          },
        },
      },
    });

    // @ts-ignore
    const response2 = await testAgent.resource('repairs').list({
      filter: {
        company: {
          id: {
            $isVar: 'currentUser.company.id',
          },
        },
      },
    });

    // @ts-ignore
    const response3 = await testAgent.resource('repairs').list({
      filter: {
        company: {
          id: {
            $isVar: 'currentUser.company.id',
          },
        },
      },
    });

    const acl = app.acl;
    const canResult = acl.can({ role: 'test-role', resource: 'repairs', action: 'list' });
    const params = canResult['params'];

    expect(params['fields']).toHaveLength(3);
  });

  it('should not have permission to list comments', async () => {
    await db.getCollection('collections').repository.create({
      values: {
        name: 'comments',
        fields: [
          {
            name: 'content',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'comments',
            type: 'hasMany',
            target: 'comments',
            interface: 'linkTo',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
      },
    });

    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            fields: ['comments'],
          },
        ],
      },
    });

    const acl = app.acl;

    expect(
      acl.can({
        role: 'test-role',
        resource: 'posts.comments',
        action: 'list',
      }),
    ).not.toBeNull();

    expect(
      acl.can({
        role: 'test-role',
        resource: 'comments',
        action: 'list',
      }),
    ).toBeNull();
  });

  it('should not destroy default roles when user is root user', async () => {
    const rootUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
    });
    const userPlugin = app.getPlugin('users') as UsersPlugin;

    const adminAgent = app.agent().login(rootUser);

    expect(await db.getCollection('roles').repository.count()).toBe(3);

    //@ts-ignore
    await adminAgent.resource('roles').destroy({
      filterByTk: 'root',
    });

    expect(await db.getCollection('roles').repository.count()).toBe(3);
  });

  it('should not destroy default roles', async () => {
    expect(await db.getCollection('roles').repository.count()).toBe(3);

    await adminAgent.resource('roles').destroy({
      filterByTk: 'root',
    });

    expect(await db.getCollection('roles').repository.count()).toBe(3);
  });

  it('should not destroy all scope', async () => {
    let allScope = await adminAgent.resource('rolesResourcesScopes').get({
      filter: {
        key: 'all',
      },
    });

    expect(allScope.body.data).toBeDefined();

    await adminAgent.resource('rolesResourcesScopes').destroy({
      filter: {
        key: 'all',
      },
    });

    allScope = await adminAgent.resource('rolesResourcesScopes').get({
      filter: {
        key: 'all',
      },
    });

    expect(allScope.body.data).toBeDefined();
  });

  it('should not destroy roles collections', async () => {
    let rolesCollection = await adminAgent.resource('collections').get({
      filterByTk: 'roles',
    });

    expect(rolesCollection.body.data).toBeDefined();

    await adminAgent.resource('collections').destroy({
      filterByTk: 'roles',
    });

    rolesCollection = await adminAgent.resource('collections').get({
      filterByTk: 'roles',
    });

    expect(rolesCollection.body.data).toBeDefined();
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

  it('should not append createdAt field when collection has no createdAt field', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'new',
        strategy: {
          actions: ['list'],
        },
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'c1',
        autoGenId: false,
        fields: [
          { name: 'name', type: 'string', primaryKey: true },
          { name: 'title', type: 'string' },
        ],
        timestamps: false,
      },
      context: {},
    });

    await adminAgent.resource('roles.resources', 'new').create({
      values: {
        name: 'c1',
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
        resource: 'c1',
        action: 'view',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'c1',
      action: 'view',
      params: {
        fields: ['title', 'name'],
      },
    });
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
      context: {},
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
    } = await adminAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'c1',
        name: 'published',
        scope: {
          published: true,
        },
      },
    });

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
      filter: {
        name: collectionName,
        dataSourceKey: 'main',
      },
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

    const existsResource = await db.getRepository('dataSourcesRolesResources').findOne({
      filter: {
        name: 'posts',
        roleName: 'new',
        dataSourceKey: 'main',
      },
    });

    await adminAgent.resource('roles.resources', 'new').update({
      filterByTk: existsResource.get('id'),
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
      filterByTk: existsResource.get('id'),
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
        snippets: ['pm.*'],
      },
    });
    const UserRepo = db.getCollection('users').repository;
    const user = await UserRepo.create({
      values: {
        roles: ['new'],
      },
    });

    const userAgent = app.agent().login(user);

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

  it.skip('should sync data to acl after app reload', async () => {
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

    expect(app.acl.getRole('new')).toBeUndefined();

    await app.reload();

    expect(app.acl.getRole('new')).toBeDefined();

    expect(
      app.acl.can({
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

  it('should destroy new role when user are root user', async () => {
    const rootUser = await db.getRepository('users').findOne({
      filterByTk: 1,
    });

    const rootAgent = app.agent().login(rootUser);

    const response = await rootAgent
      // @ts-ignore
      .resource('roles')
      .create({
        values: {
          name: 'testRole',
        },
      });

    expect(response.statusCode).toEqual(200);

    expect(await db.getRepository('roles').findOne({ filterByTk: 'testRole' })).toBeDefined();
    const destroyResponse = await rootAgent
      // @ts-ignore
      .resource('roles')
      .destroy({
        filterByTk: 'testRole',
      });

    expect(destroyResponse.statusCode).toEqual(200);
    expect(await db.getRepository('roles').findOne({ filterByTk: 'testRole' })).toBeNull();
  });
});

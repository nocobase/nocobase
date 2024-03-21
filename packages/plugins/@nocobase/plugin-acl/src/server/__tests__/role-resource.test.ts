import { Database, Model } from '@nocobase/database';
import { CollectionRepository } from '@nocobase/plugin-collection-manager';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('role resource api', () => {
  let app: MockServer;
  let db: Database;
  let role: Model;
  let admin;
  let adminAgent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    const UserRepo = db.getCollection('users').repository;
    admin = await UserRepo.create({
      values: {
        roles: ['admin'],
      },
    });

    const userPlugin = app.getPlugin('users') as UsersPlugin;
    adminAgent = app.agent().login(admin);
  });

  it('should grant resource by createRepository', async () => {
    const collectionManager = db.getRepository('collections') as CollectionRepository;
    await collectionManager.create({
      values: {
        name: 'c1',
        title: 'table1',
      },
      context: {},
    });

    await collectionManager.create({
      values: {
        name: 'c2',
        title: 'table2',
      },
      context: {},
    });

    await db.getRepository('roles').create({
      values: {
        name: 'testRole',
        resources: [
          {
            name: 'c1',
            actions: [
              {
                name: 'create',
              },
            ],
          },
        ],
      },
    });

    const acl = app.acl;
    const testRole = acl.getRole('testRole');
    const resource = testRole.getResource('c1');
    expect(resource).toBeDefined();
  });

  it('should grant resource action', async () => {
    const collectionManager = db.getRepository('collections') as CollectionRepository;

    await collectionManager.create({
      values: {
        name: 'c1',
        title: 'table1',
      },
      context: {},
    });

    await collectionManager.create({
      values: {
        name: 'c2',
        title: 'table2',
      },
      context: {},
    });

    // get collections list
    let response = await adminAgent.resource('roles.collections', 'admin').list({
      filter: {
        $or: [{ name: 'c1' }, { name: 'c2' }],
      },
      sort: ['sort'],
    });

    expect(response.statusCode).toEqual(200);

    expect(response.body.data).toMatchObject([
      {
        name: 'c1',
        title: 'table1',
        usingConfig: 'strategy',
        exists: false,
      },
      {
        name: 'c2',
        title: 'table2',
        usingConfig: 'strategy',
        exists: false,
      },
    ]);

    // set resource actions
    response = await adminAgent.resource('roles.resources', 'admin').create({
      values: {
        name: 'c1',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
          },
        ],
      },
    });

    expect(response.statusCode).toEqual(200);

    // get collections list
    response = await adminAgent.resource('roles.dataSourcesCollections').list({
      associatedIndex: role.get('name') as string,
      filter: {
        dataSourceKey: 'main',
        name: 'c1',
      },
    });

    expect(response.body.data[0]['usingConfig']).toEqual('resourceAction');

    response = await adminAgent.resource('roles.resources').list({
      associatedIndex: role.get('name') as string,
      appends: 'actions',
    });

    expect(response.statusCode).toEqual(200);
    const resources = response.body.data;
    const resourceAction = resources[0]['actions'][0];

    expect(resourceAction['name']).toEqual('create');

    // update resource actions
    response = await adminAgent.resource('roles.resources').update({
      associatedIndex: role.get('name') as string,
      values: {
        name: 'c1',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
          },
        ],
      },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.body.data[0]['actions'].length).toEqual(1);
    expect(response.body.data[0]['actions'][0]['name']).toEqual('view');
  });
});

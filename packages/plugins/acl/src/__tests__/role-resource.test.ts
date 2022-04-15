import { Database, Model } from '@nocobase/database';
import { CollectionRepository } from '@nocobase/plugin-collection-manager';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('role resource api', () => {
  let app: MockServer;
  let db: Database;
  let role: Model;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });

    role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });
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
    let response = await app
      .agent()
      .resource('roles.collections', 'admin')
      .list({
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
    response = await app
      .agent()
      .resource('roles.resources', 'admin')
      .create({
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
    response = await app
      .agent()
      .resource('roles.collections')
      .list({
        associatedIndex: role.get('name') as string,
        filter: {
          name: 'c1',
        },
      });

    expect(response.body.data[0]['usingConfig']).toEqual('resourceAction');

    response = await app
      .agent()
      .resource('roles.resources')
      .list({
        associatedIndex: role.get('name') as string,
        appends: 'actions',
      });

    expect(response.statusCode).toEqual(200);
    const resources = response.body.data;
    const resourceAction = resources[0]['actions'][0];

    expect(resourceAction['name']).toEqual('create');

    // update resource actions
    response = await app
      .agent()
      .resource('roles.resources')
      .update({
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

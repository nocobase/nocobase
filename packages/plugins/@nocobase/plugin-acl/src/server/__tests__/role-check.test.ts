import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';
import { CollectionRepository } from '@nocobase/plugin-collection-manager';

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

    await role.createMenuUiSchema({
      values: {
        name: 'test',
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test'],
      },
    });

    const agent = app.agent().login(user);

    // @ts-ignore
    const response = await agent.resource('roles').check();

    expect(response.statusCode).toEqual(200);
  });

  it('should return updated roles info', async () => {
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
        name: 'test',
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

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test'],
      },
    });

    const agent: any = app.agent().login(user);

    const checkResp1 = await agent.resource('roles').check();
    const actions = checkResp1.body.data.actions;
    expect(actions['c1:create']).toBeDefined();

    // update role
    await db.getRepository('roles').update({
      filter: {
        name: 'test',
      },
      values: {
        resources: [
          {
            name: 'c1',
            actions: [
              {
                name: 'create',
              },
              {
                name: 'update',
              },
            ],
          },
        ],
      },
    });

    const checkResp2 = await agent.resource('roles').check();
    const actions2 = checkResp2.body.data.actions;
    expect(actions2['c1:create']).toBeDefined();
    expect(actions2['c1:update']).toBeDefined();
  });
});

import { MockServer } from '@nocobase/test';
import { CollectionRepository } from '@nocobase/plugin-collection-manager';
import { Database, Model } from '@nocobase/database';

import { prepareApp } from './prepare';

describe('role api', () => {
  let app: MockServer;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
  });

  it('should create role', async () => {
    const response = await app
      .agent()
      .resource('roles')
      .create({
        values: {
          name: 'admin',
          description: 'Admin user',
        },
      });

    expect(response.statusCode).toEqual(200);

    const role = await db.getRepository('roles').findOne();
    expect(role.get('name')).toEqual('admin');
  });

  it('should list actions', async () => {
    const response = await app.agent().resource('availableActions').list();
    expect(response.statusCode).toEqual(200);
  });

  describe('grant', () => {
    let role: Model;

    beforeEach(async () => {
      await app
        .agent()
        .resource('roles')
        .create({
          values: {
            name: 'admin',
            title: 'Admin User',
          },
        });

      role = await db.getRepository('roles').findOne({
        filter: {
          name: 'admin',
        },
      });
    });

    it('should grant universal role actions', async () => {
      // grant role actions
      const response = await app
        .agent()
        .resource('roles')
        .update({
          values: {
            strategy: {
              actions: ['create:all', 'view:own'],
            },
          },
        });

      expect(response.statusCode).toEqual(200);

      await role.reload();

      expect(role.get('strategy')).toMatchObject({
        actions: ['create:all', 'view:own'],
      });
    });
  });
});

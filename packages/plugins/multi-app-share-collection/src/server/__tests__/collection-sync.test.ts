import { BelongsToManyRepository, Database } from '@nocobase/database';
import { AppSupervisor } from '@nocobase/server';
import { MockServer, mockServer, pgOnly } from '@nocobase/test';
import * as process from 'process';

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

pgOnly()('enable plugin', () => {
  let mainDb: Database;
  let mainApp: MockServer;

  beforeEach(async () => {
    const app = mockServer({
      acl: false,
      plugins: ['nocobase'],
    });

    await app.load();

    await app.install({
      clean: true,
    });

    mainApp = app;

    mainDb = mainApp.db;
  });

  afterEach(async () => {
    await mainApp.destroy();
  });

  it('should throw error when enable plugin, when multi-app plugin is not enabled', async () => {
    let error;
    try {
      await mainApp.pm.enable('multi-app-share-collection');
    } catch (e) {
      error = e;
    }

    expect(error.message).toBe('multi-app-share-collection plugin need multi-app-manager plugin enabled');
  });
});

pgOnly()('collection sync', () => {
  let mainDb: Database;
  let mainApp: MockServer;

  beforeEach(async () => {
    const app = mockServer({
      acl: false,
      plugins: ['nocobase'],
    });

    await app.load();

    await app.db.sequelize.query(`DROP SCHEMA IF EXISTS sub1 CASCADE`);
    await app.db.sequelize.query(`DROP SCHEMA IF EXISTS sub2 CASCADE`);
    await app.install({
      clean: true,
    });

    await app.pm.enable('multi-app-manager');
    await app.pm.enable('multi-app-share-collection');

    await app.start();

    mainApp = app;

    mainDb = mainApp.db;
  });

  afterEach(async () => {
    await mainApp.destroy();
  });

  describe('plugins', () => {
    it('should sync plugin status between apps', async () => {
      await mainApp.db.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      const sub1 = await AppSupervisor.getInstance().getApp('sub1');

      const getSubAppMapRecord = async (app) => {
        return await app.db.getRepository('applicationPlugins').findOne({
          filter: {
            name: 'map',
          },
        });
      };

      expect((await getSubAppMapRecord(sub1)).get('enabled')).toBeFalsy();
      await mainApp.pm.enable('map');
      expect((await getSubAppMapRecord(sub1)).get('enabled')).toBeTruthy();

      // create new app sub2
      await mainApp.db.getRepository('applications').create({
        values: {
          name: 'sub2',
        },
      });

      const sub2 = await AppSupervisor.getInstance().getApp('sub2');
      expect((await getSubAppMapRecord(sub2)).get('enabled')).toBeTruthy();
      expect(sub2.pm.plugins.get('map').options.enabled).toBeTruthy();
    });
  });

  describe('lazy load', () => {
    it('should in sub app schema when sub app lazy load', async () => {
      await mainApp.db.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      await AppSupervisor.getInstance().removeApp('sub1');

      const sub1 = await AppSupervisor.getInstance().getApp('sub1');

      expect(sub1.db.options.schema).toBe('sub1');
    });

    it('should sync plugin status into lazy load sub app', async () => {
      await mainApp.db.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      await AppSupervisor.getInstance().removeApp('sub1');

      await mainApp.pm.enable('map');

      const sub1 = await AppSupervisor.getInstance().getApp('sub1');

      expect(sub1.pm.plugins.get('map').options.enabled).toBeTruthy();

      const sub1MapPlugin = await sub1.db.getRepository('applicationPlugins').findOne({
        filter: {
          name: 'map',
        },
      });

      expect(sub1MapPlugin.get('enabled')).toBeTruthy();

      console.log('test finished');
    });
  });

  describe('share collection', () => {
    it('should sync collections in sub apps', async () => {
      const subApp1Record = await mainDb.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      const subApp1 = await AppSupervisor.getInstance().getApp(subApp1Record.name);

      const mainCollection = await mainDb.getRepository('collections').create({
        values: {
          name: 'mainCollection',
          fields: [
            {
              name: 'field0',
              type: 'string',
            },
          ],
        },
        context: {},
      });

      await sleep(100);

      const subAppMainCollectionRecord = await subApp1.db.getRepository('collections').findOne({
        filter: {
          name: 'mainCollection',
        },
      });

      expect(subAppMainCollectionRecord).toBeTruthy();

      const subAppMainCollection = subApp1.db.getCollection('mainCollection');

      expect(subAppMainCollection).toBeTruthy();
      expect(subAppMainCollection.options.schema).toBe(mainCollection.options.schema || 'public');

      await mainApp.db.getRepository('fields').create({
        values: {
          collectionName: 'mainCollection',
          name: 'title',
          type: 'string',
          uiSchema: {
            type: 'string',
            'x-component': 'Input',
            title: 'field1',
          },
        },
        context: {},
      });

      const mainCollectionTitleField = await subApp1.db.getRepository('fields').findOne({
        filter: {
          collectionName: 'mainCollection',
          name: 'title',
        },
      });

      expect(mainCollectionTitleField).toBeTruthy();

      await mainApp.db.getRepository('mainCollection').create({
        values: {
          title: 'test',
        },
      });

      const subRecord = await subApp1.db.getRepository('mainCollection').findOne({});
      expect(subRecord.get('title')).toBe('test');

      await mainApp.db.getRepository('fields').update({
        values: {
          unique: true,
        },
        filter: {
          collectionName: 'mainCollection',
          name: 'title',
        },
      });

      const mainCollectionTitleField2 = await subApp1.db.getRepository('fields').findOne({
        filter: {
          collectionName: 'mainCollection',
          name: 'title',
        },
      });

      expect(mainCollectionTitleField2.get('unique')).toBe(true);

      expect(subAppMainCollection.getField('title')).toBeTruthy();

      await mainApp.db.getRepository('fields').destroy({
        filter: {
          collectionName: 'mainCollection',
          name: 'title',
        },
      });

      expect(
        await subApp1.db.getRepository('fields').findOne({
          filter: {
            collectionName: 'mainCollection',
            name: 'title',
          },
        }),
      ).toBeFalsy();

      expect(subAppMainCollection.getField('title')).toBeFalsy();

      await mainApp.db.getRepository('collections').destroy({
        filter: {
          name: 'mainCollection',
        },
      });

      expect(
        await subApp1.db.getRepository('collections').findOne({
          filter: {
            name: 'mainCollection',
          },
        }),
      ).toBeFalsy();

      expect(subApp1.db.getCollection('mainCollection')).toBeFalsy();
    });

    it('should sync custom collections', async () => {
      const subApp1Record = await mainDb.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      const subApp1 = await AppSupervisor.getInstance().getApp(subApp1Record.name);

      await mainApp.db.getRepository('collections').create({
        values: {
          name: 'posts',
          fields: [{ type: 'string', title: 'title' }],
        },
        context: {},
      });

      await sleep(100);

      const postCollection = subApp1.db.getCollection('posts');

      expect(postCollection.options.schema).toBe(
        process.env.COLLECTION_MANAGER_SCHEMA || mainDb.options.schema || 'public',
      );
    });

    it('should set collection black list', async () => {
      await mainApp.db.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      await mainApp.db.getRepository('collections').create({
        values: {
          name: 'testCollection',
          fields: [
            {
              name: 'testField',
              type: 'string',
            },
          ],
        },
      });

      const BlackListRepository = await mainApp.db
        .getCollection('applications')
        .repository.relation<BelongsToManyRepository>('collectionBlacklist')
        .of('sub1');

      const blackList = await BlackListRepository.find();

      expect(blackList.length).toBe(0);

      await BlackListRepository.toggle('testCollection');
      const blackList1 = await BlackListRepository.find();

      expect(blackList1.length).toBe(1);
    });

    it('should sync user collections', async () => {
      const subApp1Record = await mainDb.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      const subApp1 = await AppSupervisor.getInstance().getApp(subApp1Record.name);

      expect(subApp1.db.getCollection('users').options.schema).toBe(mainDb.options.schema || 'public');

      const userCollectionRecord = await subApp1.db.getRepository('collections').findOne({
        filter: {
          name: 'users',
        },
      });
      expect(userCollectionRecord).toBeTruthy();
      await mainApp.db.getRepository('users').create({
        values: {
          email: 'test@qq.com',
          password: '123456',
        },
      });
      const user = await subApp1.db.getRepository('users').find({
        filter: {
          email: 'test@qq.com',
        },
      });
      expect(user).toBeTruthy();
    });
  });

  describe('role & user', () => {
    it('should set user role in sub app when user created at main app', async () => {
      await mainApp.db.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      const sub1 = await AppSupervisor.getInstance().getApp('sub1');

      await mainApp.db.getRepository('users').create({
        values: {
          email: 'test@qq.com',
          password: 'test123',
        },
      });

      // wait for sub app to set default role
      await sleep(100);

      const defaultRole = await sub1.db.getRepository('roles').findOne({
        filter: {
          default: true,
        },
      });

      const user = await sub1.db.getRepository('users').findOne({
        filter: {
          email: 'test@qq.com',
        },
        appends: ['roles'],
      });

      expect(user.get('roles').map((item) => item.name)).toEqual([defaultRole.name]);

      await mainApp.db.getRepository('applications').create({
        values: {
          name: 'sub2',
        },
      });

      const sub2 = await AppSupervisor.getInstance().getApp('sub2');

      const defaultRoleInSub2 = await sub2.db.getRepository('roles').findOne({
        filter: {
          default: true,
        },
      });

      const userInSub2 = await sub2.db.getRepository('users').findOne({
        filter: {
          email: 'test@qq.com',
        },
        appends: ['roles'],
      });

      expect(userInSub2.get('roles').map((item) => item.name)).toContain(defaultRoleInSub2.name);
    });
    it('should not sync roles in sub app', async () => {
      await mainDb.getRepository('applications').create({
        values: {
          name: 'sub1',
        },
      });

      const subApp1 = await AppSupervisor.getInstance().getApp('sub1');

      await mainDb.getRepository('roles').create({
        values: {
          name: 'role1',
        },
      });

      expect(
        await subApp1.db.getRepository('roles').findOne({
          filter: {
            name: 'role1',
          },
        }),
      ).toBeFalsy();
    });
  });
});

import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import Plugin from '..';
const pgOnly = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);

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

  it('should sync to apps with relations', async () => {
    await mainApp.db.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    await mainApp.db.getRepository('collections').create({
      values: {
        name: 'parent',
        fields: [
          {
            type: 'string',
            name: 'parent-field',
          },
        ],
      },
      context: {},
    });

    await mainApp.db.getRepository('collections').create({
      values: {
        name: 'posts',
        inherits: ['parent'],
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
      context: {},
    });

    await mainApp.db.getRepository('collections').create({
      values: {
        name: 'tags',
        fields: [{ type: 'string', name: 'name' }],
      },
      context: {},
    });

    await mainApp.db.getRepository('fields').create({
      values: {
        name: 'posts',
        type: 'belongsToMany',
        collectionName: 'tags',
        target: 'posts',
        through: 'posts_tags',
      },
      context: {},
    });

    const tagsCollection = await mainApp.db.getRepository('collections').findOne({
      filter: {
        name: 'tags',
      },
    });

    await tagsCollection.set('syncToApps', ['sub1']);

    await tagsCollection.save();

    const postsCollection = await mainApp.db.getRepository('collections').findOne({
      filter: {
        name: 'posts',
      },
    });

    const parentCollection = await mainApp.db.getRepository('collections').findOne({
      filter: {
        name: 'parent',
      },
    });

    expect(postsCollection.get('syncToApps')).toContain('sub1');
    expect(parentCollection.get('syncToApps')).toContain('sub1');
  });

  it('should set user role in sub app when user created at main app', async () => {
    await mainApp.db.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    const sub1 = await mainApp.appManager.getApplication('sub1');

    await mainApp.db.getRepository('users').create({
      values: {
        email: 'test@qq.com',
        password: 'test123',
      },
    });

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

    const sub2 = await mainApp.appManager.getApplication('sub2');

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

  it.skip('should sync plugin status between apps', async () => {
    await mainApp.db.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    const sub1 = await mainApp.appManager.getApplication('sub1');

    const getSub1MapRecord = async (app) => {
      return await app.db.getRepository('applicationPlugins').findOne({
        filter: {
          name: 'map',
        },
      });
    };

    expect((await getSub1MapRecord(sub1)).get('enabled')).toBeFalsy();
    await mainApp.pm.enable('map');

    expect((await getSub1MapRecord(sub1)).get('enabled')).toBeTruthy();

    await mainApp.db.getRepository('applications').create({
      values: {
        name: 'sub2',
      },
    });

    const sub2 = await mainApp.appManager.getApplication('sub2');
    expect((await getSub1MapRecord(sub2)).get('enabled')).toBeTruthy();
  });

  it('should not sync roles in sub app', async () => {
    await mainDb.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    const subApp1 = await mainApp.appManager.getApplication('sub1');

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

  it('should sync user collections', async () => {
    const subApp1Record = await mainDb.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    const subApp1 = await mainApp.appManager.getApplication(subApp1Record.name);

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

  it('should support syncToApps with wildcard value', async () => {
    const subApp1Record = await mainDb.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });
    const subApp1 = await mainApp.appManager.getApplication(subApp1Record.name);

    const subApp2Record = await mainDb.getRepository('applications').create({
      values: {
        name: 'sub2',
      },
    });
    const subApp2 = await mainApp.appManager.getApplication(subApp2Record.name);

    const mainCollection = await mainDb.getRepository('collections').create({
      values: {
        name: 'mainCollection',
        syncToApps: '*',
      },
      context: {},
    });

    const subApp1MainCollectionRecord = await subApp1.db.getRepository('collections').findOne({
      filter: {
        name: 'mainCollection',
      },
    });

    expect(subApp1MainCollectionRecord).toBeTruthy();

    const subApp2MainCollectionRecord = await subApp2.db.getRepository('collections').findOne({
      filter: {
        name: 'mainCollection',
      },
    });

    expect(subApp2MainCollectionRecord).toBeTruthy();
  });

  it('should sync collections in sub apps', async () => {
    const subApp1Record = await mainDb.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    const subApp1 = await mainApp.appManager.getApplication(subApp1Record.name);

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

  it('should update syncToApp options', async () => {
    await mainApp.db.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    const sub1 = await mainApp.appManager.getApplication('sub1');

    await mainApp.db.getRepository('collections').create({
      values: {
        name: 'testCollection',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
      context: {},
    });

    const sub1CollectionsRecord = await sub1.db.getRepository('collections').findOne({
      filter: {
        name: 'testCollection',
      },
    });

    expect(sub1CollectionsRecord).toBeTruthy();

    const mainTestCollection = await mainDb.getCollection('testCollection');
    const sub1TestCollection = await sub1.db.getCollection('testCollection');
    expect(sub1TestCollection.collectionSchema()).toEqual(mainTestCollection.collectionSchema());
  });
});

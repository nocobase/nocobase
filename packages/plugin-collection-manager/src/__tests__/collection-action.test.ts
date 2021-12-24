import { MockServer, mockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginCollectionManager from '../server';
import { mockUiSchema } from './mockUiSchema';

describe('collection resource', () => {
  let app: MockServer;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {},
    });
    db = app.db;

    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.dropAllTables();

    await mockUiSchema(db);

    app.plugin(PluginCollectionManager);

    await app.load();
  });

  describe('create action', () => {
    test('create collection', async () => {
      const response = await app
        .agent()
        .resource('collections')
        .create({
          values: {
            name: 'tests',
          },
        });

      expect(response.statusCode).toEqual(200);
      const metaCollection = db.getCollection('collections');

      const testCollectionModel = await metaCollection.repository.findOne({
        filter: {
          name: 'tests',
        },
      });

      expect(testCollectionModel).toBeDefined();
      expect(testCollectionModel.get('key')).toBeDefined();
      expect(testCollectionModel.get('name')).toEqual('tests');

      expect(db.getCollection('tests')).toBeDefined();
    });

    test('create collection without name', async () => {
      const response = await app.agent().resource('collections').create({
        values: {},
      });

      expect(response.statusCode).toEqual(200);
      const metaCollection = db.getCollection('collections');

      const testCollectionModel = await metaCollection.repository.findOne();
      expect(testCollectionModel).toBeDefined();
      expect(testCollectionModel.get('name')).toBeDefined();
      expect(testCollectionModel.get('name')).toEqual(testCollectionModel.get('key'));
    });

    test('create collection with sort field', async () => {
      const response = await app
        .agent()
        .resource('collections')
        .create({
          values: {
            name: 'tests',
            sortable: true,
          },
        });

      expect(response.statusCode).toEqual(200);

      const testCollectionModel = await db.getCollection('collections').repository.findOne({
        filter: {
          name: 'tests',
        },
      });

      const fieldCollection = db.getCollection('fields');
      const sortField = await fieldCollection.repository.findOne();
      expect(sortField).toBeDefined();
      expect(sortField.get('type')).toEqual('sort');
    });

    test('create collection with fields', async () => {
      await app
        .agent()
        .resource('collections')
        .create({
          values: {
            name: 'users',
          },
        });

      const userCollectionModel = await db.getCollection('collections').repository.findOne({
        filter: {
          name: 'users',
        },
      });

      expect(userCollectionModel).toBeDefined();

      const response = await app
        .agent()
        .resource('collections.fields')
        .create({
          associatedIndex: 'users',
          values: {
            name: 'name',
            type: 'string',
          },
        });

      expect(response.statusCode).toEqual(200);

      // @ts-ignore
      const fields = await userCollectionModel.getFields();
      expect(fields[0]).toBeDefined();
      expect(fields[0].get('name')).toEqual('name');
      expect(fields[0].get('type')).toEqual('string');

      const collections = db.getCollection('users');
      expect(collections.getField('name')).toBeDefined();
    });

    test('create collection with subTable field', async () => {
      await app
        .agent()
        .resource('collections')
        .create({
          values: { name: 'orders' },
        });

      const response = await app
        .agent()
        .resource('collections.fields')
        .create({
          associatedIndex: 'orders',
          values: {
            interface: 'subTable',
            type: 'hasMany',
            uiSchema: {
              type: 'array',
              title: '这是一个子表格字段',
              'x-decorator': 'FormItem',
              'x-component': 'Table',
              'x-component-props': {},
            },
            children: [
              {
                interface: 'input',
                type: 'string',
                uiSchema: {
                  type: 'string',
                  title: '这是一个单行文本字段',
                  'x-component': 'Input',
                  'x-decorator': 'FormItem',
                },
              },
            ],
          },
        });

      expect(response.statusCode).toEqual(200);
    });

    test('create collection with belongsToMany field', async () => {
      await app
        .agent()
        .resource('collections')
        .create({
          values: { name: 'posts' },
        });

      expect(db.getCollection('posts')).toBeDefined();
      await app
        .agent()
        .resource('collections')
        .create({
          values: { name: 'tags' },
        });

      expect(db.getCollection('tags')).toBeDefined();

      const postCollectionModel = await db.getCollection('collections').repository.findOne({
        filter: {
          name: 'posts',
        },
      });

      await app
        .agent()
        .resource('collections.fields')
        .create({
          associatedIndex: 'posts',
          values: {
            interface: 'linkTo',
            name: 'tags',
            type: 'belongsToMany',
            target: 'tags',
            uiSchema: {
              type: 'array',
              title: '这是一个关联字段',
              'x-component': 'RecordPicker',
              'x-component-props': {},
              'x-decorator': 'FormItem',
            },
          },
        });

      const fieldCollection = db.getCollection('fields');
      const belongsToManyField = await fieldCollection.repository.findOne({
        filter: {
          type: 'belongsToMany',
        },
      });

      // field model exists
      expect(belongsToManyField).toBeDefined();

      // field exists in collection
      const postsCollection = db.getCollection('posts');
      const tagsAssociation = postsCollection.getField('tags');
      expect(tagsAssociation).toBeDefined();

      // @ts-ignore
      await db.getCollection('collections').repository.load();

      // reverse association exists
      const reverseKey = (
        await db.getCollection('fields').repository.findOne({
          filter: {
            name: 'tags',
          },
        })
      ).get('reverseKey');

      const reverseField = await db.getCollection('fields').repository.findOne({
        filter: {
          name: reverseKey,
        },
      });

      const tagCollection = db.getCollection('tags');
      const postAssociation = tagCollection.getField(reverseField.get('name') as string);
      expect(postAssociation).toBeDefined();
    });

    test('delete collection', async () => {});
  });

  describe('get action', () => {
    test('get collection', async () => {
      await app
        .agent()
        .resource('collections')
        .create({
          values: {
            name: 'tests',
          },
        });

      const response = await app.agent().resource('collections').get({
        resourceIndex: 'tests',
      });

      expect(response.statusCode).toEqual(200);
      expect(response.body.data.name).toEqual('tests');
    });

    test('get collection fields', async () => {
      await app
        .agent()
        .resource('collections')
        .create({
          values: {
            name: 'users',
            fields: [
              {
                type: 'string',
                name: 'name',
              },
            ],
          },
        });

      let response = await app.agent().resource('collections.fields').list({
        associatedIndex: 'users',
      });

      expect(response.statusCode).toEqual(200);
      expect(response.body.meta.count).toEqual(1);

      response = await app.agent().resource('collections.fields').get({
        associatedIndex: 'users',
        resourceIndex: 'name',
      });

      expect(response.statusCode).toEqual(200);
    });
  });

  describe('delete action', () => {
    test('delete field', async () => {
      await app
        .agent()
        .resource('collections')
        .create({
          values: {
            name: 'users',
            fields: [
              {
                type: 'integer',
                name: 'age',
              },
            ],
          },
        });

      // delete age field
      let response = await app.agent().resource('collections.fields').destroy({
        associatedIndex: 'users',
        resourceIndex: 'age',
      });

      expect(response.statusCode).toEqual(200);

      const userCollection = db.getCollection('users');
      expect(userCollection.getField('age')).not.toBeDefined();
    });
  });
});

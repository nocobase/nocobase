import { Application, CollectionOptions, DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client';
import collections from '../collections.json';

function getCollection(collection: CollectionOptions) {
  const app = new Application({
    dataSourceManager: {
      collections: [collection],
    },
  });

  return app.getCollectionManager().getCollection(collection.name);
}

describe('Collection', () => {
  describe('getPrimaryKey()', () => {
    test('Return `targetKey` if targetKey property exists', () => {
      const collection = getCollection({ name: 'test', targetKey: 'a' });
      expect(collection.getPrimaryKey()).toBe('a');
    });

    test('If targetKey does not exist, return the name of the field with `primaryKey` set to true in the fields', () => {
      const collection = getCollection({
        name: 'test',
        fields: [{ name: 'a', primaryKey: true }, { name: 'b' }],
      });
      expect(collection.getPrimaryKey()).toBe('a');
    });

    test('cache the result', () => {
      const collection = getCollection({ name: 'test', fields: [{ name: 'a', primaryKey: true }] });
      const spy = vitest.spyOn(collection, 'getFields');
      collection.getPrimaryKey();
      collection.getPrimaryKey();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('titleField', () => {
    test('return `titleField` if it exists', () => {
      const collection = getCollection({ name: 'test', titleField: 'a', fields: [{ name: 'a' }] });
      expect(collection.titleField).toBe('a');
    });

    test('if `titleField` does not exist in fields, return `primaryKey`', () => {
      const collection = getCollection({ name: 'test', titleField: 'a', targetKey: 'b' });
      expect(collection.titleField).toBe('b');
    });

    test('if `titleField` does not exist, return `primaryKey`', () => {
      const collection = getCollection({ name: 'test', targetKey: 'a' });
      expect(collection.titleField).toBe('a');
    });
  });

  describe('options', () => {
    test('getOptions()', () => {
      const collection = getCollection({ name: 'test', titleField: 'a', targetKey: 'b' });
      expect(collection.getOptions()).toMatchObject({
        name: 'test',
        titleField: 'a',
        targetKey: 'b',
        dataSource: DEFAULT_DATA_SOURCE_KEY,
      });
    });

    test('getOption()', () => {
      const collection = getCollection({ name: 'test', key: 'a', model: 'b' });
      expect(collection.getOption('name')).toBe('test');
      expect(collection.getOption('key')).toBe('a');
      expect(collection.getOption('model')).toBe('b');
      expect(collection.getOption('dataSource')).toBe(DEFAULT_DATA_SOURCE_KEY);
    });
  });

  test('dataSource', () => {
    const app = new Application({
      dataSourceManager: {
        dataSources: [
          {
            key: 'a',
            displayName: 'a',
            collections: [{ name: 'user' }],
          },
        ],
      },
    });

    const user = app.getCollectionManager('a').getCollection('user');
    expect(user.dataSource).toBe('a');
  });

  describe('getFields()', () => {
    test('return fields', () => {
      const collection = getCollection({ name: 'test', fields: [{ name: 'a' }, { name: 'b' }] });
      expect(collection.getFields()).toMatchObject([{ name: 'a' }, { name: 'b' }]);
    });

    test('support predicate', () => {
      const collection = getCollection({
        name: 'test',
        fields: [
          { name: 'a', primaryKey: false },
          { name: 'b', primaryKey: true },
        ],
      });

      // { key: value }
      const res1 = collection.getFields({ name: 'a' });
      expect(res1.length).toBe(1);
      expect(res1[0].name).toBe('a');

      // key === { key: true }
      const res2 = collection.getFields('primaryKey');
      expect(res2.length).toBe(1);
      expect(res2[0].name).toBe('b');

      const res3 = collection.getFields({ primaryKey: true });
      expect(res3.length).toBe(1);
      expect(res3[0].name).toBe('b');

      // function
      const res4 = collection.getFields((field) => field.name === 'a');
      expect(res4.length).toBe(1);
      expect(res4[0].name).toBe('a');
    });
  });

  describe('getField()', () => {
    test('return field', () => {
      const collection = getCollection({ name: 'test', fields: [{ name: 'a' }, { name: 'b' }] });
      expect(collection.getField('a')).toMatchObject({ name: 'a' });

      expect(collection.getField('test.a')).toMatchObject({ name: 'a' });
    });

    test('support dot notation', () => {
      const app = new Application({
        dataSourceManager: {
          collections: collections as any,
        },
      });

      const users = app.getCollectionManager().getCollection('users');
      expect(users.getField('roles.name')).toMatchObject({ name: 'name', collectionName: 'roles' });
    });

    test('return undefined if field does not exist', () => {
      const app = new Application({
        dataSourceManager: {
          collections: collections as any,
        },
      });

      const users = app.getCollectionManager().getCollection('users');

      expect(users.getField('no-exist')).toBeUndefined();
      expect(users.getField('no-exist.c')).toBeUndefined();
      expect(users.getField('id.no-exist')).toBeUndefined();
      expect(users.getField('roles.no-exist')).toBeUndefined();
    });
  });

  describe('hasField()', () => {
    test('return true if field exists', () => {
      const collection = getCollection({ name: 'test', fields: [{ name: 'a' }, { name: 'b' }] });
      expect(collection.hasField('a')).toBe(true);
    });

    test('return false if field does not exist', () => {
      const collection = getCollection({ name: 'test', fields: [{ name: 'a' }, { name: 'b' }] });
      expect(collection.hasField('c')).toBe(false);
    });
  });

  test('properties', () => {
    const app = new Application({
      dataSourceManager: {
        collections: collections as any,
      },
    });

    const users = app.getCollectionManager().getCollection('users');
    const usersOptions: any = collections.find((c) => c.name === 'users');

    expect(users.app).toBe(app);
    expect(users.template).toBe(usersOptions.template);
    expect(users.sourceKey).toBe(usersOptions.sourceKey);
    expect(users.name).toBe(usersOptions.name);
    expect(users.key).toBe(usersOptions.key);
    expect(users.title).toBe(usersOptions.title);
    expect(users.inherit).toBe(usersOptions.inherit);
    expect(users.hidden).toBe(usersOptions.hidden);
    expect(users.description).toBe(usersOptions.description);
    expect(users.duplicator).toBe(usersOptions.duplicator);
    expect(users.category).toBe(usersOptions.category);
    expect(users.targetKey).toBe(usersOptions.targetKey);
    expect(users.model).toBe(usersOptions.model);
    expect(users.createdBy).toBe(usersOptions.createdBy);
    expect(users.updatedBy).toBe(usersOptions.updatedBy);
    expect(users.logging).toBe(usersOptions.logging);
    expect(users.from).toBe(usersOptions.from);
    expect(users.rawTitle).toBe(usersOptions.rawTitle);
    expect(users.inherits).toMatchObject([]);
    expect(users.sources).toMatchObject([]);
    expect(users.fields).toMatchObject(usersOptions.fields);
    expect(users.tableName).toBe(usersOptions.tableName);
    expect(users.viewName).toBe(usersOptions.viewName);
    expect(users.writableView).toBe(usersOptions.writableView);
    expect(users.filterTargetKey).toBe(usersOptions.filterTargetKey);
    expect(users.sortable).toBe(usersOptions.sortable);
    expect(users.autoGenId).toBe(usersOptions.autoGenId);
    expect(users.magicAttribute).toBe(usersOptions.magicAttribute);
    expect(users.tree).toBe(usersOptions.tree);
    expect(users.isThrough).toBe(usersOptions.isThrough);
    expect(users.autoCreate).toBe(usersOptions.autoCreate);
    expect(users.resource).toBe(usersOptions.resource);
  });
});

import { mockDatabase, mockServer } from '@nocobase/test';
import { CollectionManager } from '../collection-manager';
import { Database } from '@nocobase/database';
import { CollectionModel } from '../collection-model';

describe('collection manager', () => {
  let server;

  beforeEach(async () => {
    server = mockServer({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    });
  });

  it('should import collection schema', async () => {
    const db = server.db;
    const collectionManager = new CollectionManager(db);
    await collectionManager.import();

    expect(db.getCollection('collections')).toBeDefined();
    expect(db.getCollection('fields')).toBeDefined();
  });

  describe('collection api', () => {
    let db: Database;
    let collectionManager: CollectionManager;

    beforeEach(async () => {
      db = server.db;
      collectionManager = new CollectionManager(db);
      await collectionManager.import();
    });

    test('create new collection', async () => {
      const collection = await collectionManager.createCollection({
        name: 'tests',
      });

      expect(db.getCollection('tests')).toBeUndefined();

      const collectionModel = new CollectionModel(collection, db);
      await collectionModel.load();

      const testCollection = db.getCollection('tests');
      expect(testCollection).toBeDefined();
    });

    test('create collection with fields', async () => {
      const collection = await collectionManager.createCollection({
        name: 'users',
      });

      const collectionModel = new CollectionModel(collection, db);

      await collectionModel.addField({
        type: 'string',
        name: 'name',
      });

      expect(await db.getCollection('fields').repository.count()).toEqual(1);

      await collectionModel.load();

      const testCollection = db.getCollection('users');
      expect(testCollection).toBeDefined();

      expect(testCollection.getField('name')).toBeDefined();
    });
  });
});

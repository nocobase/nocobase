import { MockServer, mockServer } from '@nocobase/test';
import { CollectionManager } from '../collection-manager';
import { Database } from '@nocobase/database';
import { mockUiSchema } from './mockUiSchema';
import PluginCollectionManager from '../server';
import { queryTable } from './helper';

describe('collection manager', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {
        logging: console.log,
      },
    });
    db = app.db;

    mockUiSchema(db);
    app.plugin(PluginCollectionManager);

    await app.load();
  });

  it('should import collection schema', async () => {
    expect(db.getCollection('collections')).toBeDefined();
    expect(db.getCollection('fields')).toBeDefined();
  });

  it('should migrate collection', async () => {
    const collectionModel = await CollectionManager.createCollection(
      {
        name: 'tests',
      },
      db,
    );

    expect(await db.getCollection('collections').repository.count()).toEqual(1);

    await collectionModel.load();
    const collection = db.getCollection('tests');
    expect(collection).toBeDefined();

    const model = collection.model;

    await expect(async () => {
      await queryTable(model, 'tests');
    }).rejects.toThrowError();

    await collectionModel.migrate();

    const tableFields = await queryTable(model, 'tests');
    expect(tableFields['id']).toBeDefined();
  });
});

import { MockServer, mockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginCollectionManager from '../server';
describe('collection resource', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {
        logging: console.log,
      },
    });

    app.plugin(PluginCollectionManager);
    await app.load();

    db = app.db;
  });

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

    // @ts-ignore
    const fields = await testCollectionModel.getFields();
    expect(fields[0]).toBeDefined();
    expect(fields[0].get('type')).toEqual('sort');
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

    const response = await app
      .agent()
      .resource('collections.fields')
      .create({
        associatedIndex: 'tests',
        values: {
          name: 'name',
          type: 'string',
        },
      });

    expect(response.statusCode).toEqual(200);
  });
});

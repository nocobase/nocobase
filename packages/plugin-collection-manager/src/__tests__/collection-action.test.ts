import { MockServer, mockServer } from '@nocobase/test';
import { collectionResource } from '../actions/collection';
import { Database } from '@nocobase/database';
import PluginCollectionManager from '../server';
describe('collection  resource', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({
      database: {
        logging: console.log,
      },
    });
    app.plugin(PluginCollectionManager);
    await app.load();
    db = app.db;

    app.resourcer.define(collectionResource);
  });

  test('create action', async () => {
    const response = await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'tests',
        },
      });

    expect(response.statusCode).toEqual(200);
    expect(db.getCollection('tests')).toBeDefined();
  });
});

import { MockServer, mockServer } from '@nocobase/test';
import { CollectionManager } from '../collection-manager';
import { Database } from '@nocobase/database';
import { mockUiSchema } from './mockUiSchema';
import PluginCollectionManager from '../server';
import { queryTable } from './helper';

describe('collection manager', () => {
  let app: MockServer;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {
        logging: console.log,
      },
    });

    db = app.db;

    await mockUiSchema(db);
    app.plugin(PluginCollectionManager);

    await app.load();
  });

  it('should import collection schema', async () => {
    expect(db.getCollection('collections')).toBeDefined();
    expect(db.getCollection('fields')).toBeDefined();
  });
});

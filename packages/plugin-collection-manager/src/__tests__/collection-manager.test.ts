import { mockDatabase, mockServer } from '@nocobase/test';
import { CollectionManager } from '../collection-manager';
import { Database } from '@nocobase/database';

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
    await CollectionManager.import(db);

    expect(db.getCollection('collections')).toBeDefined();
    expect(db.getCollection('fields')).toBeDefined();
  });
});

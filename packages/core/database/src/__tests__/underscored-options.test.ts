import { Database, mockDatabase } from '@nocobase/database';

describe('underscored options', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should use underscored option', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      underscored: true,
    });

    await db.sync();

    const tableName = collectionA.model.tableName;

    expect(tableName.includes('test_collection')).toBeTruthy();
  });
});

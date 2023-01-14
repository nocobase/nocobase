import { Database, mockDatabase } from '@nocobase/database';

describe('underscored options', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      underscored: true,
    });

    await db.clean({ drop: true });
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

  it('should use database options', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
    });

    await db.sync();

    const tableName = collectionA.model.tableName;

    expect(tableName.includes('test_collection')).toBeTruthy();
  });
});

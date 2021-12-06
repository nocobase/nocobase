import { mockDatabase } from '../';

describe('mock databasea', () => {
  it('mock databasea', async () => {
    const db = mockDatabase();
    db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name' }],
    });
    expect(db.getCollection('tests').model.getTableName()).toBe('_test_mockDatabase_tests');
    await db.sync();
    await db.close();
  });
});

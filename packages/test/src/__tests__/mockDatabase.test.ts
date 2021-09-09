import { mockDatabase } from "../";

describe('mock databasea', () => {
  it('mock databasea', async () => {
    const db = mockDatabase();
    db.table({
      name: 'tests',
      fields: [
        { type: 'string', name: 'name' },
      ],
    });
    expect(db.getModel('tests').getTableName()).toBe('_test_mockDatabase_tests');
    await db.sync();
    await db.close();
  });
});

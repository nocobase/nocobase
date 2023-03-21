import { Database, mockDatabase } from '@nocobase/database';

describe('list view', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should list view', async () => {
    const sql1 = `CREATE OR REPLACE VIEW test1 AS SELECT 1`;
    const sql2 = `CREATE OR REPLACE VIEW test2 AS SELECT 2`;

    await db.sequelize.query(sql1);
    await db.sequelize.query(sql2);

    const results = await db.queryInterface.listViews();
    expect(results.find((item) => item.viewname === 'test1')).toBeTruthy();
    expect(results.find((item) => item.viewname === 'test2')).toBeTruthy();
  });
});

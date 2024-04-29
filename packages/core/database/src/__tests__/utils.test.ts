import Database, { mockDatabase } from '@nocobase/database';

describe('database utils', () => {
  let db: Database;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });
  });

  it.runIf(process.env['DB_DIALECT'] === 'postgres')('should get database schema', async () => {
    const schema = process.env['DB_SCHEMA'] || 'public';
    expect(db.utils.schema()).toEqual(schema);
  });
});

import { createMockServer, MockServer } from '@nocobase/test';
import Migration from '../20250420000000-add-log-to-jobs';

describe('migration: add log to jobs', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['workflow'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should add log column if missing', async () => {
    const { db } = app;
    const queryInterface = db.sequelize.getQueryInterface();
    const jobsCollection = db.getCollection('jobs');
    const tableName = jobsCollection.getTableNameWithSchema();
    const descBefore = await queryInterface.describeTable(
      typeof tableName === 'string' ? tableName : tableName.tableName,
    );
    if (descBefore['log']) {
      await queryInterface.removeColumn(tableName as any, 'log');
    }
    const migration = new Migration({ context: { db } } as any);
    await migration.up();
    const descAfter = await queryInterface.describeTable(
      typeof tableName === 'string' ? tableName : tableName.tableName,
    );
    expect(descAfter['log']).toBeDefined();
  });

  it('should be idempotent', async () => {
    const { db } = app;
    const migration = new Migration({ context: { db } } as any);
    await expect(migration.up()).resolves.not.toThrow();
    await expect(migration.up()).resolves.not.toThrow();
  });

  it('should remove log column on down()', async () => {
    const { db } = app;
    const queryInterface = db.sequelize.getQueryInterface();
    const jobsCollection = db.getCollection('jobs');
    const tableName = jobsCollection.getTableNameWithSchema();
    const migration = new Migration({ context: { db } } as any);
    await migration.up();
    await migration.down();
    const desc = await queryInterface.describeTable(
      typeof tableName === 'string' ? tableName : tableName.tableName,
    );
    expect(desc['log']).toBeUndefined();
  });
});

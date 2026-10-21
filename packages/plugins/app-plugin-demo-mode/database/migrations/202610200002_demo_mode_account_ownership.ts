import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610200002_demo_mode_account_ownership',
  async up({ builder, query }) {
    // Ownership survives clearing when the application disables accounts instead of deleting them.
    await builder.createCollection('demoModeAccounts', (collection) => {
      collection.string('userId', {
        length: 64,
        primaryKey: true,
        nullable: false,
      });
      collection.string('datasetId', { length: 64, nullable: false });
    });
    const accounts = await query
      .selectFrom('demoModeRecords')
      .select(['datasetId', 'recordId'])
      .where('collection', '=', '@user')
      .execute<{ datasetId: string; recordId: string }>();
    for (const account of accounts)
      await query
        .insertInto('demoModeAccounts')
        .values({ userId: account.recordId, datasetId: account.datasetId })
        .execute();
  },
  async down({ builder }) {
    await builder.dropCollection('demoModeAccounts');
  },
});

export default migration;

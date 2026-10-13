import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/** The projects plugin's issues table, reduced to what Studio's migrations read; its real migrations need the other plugins. */
const migration: MigrationDefinition = defineMigration({
  name: '202609300004_pm_create_issues',
  async up({ builder }) {
    await builder.createCollection('pmIssues', (collection) => {
      collection.string('id', { length: 64, primaryKey: true });
      collection.string('executorType', { length: 32 }).nullable();
      collection.string('executorId', { length: 64 }).nullable();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('pmIssues');
  },
});

export default migration;

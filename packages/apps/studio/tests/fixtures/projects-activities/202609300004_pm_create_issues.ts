import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/** The projects plugin's activities table, reduced to what Studio's migrations read; its real migrations need the other plugins. */
const migration: MigrationDefinition = defineMigration({
  name: '202609300004_pm_create_issues',
  async up({ builder }) {
    await builder.createCollection('pmActivities', (collection) => {
      collection.string('id', { length: 64, primaryKey: true });
      collection.string('action', { length: 64 }).notNull();
      collection.json('details').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('pmActivities');
  },
});

export default migration;

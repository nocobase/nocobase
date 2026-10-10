import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/** The projects plugin's workflows table, reduced to what Studio's migrations read; its real migrations need the other plugins. */
const migration: MigrationDefinition = defineMigration({
  name: '202609300007_pm_create_workflows',
  async up({ builder }) {
    await builder.createCollection('pmWorkflows', (collection) => {
      collection.string('id', { length: 64, primaryKey: true });
      collection.json('definition').notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('pmWorkflows');
  },
});

export default migration;

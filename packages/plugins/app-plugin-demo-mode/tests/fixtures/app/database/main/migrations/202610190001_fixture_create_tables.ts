import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610190001_fixture_create_tables',
  async up({ builder }) {
    // One-word names keep each physical table name equal to its Collection name, which the allow list matches.
    for (const name of ['demoitems', 'demonotes', 'session']) {
      await builder.createCollection(name, (collection) => {
        collection.string('name', { primaryKey: true, nullable: false });
      });
    }
  },
  async down({ builder }) {
    await builder.dropCollection('session');
    await builder.dropCollection('demonotes');
    await builder.dropCollection('demoitems');
  },
});

export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202601010001_fixture_create_items',
  async up({ builder }) {
    await builder.createCollection('fixtureItems', (collection) => {
      collection.string('name', { primaryKey: true, nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('fixtureItems');
  },
});

export default migration;

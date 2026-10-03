import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202601010001_library_create_authors',
  async up({ builder }) {
    await builder.createCollection('libraryAuthors', (collection) => {
      collection.string('id', { primaryKey: true, nullable: false });
      collection.string('name', { nullable: false });
      collection.unique(['name'], { mode: 'index' });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('libraryAuthors');
  },
});

export default migration;

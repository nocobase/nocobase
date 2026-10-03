import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202601010003_library_add_author_country',
  async up({ builder }) {
    await builder.alterCollection('libraryAuthors', (collection) => {
      collection.string('country', {
        nullable: false,
        defaultValue: 'unknown',
      });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('libraryAuthors', (collection) => {
      collection.dropField('country');
    });
  },
});

export default migration;

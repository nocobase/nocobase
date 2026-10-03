import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202601010002_library_create_books',
  async up({ builder }) {
    await builder.createCollection('libraryBooks', (collection) => {
      collection.string('id', { primaryKey: true, nullable: false });
      collection.string('title', { nullable: false });
      collection.text('summary');
      collection
        .belongsTo('author', 'libraryAuthors')
        .targetKey('id')
        .foreignKey('authorId')
        .foreignKeyType('string')
        .notNull()
        .constraints(true)
        .onDelete('restrict');
      collection.index(['title']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('libraryBooks');
  },
});

export default migration;

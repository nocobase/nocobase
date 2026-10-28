import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610180001_reading_list',
  async up({ builder }) {
    await builder.createCollection('readingListEntries', (collection) => {
      collection.string('id', { primaryKey: true });
      collection.string('title', { nullable: false, length: 255 });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('readingListEntries');
  },
});

export default migration;

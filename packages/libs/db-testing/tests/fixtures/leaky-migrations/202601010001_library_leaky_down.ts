import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// `down` forgets the table `up` created; verifyMigration has to notice.
const migration: MigrationDefinition = defineMigration({
  name: '202601010001_library_leaky_down',
  async up({ builder }) {
    await builder.createCollection('libraryShelves', (collection) => {
      collection.string('id', { primaryKey: true, nullable: false });
    });
  },
  async down() {},
});

export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// `down` forgets the Field `up` added, so the table is still there with one column too many; verifyMigration
// has to notice although the list of tables is unchanged.
const migration: MigrationDefinition = defineMigration({
  name: '202601010002_library_leaky_column',
  async up({ builder }) {
    await builder.alterCollection('libraryShelves', (collection) => {
      collection.string('label', { nullable: true });
    });
  },
  async down() {},
});

export default migration;

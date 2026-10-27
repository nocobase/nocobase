import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610210001_fixture_create_user',
  async up({ builder }) {
    // The columns the demo data service reads when it looks an account up by username.
    await builder.createCollection('user', (collection) => {
      collection.string('id', { primaryKey: true, nullable: false });
      collection.string('username', { nullable: true });
      collection.string('email', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('user');
  },
});

export default migration;

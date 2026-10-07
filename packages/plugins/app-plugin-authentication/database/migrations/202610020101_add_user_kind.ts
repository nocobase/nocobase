import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Service accounts: a user's `kind` (`person` for everyone who signs in, `service` for an account that only acts
 * through API keys) and a `description` saying what a service account is for. Existing users are people.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610020101_add_user_kind',
  async up({ builder }) {
    await builder.alterCollection('user', (collection) => {
      collection.string('kind', { length: 16 }).notNull().defaultTo('person');
      collection.text('description').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('user', (collection) => {
      collection.dropField('description');
      collection.dropField('kind');
    });
  },
});
export default migration;

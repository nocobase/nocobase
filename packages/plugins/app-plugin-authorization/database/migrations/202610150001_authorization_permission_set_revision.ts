import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610150001_authorization_permission_set_revision',
  async up({ builder }) {
    await builder.alterCollection(
      'authorizationPermissionSets',
      (collection) => {
        collection
          .string('revision', { length: 64 })
          .notNull()
          .defaultTo('initial');
      },
    );
  },
  async down({ builder }) {
    await builder.alterCollection(
      'authorizationPermissionSets',
      (collection) => {
        collection.dropField('revision');
      },
    );
  },
});
export default migration;

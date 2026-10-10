import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610100001_ag_create_registration_locks',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.createCollection('agRegistrationLocks', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.datetimeTz('updatedAt').notNull();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.dropCollection('agRegistrationLocks');
  },
});

export default migration;

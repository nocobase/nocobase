import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610100002_users_manual_invitations',
  async up({ builder }) {
    await builder.alterCollection('userInvitations', (collection) => {
      collection.boolean('manualDelivery').notNull().defaultTo(false);
    });
  },
  async down({ builder }) {
    await builder.alterCollection('userInvitations', (collection) => {
      collection.dropField('manualDelivery');
    });
  },
});
export default migration;

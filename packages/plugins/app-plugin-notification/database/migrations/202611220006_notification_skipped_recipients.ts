import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611220006_notification_skipped_recipients',
  async up({ builder }) {
    await builder.alterCollection('notificationDispatches', (table) => {
      table.json('skipped').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('notificationDispatches', (table) => {
      table.dropField('skipped');
    });
  },
});

export default migration;

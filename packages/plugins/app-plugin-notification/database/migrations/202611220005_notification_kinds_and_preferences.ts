import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Notification kinds and personal preferences.
 *
 * - `notificationPreferences`: one row per person, notification kind and channel type a person changed; a missing row
 *   means the kind's default.
 * - `notificationDispatches.kind`: the notification kind a send was made for, so the delivery log can be filtered by it.
 * - `notificationDeliveries.recipientKey`: who a delivery went to (a user id, an address, a device id, or the channel
 *   name for a group channel), so the delivery log can be filtered by recipient; and an index on `(createdAt, id)`, the
 *   order the delivery log pages in.
 *
 * Existing rows are not backfilled: older sends have no kind and no recipient key.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611220005_notification_kinds_and_preferences',
  async up({ builder }) {
    await builder.createCollection('notificationPreferences', (table) => {
      table.string('id', { length: 36 }).primary();
      table.string('userId', { length: 191 }).notNull();
      table.string('kind', { length: 200 }).notNull();
      table.string('channelType', { length: 64 }).notNull();
      table.boolean('enabled').notNull();
      table.datetimeTz('createdAt').notNull();
      table.datetimeTz('updatedAt').notNull();
      table.unique(['userId', 'kind', 'channelType'], {
        name: 'notification_preferences_user_kind_channel_unique',
      });
    });
    await builder.alterCollection('notificationDispatches', (table) => {
      table.string('kind', { length: 200 }).nullable();
    });
    await builder.alterCollection('notificationDeliveries', (table) => {
      table.string('recipientKey', { length: 191 }).nullable();
    });
    await builder.addIndex('notificationDeliveries', {
      name: 'notification_deliveries_created_idx',
      fields: ['createdAt', 'id'],
    });
  },
  async down({ builder }) {
    await builder.dropIndex(
      'notificationDeliveries',
      'notification_deliveries_created_idx',
    );
    await builder.alterCollection('notificationDeliveries', (table) => {
      table.dropField('recipientKey');
    });
    await builder.alterCollection('notificationDispatches', (table) => {
      table.dropField('kind');
    });
    await builder.dropCollection('notificationPreferences');
  },
});

export default migration;

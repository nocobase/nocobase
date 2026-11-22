import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * What an inbox message is about: the notification kind it was sent for, the kind's category (which the inbox filters
 * by) and the record it came from. Every column is nullable and older messages keep them empty. No index: the category
 * filter and the per-category unread count read one person's messages, which the existing
 * `(userId, readAt, createdAt)` index already narrows.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611220003_notification_in_app_kind_source',
  async up({ builder }) {
    await builder.alterCollection('notificationInAppItems', (table) => {
      table.string('kind', { length: 200 }).nullable();
      table.string('category', { length: 100 }).nullable();
      table.string('sourceType', { length: 100 }).nullable();
      table.string('sourceId', { length: 191 }).nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('notificationInAppItems', (table) => {
      table.dropField('sourceId');
      table.dropField('sourceType');
      table.dropField('category');
      table.dropField('kind');
    });
  },
});
export default migration;

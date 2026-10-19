import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610240051_web_push_subscriptions',
  async up({ builder }) {
    await builder.createCollection('webPushSubscriptions', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('userId', { length: 64 }).notNull();
      c.string('endpointHash', { length: 64 }).notNull().unique();
      c.text('subscriptionSealed').notNull();
      c.string('name', { length: 100 }).notNull();
      c.string('locale', { length: 16 }).notNull();
      c.boolean('enabled').notNull().defaultTo(true);
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.index(['userId']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('webPushSubscriptions');
  },
});
export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610240040_studio_issue_owner_handoffs',
  async up({ builder }) {
    await builder.createCollection('studioIssueOwnerHandoffs', (collection) => {
      collection.string('issueId', { length: 64 }).primary().notNull();
      collection.boolean('waiting').notNull().defaultTo(false);
      collection.string('ownerUserId', { length: 64 }).notNull();
      collection.string('previousOwnerUserId', { length: 64 }).notNull();
      collection.string('transferredByUserId', { length: 64 }).notNull();
      collection.string('notificationKey', { length: 64 }).notNull();
      collection.datetimeTz('transferredAt').notNull();
      collection.datetimeTz('rejectedAt').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('studioIssueOwnerHandoffs');
  },
});

export default migration;

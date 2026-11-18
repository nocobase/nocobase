import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611080001_ag_conversation_shares',
  async up({ builder }) {
    await builder.createCollection('agConversationShares', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('conversationId', { length: 64 }).notNull();
      c.string('userId', { length: 64 }).notNull();
      c.integer('cutoffSeq').notNull();
      c.datetimeTz('snapshotAt').notNull();
      c.string('title', { length: 400 }).nullable();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.unique(['conversationId', 'userId'], {
        name: 'ag_conversation_share_user_uq',
      });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('agConversationShares');
  },
});
export default migration;

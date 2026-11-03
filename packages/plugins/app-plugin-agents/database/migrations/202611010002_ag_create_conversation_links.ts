import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// What a conversation is tied to in the application, such as an issue: a kind the application registers and the id
// of one of its records. Each target is tied once per conversation.
const migration: MigrationDefinition = defineMigration({
  name: '202611010002_ag_create_conversation_links',

  async up({ builder }) {
    await builder.createCollection('agConversationLinks', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('conversationId', { length: 64 }).notNull();
      collection.string('kind', { length: 64 }).notNull();
      collection.string('targetId', { length: 255 }).notNull();
      // user | agent | application
      collection.string('origin', { length: 16 }).notNull();
      collection.string('createdById', { length: 64 }).nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.unique(['conversationId', 'kind', 'targetId'], {
        name: 'ag_conversation_links_target_uq',
      });
      collection.index(['kind', 'targetId'], {
        name: 'ag_conversation_links_kind_idx',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('agConversationLinks');
  },
});

export default migration;

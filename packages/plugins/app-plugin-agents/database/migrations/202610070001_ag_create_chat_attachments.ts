import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Files people send with chat messages, stored through the file plugin's repository: its fixed file columns, who
// uploaded the file, and the conversation and message it was sent with. An upload not sent yet is attached to nothing,
// visible to its uploader only, and purged a day later.

const migration: MigrationDefinition = defineMigration({
  name: '202610070001_ag_create_chat_attachments',

  async up({ builder }) {
    await builder.createCollection('agChatAttachments', (collection) => {
      collection.uuid('id').primary().notNull();
      collection.string('disk', { length: 255 }).notNull();
      collection.text('key').notNull();
      collection.text('filename').notNull();
      collection.string('ext', { length: 32 }).notNull();
      collection.string('mimeType', { length: 255 }).notNull();
      collection.bigInt('size').notNull();
      collection.string('uploaderId', { length: 64 }).notNull();
      collection.string('conversationId', { length: 64 }).nullable();
      collection.string('messageId', { length: 64 }).nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.index(['conversationId', 'messageId'], {
        name: 'ag_chat_attachments_conversation_idx',
      });
      collection.index(['uploaderId', 'createdAt'], {
        name: 'ag_chat_attachments_uploader_idx',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('agChatAttachments');
  },
});

export default migration;

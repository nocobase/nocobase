import {
  defineMigration,
  type MigrationDefinition,
  type MigrationContext,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610270002_ag_chat_list_visibility',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agConversations', (collection) => {
      collection.boolean('showInChatList').notNull().defaultTo(true);
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agConversations', (collection) => {
      collection.dropField('showInChatList');
    });
  },
});
export default migration;

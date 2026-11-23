import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * A person's own reasoning effort for the conversations they start (`ChatPreferences.effort`; null: each agent's
 * default). Kept beside their default agent in `agChatPreferences`; read only when a conversation is created.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611210003_ag_chat_preference_effort',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agChatPreferences', (collection) => {
      collection.string('effort', { length: 32 }).nullable();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agChatPreferences', (collection) => {
      collection.dropField('effort');
    });
  },
});

export default migration;

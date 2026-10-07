import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

// A conversation starts on thread 1, and thread 0 is where the checkpoint
// cleanup moves a conversation whose checkpoints it released. A row inserted
// without a thread therefore starts on 1 too, rather than looking released.
const migration: MigrationDefinition = defineMigration({
  name: '202610070002_default_ai_conversation_thread_to_one',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterField('aiConversations', 'thread', {
      type: 'integer',
      nullable: false,
      defaultValue: 1,
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterField('aiConversations', 'thread', {
      type: 'integer',
      nullable: false,
      defaultValue: 0,
    });
  },
});

export default migration;

import {
  defineMigration,
  type MigrationDefinition,
  type MigrationContext,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611070001_ag_conversation_project',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agConversations', (collection) => {
      collection.string('projectId', { length: 64 }).nullable();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agConversations', (collection) => {
      collection.dropField('projectId');
    });
  },
});

export default migration;

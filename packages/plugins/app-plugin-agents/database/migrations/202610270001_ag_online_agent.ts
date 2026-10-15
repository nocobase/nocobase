import {
  defineMigration,
  type MigrationDefinition,
  type MigrationContext,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610270001_ag_online_agent',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agConversations', (collection) => {
      collection.json('metadata').nullable().defaultTo(null);
      collection.alterField('agentId', {
        type: 'string',
        length: 64,
        nullable: true,
      });
    });
    await builder.alterCollection('agChatPreferences', (collection) => {
      collection.json('onlineAgent').nullable().defaultTo(null);
    });
  },
  async down({ builder, query }: MigrationContext): Promise<void> {
    const rows = await query
      .selectFrom('agConversations')
      .select('id')
      .where('metadata', 'is not', null)
      .limit(1)
      .execute();
    if (rows.length)
      throw new Error(
        'Online conversations must be removed before rolling back this migration.',
      );
    await builder.alterCollection('agChatPreferences', (collection) => {
      collection.dropField('onlineAgent');
    });
    await builder.alterCollection('agConversations', (collection) => {
      collection.dropField('metadata');
      collection.alterField('agentId', {
        type: 'string',
        length: 64,
        nullable: false,
      });
    });
  },
});

export default migration;

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Who may chat with an agent: null for every signed-in person, or the keys of the permission sets (roles) whose
 * members may. Existing agents keep null, so everyone who could chat with them still can. Only the chat entry points
 * compare it with the caller's permission sets; nothing looks agents up by role, so it needs no index.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611210002_ag_agent_chat_roles',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agAgents', (collection) => {
      collection.json('chatRoles').nullable();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agAgents', (collection) => {
      collection.dropField('chatRoles');
    });
  },
});

export default migration;

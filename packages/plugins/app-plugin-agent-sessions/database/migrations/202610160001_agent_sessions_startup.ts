import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * What the bridge is doing to open each session's agent (`agentSessions.startup`: starting it, opening its session,
 * applying its choices), null once it is open, so the session page can say so while the person waits.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610160001_agent_sessions_startup',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.string('startup', { length: 20 }).nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.dropFields('startup');
    });
  },
});

export default migration;

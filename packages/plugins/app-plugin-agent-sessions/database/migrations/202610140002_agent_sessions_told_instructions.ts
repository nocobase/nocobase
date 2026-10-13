import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Which of the application's instructions for agents the agent of a session was told (`agentSessions.toldInstructions`:
 * their SHA-256, null before it was told any), so that it is told them again only when they change.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610140002_agent_sessions_told_instructions',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.string('toldInstructions', { length: 64 }).nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.dropField('toldInstructions');
    });
  },
});

export default migration;

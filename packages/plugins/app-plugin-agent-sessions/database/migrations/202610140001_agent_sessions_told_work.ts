import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * What the agent of a session was last told about the work tied to it (`agentSessions.toldWork`: each record's
 * standing by `kind:refId`, null before it was told anything), so that a message tells it only what changed since; and
 * the language its owner last wrote in (`locale`), which what the agent reads of that work is written in.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610140001_agent_sessions_told_work',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.json('toldWork').nullable();
      collection.string('locale', { length: 35 }).nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.dropField('locale');
      collection.dropField('toldWork');
    });
  },
});

export default migration;

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * How far its owner has seen each session (`agentSessions.seenSeq`, the last event they saw), so they are told only of
 * what they did not see; and the last event they were told of (`noticedSeq`, null once they saw it), so seeing the
 * session settles what they were told.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610150003_agent_sessions_seen',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.integer('seenSeq').notNull().defaultTo(0);
      collection.integer('noticedSeq').nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agentSessions', (collection) => {
      collection.dropFields('noticedSeq', 'seenSeq');
    });
  },
});

export default migration;

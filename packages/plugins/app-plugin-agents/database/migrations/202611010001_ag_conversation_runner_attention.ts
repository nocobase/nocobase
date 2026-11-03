import {
  defineMigration,
  type MigrationDefinition,
  type MigrationContext,
} from '@nocobase/db';

// A conversation's runner (the first one to take a run on it; only it takes the next ones) and what its owner has
// seen of it: the read position, what waits for them, and what they were told of.
const migration: MigrationDefinition = defineMigration({
  name: '202611010001_ag_conversation_runner_attention',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agConversations', (collection) => {
      collection.string('runnerId', { length: 64 }).nullable();
      collection.integer('seenSeq').notNull().defaultTo(0);
      // reply | failed | confirm
      collection.string('needsYou', { length: 16 }).nullable();
      collection.integer('needsYouSeq').nullable();
      collection.text('needsYouText').nullable();
      collection.integer('noticedSeq').nullable();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agConversations', (collection) => {
      collection.dropField('noticedSeq');
      collection.dropField('needsYouText');
      collection.dropField('needsYouSeq');
      collection.dropField('needsYou');
      collection.dropField('seenSeq');
      collection.dropField('runnerId');
    });
  },
});

export default migration;

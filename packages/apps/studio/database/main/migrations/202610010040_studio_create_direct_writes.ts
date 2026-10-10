import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610010040_studio_create_direct_writes',

  async up({ builder }) {
    await builder.createCollections([
      {
        // The direct-write ledger of conversation runs: what an agent changed for the person without a plan, one row
        // per object and plan, counted against the quota of the run (a turn) inside the write's own transaction.
        name: 'studioDirectWrites',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The agents plugin's run and conversation; no foreign key, as the plugin's tables are its own.
          collection.string('runId', { length: 64 }).notNull();
          collection.string('conversationId', { length: 64 }).notNull();
          // `issue:<id>` or `project:<id>`; a comment or a dependency counts on its issue.
          collection.string('objectKey', { length: 160 }).notNull();
          // The executed plan that made the change undoable.
          collection.string('planId', { length: 64 }).notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.index(['runId']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioDirectWrites');
  },
});

export default migration;

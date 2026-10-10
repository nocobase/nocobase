import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// A status's loop guard survives restarts. A pending token is consumed together with the owner's continuation run.
const migration: MigrationDefinition = defineMigration({
  name: '202610210010_studio_stage_run_guards',
  async up({ builder }) {
    await builder.createCollection('studioStageRunGuards', (collection) => {
      collection.string('id', { length: 200 }).primary().notNull();
      collection.string('issueId', { length: 64 }).notNull();
      collection.string('statusKey', { length: 64 }).notNull();
      collection.datetimeTz('resetAt').nullable();
      collection.string('pendingToken', { length: 64 }).nullable();
      collection.string('agentId', { length: 64 }).nullable();
      collection.string('fromStatus', { length: 64 }).nullable();
      collection.json('ruleConfig').nullable();
      collection.index(['issueId']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('studioStageRunGuards');
  },
});

export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020004_ag_create_variables',

  async up({ builder }) {
    await builder.createCollections([
      {
        // Variables a run's agent gets, every one a secret: sealed with the application's secrets keys, bound to its
        // scope and name, set on an agent, a working directory (`workdir`), or a scope the application registers.
        name: 'agSecrets',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // agent | workdir | a registered scope key; a string because it is part of a unique key.
          collection.string('scope', { length: 32 }).notNull();
          collection.string('scopeId', { length: 64 }).notNull();
          collection.string('name', { length: 128 }).notNull();
          collection.text('valueEncrypted').notNull();
          collection.string('createdById', { length: 64 }).nullable();
          collection.string('updatedById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['scope', 'scopeId', 'name']);
        },
      },
      {
        // Who did what with a scope's variables: set, delete, reveal (a person read the values), deliver (a runner got
        // them for a run).
        name: 'agSecretAudits',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('scope', { length: 32 }).notNull();
          collection.string('scopeId', { length: 64 }).notNull();
          collection.string('action', { length: 16 }).notNull();
          collection.json('names').notNull().defaultTo([]);
          collection.string('userId', { length: 64 }).nullable();
          collection.string('runnerId', { length: 64 }).nullable();
          collection.string('runId', { length: 64 }).nullable();
          // Set instead of runId when a job's claim delivered the values.
          collection.string('jobId', { length: 64 }).nullable();
          collection.datetimeTz('at').notNull();
          collection.index(['scope', 'scopeId', 'at']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agSecretAudits');
    await builder.dropCollection('agSecrets');
  },
});

export default migration;

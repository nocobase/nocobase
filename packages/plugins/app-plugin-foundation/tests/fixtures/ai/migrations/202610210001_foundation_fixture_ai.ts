import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Only the Collection fields this version adapter reads; no model credentials or external calls.
const migration: MigrationDefinition = defineMigration({
  name: '202610210001_foundation_fixture_ai',
  async up({ builder }) {
    await builder.createCollection('agModelServices', (collection) => {
      collection.string('id').primary().notNull();
      collection.boolean('enabled').notNull();
    });
    for (const name of ['agAgents', 'agRunners', 'agRuns'])
      await builder.createCollection(name, (collection) => {
        collection.string('id').primary().notNull();
      });
    await builder.createCollection('agModelUsage', (collection) => {
      collection.string('id').primary().notNull();
      collection.integer('inputTokens').notNull();
      collection.integer('outputTokens').notNull();
    });
  },
  async down({ builder }) {
    for (const name of [
      'agModelUsage',
      'agRuns',
      'agRunners',
      'agAgents',
      'agModelServices',
    ])
      await builder.dropCollection(name);
  },
});

export default migration;

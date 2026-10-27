import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The lifecycle store's two Collections, which the application that runs lifecycles creates itself
// (`LIFECYCLE_COLLECTIONS` in `@nocobase/lifecycle`).
const migration: MigrationDefinition = defineMigration({
  name: '202610200002_foundation_fixture_lifecycle',

  async up({ builder }) {
    await builder.createCollection('lifecycleTransitions', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('lifecycle', { length: 191 }).notNull();
      collection.string('recordId', { length: 191 }).notNull();
      collection.string('transition', { length: 191 }).notNull();
      collection.string('to', { length: 191 }).notNull();
      collection.integer('version').notNull();
      collection.datetimeTz('at').notNull();
    });
    await builder.createCollection('lifecycleEffectRuns', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('lifecycle', { length: 191 }).notNull();
      collection.string('effect', { length: 191 }).notNull();
      collection.string('status', { length: 32 }).notNull();
      collection.datetimeTz('createdAt').notNull();
    });
  },

  async down({ builder }) {
    await builder.dropCollection('lifecycleEffectRuns');
    await builder.dropCollection('lifecycleTransitions');
  },
});

export default migration;

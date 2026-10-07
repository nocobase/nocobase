import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020201_create_user_preferences',

  async up({ builder }) {
    await builder.createCollection('userPreferences', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.string('key', { length: 100 }).notNull();
      // The value as JSON text, so every dialect stores and returns it the same way.
      collection.text('value').notNull();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      // The owner is authentication's `user.id`; no relation is declared, so the table stands on its own.
      collection.unique(['userId', 'key']);
    });
  },

  async down({ builder }) {
    await builder.dropCollection('userPreferences');
  },
});

export default migration;

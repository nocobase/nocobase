import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610010020_studio_create_settings',

  async up({ builder }) {
    await builder.createCollections([
      {
        // Studio's own settings, one row per key: `defaultRole`, the role a new member is given (null for none; a
        // missing row means `contributor`).
        name: 'studioSettings',
        definition: (collection) => {
          collection.string('key', { length: 64 }).primary().notNull();
          collection.json('value').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioSettings');
  },
});

export default migration;

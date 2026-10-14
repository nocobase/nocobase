import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// What happened to each of an organization's API keys (`server/access/api-keys.ts`), with who did it: created,
// updated, permissions changed (the scope before and after), rotated, disabled, enabled, deleted. A key is named by
// its identity's id (a `service` user of the authentication plugin), which stays through a rotation and a deletion.
const migration: MigrationDefinition = defineMigration({
  name: '202610040010_studio_create_api_key_events',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'studioApiKeyEvents',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('identityId', { length: 64 }).notNull();
          collection.string('action', { length: 32 }).notNull();
          collection.string('actorId', { length: 64 }).nullable();
          collection.json('details').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.index(['identityId', 'createdAt']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioApiKeyEvents');
  },
});

export default migration;

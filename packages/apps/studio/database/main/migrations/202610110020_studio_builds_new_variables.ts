import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// What a preview build's variables manifest changes against the App it previews (`server/builds/service.ts`): the
// variables it adds and removes, `{ added: [{ name, description, required, secret }], removed: [name] }`; null when
// either side declares none.
const migration: MigrationDefinition = defineMigration({
  name: '202610110020_studio_builds_new_variables',

  async up({ builder }) {
    await builder.alterCollection('studioBuilds', (collection) => {
      collection.json('newVariables').nullable();
    });
  },

  async down({ builder }) {
    await builder.alterCollection('studioBuilds', (collection) => {
      collection.dropField('newVariables');
    });
  },
});

export default migration;

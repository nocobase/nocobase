import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The Apps someone took off a repository's "Deploy (CI)" list (`server/builds/ci-setup.ts` `removeApp`): one row per
// repository, environment and App (or the pull requests' Apps of an application), with when. The builds CI reported
// until then no longer count for it, so it shows again once CI reports it again.
//
// - `resourceId`: the working directory (`pmProjectResources.id`); `environmentId`, `appId`: the row as listed, the
//   application's ID for its pull requests' Apps (`pullRequests`). No foreign keys: the plugins' tables are their own.
// - `hiddenBy`, `hiddenAt`: who took it off, and when.
const migration: MigrationDefinition = defineMigration({
  name: '202610170030_studio_create_repo_ci_hidden_apps',

  async up({ builder }) {
    await builder.createCollection('studioRepoCiHiddenApps', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('resourceId', { length: 64 }).notNull();
      collection.string('environmentId', { length: 64 }).notNull();
      collection.string('appId', { length: 128 }).notNull();
      collection.boolean('pullRequests').notNull().defaultTo(false);
      collection.string('hiddenBy', { length: 64 }).nullable();
      collection.datetimeTz('hiddenAt').notNull();
      collection.unique(
        ['resourceId', 'environmentId', 'appId', 'pullRequests'],
        {
          mode: 'index',
        },
      );
    });
  },

  async down({ builder }) {
    await builder.dropCollection('studioRepoCiHiddenApps');
  },
});

export default migration;

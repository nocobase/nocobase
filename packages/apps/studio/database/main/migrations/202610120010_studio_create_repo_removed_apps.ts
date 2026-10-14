import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The Apps a repository built that were deleted in release management (`server/releases/app-removal.ts`): their links
// are removed, and one row per repository and App keeps what the App did, so the repository's settings can offer to
// create it again.
//
// - `resourceId`, `appId`: the working directory (`pmProjectResources.id`) and the deleted App (`relApps.id`); no
//   foreign keys, as the plugins' tables are their own and the App is gone.
// - `appName`, `role`, `environmentId`, `previewEnvironmentId`: the link as it was (`studioRepoApps`).
// - `removedBy`, `removedAt`: who deleted the App, and when.
const migration: MigrationDefinition = defineMigration({
  name: '202610120010_studio_create_repo_removed_apps',

  async up({ builder }) {
    await builder.createCollection('studioRepoRemovedApps', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('resourceId', { length: 64 }).notNull();
      collection.string('appId', { length: 128 }).notNull();
      collection.string('appName', { length: 255 }).notNull();
      collection.string('role', { length: 16 }).nullable();
      collection.string('environmentId', { length: 64 }).notNull();
      collection.string('previewEnvironmentId', { length: 64 }).nullable();
      collection.string('removedBy', { length: 64 }).nullable();
      collection.datetimeTz('removedAt').notNull();
      collection.unique(['resourceId', 'appId'], { mode: 'index' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('studioRepoRemovedApps');
  },
});

export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610010050_studio_create_repo_apps',

  async up({ builder }) {
    await builder.createCollections([
      {
        // The Apps a project's repository builds: release management's Apps linked to a working directory, each built
        // by the repository's CI (`server/builds`). A linked App may be the staging App (built from the default
        // branch) or the production App (built from tags) for deployment marks, and may have its pull requests
        // previewed in an environment able to run what it ships. Release management's "related" Apps of a project
        // lead come from here (`server/releases/links.ts`).
        name: 'studioRepoApps',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The projects plugin's working directory (`pmProjectResources.id`); no foreign key, as the plugins' tables
          // are their own.
          collection.string('resourceId', { length: 64 }).notNull();
          // Release management's App (`relApps.id`) and its environment (`relEnvironments.id`) when it was linked.
          collection.string('appId', { length: 128 }).notNull();
          collection.string('environmentId', { length: 64 }).notNull();
          // `staging`, `production`, or null for an App only previewed.
          collection.string('role', { length: 16 }).nullable();
          // Where its previews run (`relEnvironments.id`); null: none.
          collection.string('previewEnvironmentId', { length: 64 }).nullable();
          collection.integer('position').notNull().defaultTo(0);
          collection.string('createdBy', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['resourceId', 'appId'], { mode: 'index' });
          collection.index(['appId']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioRepoApps');
  },
});

export default migration;

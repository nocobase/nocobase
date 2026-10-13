import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// How a repository working directory's CI is set up (`server/releases/ci.ts`, `shared/releases.ts`): one row per
// repository once someone chose, in "Deploy & previews", whether Studio sets it up by itself.
//
// - `auto`: whether Studio was asked to set it up; `state`: `manual` (the workflow and its API key are set up by hand,
//   also where an automatic setup falls back), `configured`, `pr-open` or `disabled`.
// - `keyIdentityId`: the organization API key the CI uploads with, once Studio created one; `secretName`: the
//   repository secret holding it; `workflowPath`: the workflow file.
// - `pullRequestNumber`, `pullRequestUrl`: the pull request adding or updating the workflow; `workflowSha`: the
//   workflow's last commit; `lastRotatedAt`, `lastError`: the key's last rotation and the last failure.
const migration: MigrationDefinition = defineMigration({
  name: '202610110010_studio_create_repo_ci',

  async up({ builder }) {
    await builder.createCollection('studioRepoCi', (collection) => {
      // The projects plugin's working directory (`pmProjectResources.id`); no foreign key, as the plugins' tables are
      // their own.
      collection.string('resourceId', { length: 64 }).primary().notNull();
      collection.boolean('auto').notNull().defaultTo(false);
      collection.string('state', { length: 16 }).notNull();
      collection.string('keyIdentityId', { length: 64 }).nullable();
      collection
        .string('secretName', { length: 64 })
        .notNull()
        .defaultTo('NB_STUDIO_API_KEY');
      collection
        .string('workflowPath', { length: 255 })
        .notNull()
        .defaultTo('.github/workflows/nb-studio.yml');
      collection.integer('pullRequestNumber').nullable();
      collection.string('pullRequestUrl', { length: 1024 }).nullable();
      collection.string('workflowSha', { length: 64 }).nullable();
      collection.datetimeTz('lastRotatedAt').nullable();
      collection.text('lastError').nullable();
      collection.string('createdBy', { length: 64 }).nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.index(['keyIdentityId']);
    });
  },

  async down({ builder }) {
    await builder.dropCollection('studioRepoCi');
  },
});

export default migration;

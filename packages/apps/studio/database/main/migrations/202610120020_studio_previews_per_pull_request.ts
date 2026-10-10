import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Previews belong to pull requests rather than issues (`server/previews`): CI deploys one per pull request, and
// `studioPreviews` is recreated keyed by pull request and the App previewed, its rows of the issue-keyed table dropped
// (their Apps are removed by the hourly reconciliation as orphans). The variables a repository's previews take, when
// they preview no App, are kept in `studioRepoPreviewVariables`. A repository's CI is one workflow file per
// application: `studioRepoCi.workflowPaths` lists the files Studio wrote. A deleted App is no longer offered for
// recreation (CI creates it again on its next deploy), so `studioRepoRemovedApps` is dropped.
const migration: MigrationDefinition = defineMigration({
  name: '202610120020_studio_previews_per_pull_request',

  async up({ builder }) {
    await builder.dropCollection('studioPreviews');
    await builder.createCollections([
      {
        // A pull request's preview, of the App CI named or of the repository itself (`targetAppId` null): the on-demand
        // App release management keeps in the preview environment, made when CI first builds the pull request for a
        // preview, following its head and deployed from the build CI uploads to it. Kept after the App is destroyed so
        // the issue page can say what happened.
        name: 'studioPreviews',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The working directory (`pmProjectResources.id`) and the pull request (`studioPullRequests.id`, with its
          // repository and number as they were); no foreign keys, as those tables are other modules'.
          collection.string('resourceId', { length: 64 }).notNull();
          collection.string('pullRequestId', { length: 64 }).notNull();
          collection.string('repo', { length: 255 }).notNull();
          collection.integer('number').notNull();
          // The App previewed (`relApps.id`), whose preview values it takes; null for the repository itself.
          collection.string('targetAppId', { length: 128 }).nullable();
          // The preview's own App and environment.
          collection.string('appId', { length: 128 }).notNull();
          collection.string('environmentId', { length: 64 }).notNull();
          // `waiting`, `deploying`, `ready`, `blocked`, `failed` or `destroyed`.
          collection.string('status', { length: 16 }).notNull();
          // The head it should run, and the commit deployed.
          collection.string('sha', { length: 64 }).nullable();
          collection.string('deployedSha', { length: 64 }).nullable();
          // The build deployed or being deployed, its release in the preview's App, and the deployment.
          collection.string('buildId', { length: 64 }).nullable();
          collection.string('releaseId', { length: 64 }).nullable();
          collection.string('deploymentId', { length: 64 }).nullable();
          collection.text('error').nullable();
          collection.string('createdBy', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['appId'], { mode: 'index' });
          collection.index(['pullRequestId', 'targetAppId']);
          collection.index(['resourceId', 'status']);
          collection.index(['deploymentId']);
        },
      },
      {
        // The variables every preview of a repository that previews no App takes, as an App's preview values are to its
        // previews. The value is sealed with the application's secrets keys, bound to the repository and name.
        name: 'studioRepoPreviewVariables',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('resourceId', { length: 64 }).notNull();
          collection.string('name', { length: 128 }).notNull();
          collection.text('value').notNull();
          collection.boolean('secret').notNull().defaultTo(false);
          collection.string('updatedBy', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['resourceId', 'name'], { mode: 'index' });
        },
      },
    ]);
    await builder.alterCollection('studioRepoCi', (collection) => {
      collection.json('workflowPaths').nullable();
    });
    await builder.dropCollection('studioRepoRemovedApps');
  },

  async down({ builder }) {
    // `studioRepoRemovedApps` as `202610120010_studio_create_repo_removed_apps` made it.
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
    await builder.alterCollection('studioRepoCi', (collection) => {
      collection.dropField('workflowPaths');
    });
    await builder.dropCollection('studioRepoPreviewVariables');
    await builder.dropCollection('studioPreviews');
    // The issue-keyed table as `202610020020_studio_create_previews` made it.
    await builder.createCollection('studioPreviews', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('issueId', { length: 64 }).notNull();
      collection.string('resourceId', { length: 64 }).notNull();
      collection.string('targetAppId', { length: 128 }).notNull();
      collection.string('appId', { length: 128 }).notNull();
      collection.string('environmentId', { length: 64 }).notNull();
      collection.string('status', { length: 16 }).notNull();
      collection.string('pullRequestId', { length: 64 }).nullable();
      collection.string('sha', { length: 64 }).nullable();
      collection.string('deployedSha', { length: 64 }).nullable();
      collection.string('buildId', { length: 64 }).nullable();
      collection.string('releaseId', { length: 64 }).nullable();
      collection.string('deploymentId', { length: 64 }).nullable();
      collection.text('error').nullable();
      collection.string('adminUsername', { length: 64 }).nullable();
      collection.string('adminEmail', { length: 191 }).nullable();
      collection.text('adminPassword').nullable();
      collection.string('createdBy', { length: 64 }).nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.unique(['issueId', 'targetAppId'], { mode: 'index' });
      collection.index(['appId']);
      collection.index(['deploymentId']);
      collection.index(['pullRequestId', 'targetAppId']);
    });
  },
});

export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020020_studio_create_previews',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A build CI reported or uploaded (`server/builds`), one per App, pinned commit and purpose: `preview` (the
        // head of an open pull request), `staging` (on the default branch) or `production` (a tag's target), each
        // verified with the git platform before anything is recorded. Its archive is uploaded once; uploading it
        // again answers the same release. A preview build whose pull request moved on is superseded and never deployed.
        name: 'studioBuilds',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // Release management's App the build is of (`relApps.id`, a linked App) and its working directory.
          collection.string('appId', { length: 128 }).notNull();
          collection.string('resourceId', { length: 64 }).notNull();
          collection.string('sha', { length: 64 }).notNull();
          collection.string('purpose', { length: 16 }).notNull();
          // The branch (staging) or tag (production) the commit was verified on; null for a preview.
          collection.string('ref', { length: 255 }).nullable();
          // For a preview: Studio's pull request (`studioPullRequests.id`) whose head it was.
          collection.string('pullRequestId', { length: 64 }).nullable();
          // `queued`, `building`, `failed` or `succeeded`, as CI reports it, with its log page and a message.
          collection.string('state', { length: 16 }).notNull();
          collection.string('logsUrl', { length: 2000 }).nullable();
          collection.string('message', { length: 1000 }).nullable();
          collection.boolean('superseded').notNull().defaultTo(false);
          // The release its archive became, and the App it was uploaded to (a preview's own App for a preview).
          collection.string('releaseId', { length: 64 }).nullable();
          collection.string('releaseAppId', { length: 128 }).nullable();
          // Whose credential reported it (the API key's user), as whom Studio uploads it.
          collection.string('reportedBy', { length: 64 }).nullable();
          collection.datetimeTz('verifiedAt').notNull();
          collection.datetimeTz('uploadedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['appId', 'sha', 'purpose'], { mode: 'index' });
          collection.index(['pullRequestId', 'appId']);
          collection.index(['releaseId']);
        },
      },
      {
        // An issue's preview of one linked App (`server/previews`): the on-demand App release management keeps in
        // the App's preview environment, following the head of the issue's open pull request, and deployed from the
        // build CI uploads for that head. One row per issue and App, kept after the App is destroyed so the issue
        // page can say what happened.
        name: 'studioPreviews',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The projects plugin's issue and working directory (`pmIssues.id`, `pmProjectResources.id`); no foreign
          // keys, as the plugins' tables are their own.
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('resourceId', { length: 64 }).notNull();
          // The linked App previewed (`relApps.id`), and the preview's own App and environment.
          collection.string('targetAppId', { length: 128 }).notNull();
          collection.string('appId', { length: 128 }).notNull();
          collection.string('environmentId', { length: 64 }).notNull();
          // `waiting`, `deploying`, `ready`, `failed` or `destroyed`.
          collection.string('status', { length: 16 }).notNull();
          // The pull request it follows (`studioPullRequests.id`), its head commit, and the commit deployed.
          collection.string('pullRequestId', { length: 64 }).nullable();
          collection.string('sha', { length: 64 }).nullable();
          collection.string('deployedSha', { length: 64 }).nullable();
          // The build deployed or being deployed, its release in the preview's App, and the deployment.
          collection.string('buildId', { length: 64 }).nullable();
          collection.string('releaseId', { length: 64 }).nullable();
          collection.string('deploymentId', { length: 64 }).nullable();
          collection.text('error').nullable();
          // The App's first administrator (`users.initialAdmin` of its configuration); the password sealed with the
          // application's secrets keys, bound to the row.
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
        },
      },
      {
        // Which issues the deployment running on a long-lived App (staging, production) contains (`server/deploys`):
        // the mark of an issue on an App. Every deployment re-checks the App's marks against the commit it runs: one
        // it contains is renewed with its release, one it does not is withdrawn (an older release, a rollback), and a
        // finished issue it newly contains gets a mark.
        name: 'studioDeployMarks',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('projectId', { length: 64 }).nullable();
          collection.string('appId', { length: 128 }).notNull();
          collection.string('environmentId', { length: 64 }).notNull();
          // `staging` or `production`, from the repository link at the time.
          collection.string('role', { length: 16 }).notNull();
          // `checking` (Studio asks the code host), `deployed` or `withdrawn`. An issue keeps one decided row per App;
          // while a deployment is checked it has one `checking` row per commit that may carry its change (its pushed
          // head, its merged pull requests' merge commits).
          collection.string('status', { length: 16 }).notNull();
          // The commit found in the deployment (a decided row), or the one being looked for (a checking row).
          collection.string('sha', { length: 64 }).notNull();
          collection.string('deploymentId', { length: 64 }).notNull();
          collection.string('releaseId', { length: 64 }).nullable();
          collection.string('version', { length: 128 }).nullable();
          // The check deciding a `checking` row; on a row it withdrew, until the reopen suggestion is sent.
          collection.string('checkId', { length: 64 }).nullable();
          collection
            .string('withdrawnByDeploymentId', {
              length: 64,
            })
            .nullable();
          collection.string('withdrawnVersion', { length: 128 }).nullable();
          collection.datetimeTz('deployedAt').notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['issueId', 'appId', 'deploymentId', 'sha'], {
            mode: 'index',
          });
          collection.index(['appId', 'status']);
          collection.index(['checkId']);
          collection.index(['projectId', 'role', 'status']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioDeployMarks');
    await builder.dropCollection('studioPreviews');
    await builder.dropCollection('studioBuilds');
  },
});

export default migration;

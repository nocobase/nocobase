import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020010_studio_create_git',

  async up({ builder }) {
    await builder.createCollections([
      {
        // The workspace's connections to code hosts (`studio/server/git/connections.ts`), each of a provider: an app
        // installed on an account (its id, private key and installation, and its OAuth client for people's own
        // authorization) or a token. Every credential is sealed with the application's secrets keys, bound to the
        // connection, and never read back by the browser. An app's webhook posts to
        // `/api/webhooks/<provider>/connections/<id>`, verified with its webhook secret; its last delivery is kept for
        // the settings page. `allowPersonalTokens` lets people use a personal access token of their own on its host.
        name: 'studioGitConnections',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // `github`.
          collection.string('provider', { length: 32 }).notNull();
          // `app` or `token`.
          collection.string('kind', { length: 16 }).notNull();
          collection.string('name', { length: 255 }).notNull();
          collection.string('webUrl', { length: 255 }).notNull();
          collection.string('apiBaseUrl', { length: 255 }).notNull();
          collection.string('account', { length: 255 }).nullable();
          collection.string('appId', { length: 64 }).nullable();
          collection.string('installationId', { length: 64 }).nullable();
          collection.string('clientId', { length: 255 }).nullable();
          // An app Studio created from a manifest: its slug, and the organization that owns it (null for a person).
          collection.string('appSlug', { length: 255 }).nullable();
          collection.string('appOrganization', { length: 255 }).nullable();
          collection.text('privateKeySealed').nullable();
          collection.text('clientSecretSealed').nullable();
          collection.text('tokenSealed').nullable();
          collection.text('webhookSecretSealed').nullable();
          collection.boolean('allowPersonalTokens').notNull().defaultTo(true);
          collection.datetimeTz('webhookAt').nullable();
          collection.string('webhookEvent', { length: 64 }).nullable();
          collection.string('webhookStatus', { length: 32 }).nullable();
          collection.string('webhookReason', { length: 32 }).nullable();
          collection.string('createdById', { length: 191 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
      {
        // A person's own authorization on a connection's host: who they are there (login, name, the address their
        // commits carry), how they connected (`method`: `oauth`, the app's web flow; `device`, its device flow; `token`,
        // a personal access token they pasted) and their tokens, sealed; `expiresAt` is a personal token's expiry when
        // the host says. Studio acts as them when they open a pull request through an agent or merge from Studio;
        // without it, as the connection.
        name: 'studioGitUserAuths',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('userId', { length: 191 }).notNull();
          collection.string('connectionId', { length: 64 }).notNull();
          collection.string('providerUserId', { length: 64 }).notNull();
          collection.string('login', { length: 255 }).notNull();
          collection.string('name', { length: 255 }).nullable();
          collection.string('email', { length: 255 }).notNull();
          collection.string('method', { length: 16 }).notNull();
          collection.text('accessTokenSealed').notNull();
          collection.text('refreshTokenSealed').nullable();
          collection.datetimeTz('expiresAt').nullable();
          collection.datetimeTz('refreshExpiresAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['userId', 'connectionId'], {
            name: 'studio_git_user_auth_unique',
          });
        },
      },
      {
        // The repositories Studio watches (`studio/server/git`): one row per repository, found by its API base URL and
        // `owner/name`, reached through a connection (`connectionId`, with the host's id of the repository), as the
        // project working directory that links it says. `branchRules` are its branch patterns with `{key}`, the first
        // naming the branches agents work on; a pull request on a matching branch links to that issue. `listEtag` is
        // the conditional-request validator of its pull request list, so an unchanged list costs nothing. A webhook of
        // its own posts to `/api/studio-webhooks/github/<id>`, verified with its sealed secret; the last delivery's
        // time, event, outcome and reason are kept for the setup wizard, and a verified one makes polling a slow
        // fallback.
        name: 'studioGitRepos',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('provider', { length: 32 }).notNull();
          collection.string('apiBaseUrl', { length: 255 }).notNull();
          collection.string('repo', { length: 255 }).notNull();
          collection.string('connectionId', { length: 64 }).nullable();
          collection.string('externalId', { length: 64 }).nullable();
          collection.json('branchRules').nullable();
          // Whether a linked pull request's failing checks, or its conflicts, wake the issue's agent executor.
          collection.boolean('wakeOnChecks').notNull().defaultTo(true);
          collection.boolean('wakeOnConflict').notNull().defaultTo(true);
          collection.string('listEtag', { length: 255 }).nullable();
          collection.datetimeTz('polledAt').nullable();
          collection.string('pollError', { length: 500 }).nullable();
          collection.text('webhookSecretSealed').nullable();
          collection.datetimeTz('webhookAt').nullable();
          collection.string('webhookEvent', { length: 64 }).nullable();
          // `processed`, `ignored`, `invalidSignature` or `failed`, and why when it was not processed.
          collection.string('webhookStatus', { length: 32 }).nullable();
          collection.string('webhookReason', { length: 32 }).nullable();
          collection.string('updatedById', { length: 191 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['apiBaseUrl', 'repo'], {
            name: 'studio_git_repo_unique',
          });
          collection.index(['connectionId'], {
            name: 'studio_git_repo_connection_idx',
          });
        },
      },
      {
        // A pull request as Studio last read it from GitHub (a webhook delivery, the REST poller, a link, a refresh, a
        // merge preflight or a merge check). `pullEtag`, `statusEtag` and `runsEtag` are the validators of its last
        // reads; `checks` are its head's checks one by one. A merge Studio did or a person marked records who
        // (`mergedByUserId`); one GitHub reported records its login.
        name: 'studioPullRequests',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('repoId', { length: 64 }).notNull();
          collection.integer('number').notNull();
          collection.string('url', { length: 500 }).notNull();
          collection.string('title', { length: 500 }).notNull();
          // `open`, `closed` or `merged`.
          collection.string('state', { length: 16 }).notNull();
          collection.boolean('draft').notNull().defaultTo(false);
          collection.string('headRef', { length: 255 }).notNull();
          collection.string('baseRef', { length: 255 }).notNull();
          collection.string('headSha', { length: 64 }).notNull();
          collection.string('authorLogin', { length: 255 }).notNull();
          collection.string('mergeableState', { length: 32 }).nullable();
          // `pending`, `success`, `failure`, or null without checks.
          collection.string('ciState', { length: 16 }).nullable();
          // The checks of `headSha`: name, status, conclusion and page of each.
          collection.json('checks').nullable();
          collection.datetimeTz('mergedAt').nullable();
          collection.string('mergedByLogin', { length: 255 }).nullable();
          collection.string('mergedByUserId', { length: 191 }).nullable();
          // The commit the merge made on the base branch (a squash merge's single commit), when GitHub or Studio's own
          // merge reported it. Deployment marks look for it in a deployed commit, as a squashed head never is.
          collection.string('mergeCommitSha', { length: 64 }).nullable();
          // Marked merged by a person, not read from GitHub: a later read does not reopen it.
          collection.boolean('mergedManually').notNull().defaultTo(false);
          collection.datetimeTz('closedAt').nullable();
          collection.string('pullEtag', { length: 255 }).nullable();
          collection.string('statusEtag', { length: 255 }).nullable();
          collection.string('runsEtag', { length: 255 }).nullable();
          // The signals already reported for the current head (checks failed, conflict), and how many in a row.
          collection.json('signals').nullable();
          // A merge check: read it again from GitHub once this time passes (a push to its base, a new head), as GitHub
          // works out mergeability later and sends no event when it changes; retried while GitHub still computes.
          collection.datetimeTz('mergeCheckAfter').nullable();
          collection.integer('mergeCheckAttempts').notNull().defaultTo(0);
          collection.datetimeTz('snapshotAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['repoId', 'number'], {
            name: 'studio_pull_request_unique',
          });
          collection.index(['state'], {
            name: 'studio_pull_request_state_idx',
          });
          collection.index(['mergeCheckAfter'], {
            name: 'studio_pull_request_merge_check_idx',
          });
        },
      },
      {
        // Which issues a pull request belongs to: by its branch (a branch rule of its repository, `agent/PM-12`), linked
        // by hand (a suggestion a person confirmed, say), or by an agent (`nb-studio pr open`, `nb-studio pr link`). A link with `autoCompleteDisabled` does not count when
        // deciding whether every pull request of the issue is merged.
        name: 'studioIssuePullRequests',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('pullRequestId', { length: 64 }).notNull();
          // `user`, `agent` or `system` (matched by branch or key).
          collection.string('linkedByType', { length: 16 }).notNull();
          collection.string('linkedById', { length: 191 }).nullable();
          collection.boolean('autoCompleteDisabled').notNull().defaultTo(false);
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['issueId', 'pullRequestId'], {
            name: 'studio_issue_pull_request_unique',
          });
          collection.index(['pullRequestId'], {
            name: 'studio_issue_pull_request_pr_idx',
          });
        },
      },
      {
        // Pull requests whose title or body names an issue's key: suggested on the issue until a person confirms one
        // (it is linked) or dismisses it (`dismissedAt`, so it is not suggested again).
        name: 'studioPullRequestSuggestions',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('pullRequestId', { length: 64 }).notNull();
          collection.datetimeTz('dismissedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['issueId', 'pullRequestId'], {
            name: 'studio_pull_request_suggestion_unique',
          });
        },
      },
      {
        // A project's git settings: how its runs' commits are attributed when the person who asked for the work chose
        // nothing themselves (`withAgent` or `meOnly`).
        name: 'studioGitProjectSettings',
        definition: (collection) => {
          collection.string('projectId', { length: 64 }).primary().notNull();
          collection.string('attribution', { length: 16 }).notNull();
          collection.string('updatedById', { length: 191 }).nullable();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
      {
        // The webhook deliveries Studio has taken, by GitHub's `X-GitHub-Delivery` id per repository or connection
        // (`repoId` holds the one whose endpoint took it), so a delivery sent twice is acted on once. A delivery that failed is removed again, so GitHub may redeliver it. Kept 7 days.
        name: 'studioGitWebhookDeliveries',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('repoId', { length: 64 }).notNull();
          collection.string('deliveryId', { length: 128 }).notNull();
          collection.string('event', { length: 64 }).nullable();
          collection.datetimeTz('receivedAt').notNull();
          collection.unique(['repoId', 'deliveryId'], {
            name: 'studio_git_webhook_delivery_unique',
          });
          collection.index(['receivedAt'], {
            name: 'studio_git_webhook_delivery_received_idx',
          });
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioGitWebhookDeliveries');
    await builder.dropCollection('studioGitProjectSettings');
    await builder.dropCollection('studioPullRequestSuggestions');
    await builder.dropCollection('studioIssuePullRequests');
    await builder.dropCollection('studioPullRequests');
    await builder.dropCollection('studioGitRepos');
    await builder.dropCollection('studioGitUserAuths');
    await builder.dropCollection('studioGitConnections');
  },
});

export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Every table of release management. The plugin is new: this creation migration is its whole schema, and later
 * changes are new migrations.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610020001_rel_create_tables',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A deployment target: a driver, its settings and encrypted credentials, protection and a limit of Apps, and the
        // image registry its images come from (whether it takes only images from there).
        name: 'relEnvironments',
        definition: (c) => {
          c.string('id', { length: 64 }).primary().notNull();
          c.string('name', { length: 255 }).notNull();
          c.string('driver', { length: 32 }).notNull();
          c.json('config').notNull();
          c.text('secret').nullable();
          c.string('publicUrl', { length: 1024 }).nullable();
          c.boolean('protected').notNull().defaultTo(false);
          c.boolean('requiresApproval').notNull().defaultTo(false);
          c.json('approvers').notNull();
          c.integer('maxApps').nullable();
          // The runtime policy of an App created here without its own (null: never stops, never dormant).
          c.integer('defaultIdleStopMinutes').nullable();
          c.double('defaultDormantAfterHours').nullable();
          c.string('registryId', { length: 64 }).nullable();
          c.datetimeTz('createdAt').notNull();
          c.datetimeTz('updatedAt').notNull();
        },
      },
      {
        // An OCI image registry: its address, the namespace images go under, and write-only pull credentials (the
        // username in the clear, the password encrypted).
        name: 'relRegistries',
        definition: (c) => {
          c.string('id', { length: 64 }).primary().notNull();
          c.string('name', { length: 255 }).notNull();
          c.string('url', { length: 1024 }).notNull();
          c.string('namespace', { length: 255 }).nullable();
          c.string('pullUsername', { length: 255 }).nullable();
          c.text('secret').nullable();
          c.datetimeTz('createdAt').notNull();
          c.datetimeTz('updatedAt').notNull();
        },
      },
      {
        // An application deployed to one environment, with its runtime policy. Only an explicit removal deletes it.
        name: 'relApps',
        definition: (c) => {
          c.string('id', { length: 128 }).primary().notNull();
          c.string('environmentId', { length: 64 }).notNull();
          c.string('name', { length: 255 }).notNull();
          c.text('description').nullable();
          c.string('currentDeploymentId', { length: 36 }).nullable();
          c.boolean('enabled').notNull();
          // `eager` or `onDemand`, and the idle and dormancy timers (null: off).
          c.string('activation', { length: 16 }).notNull();
          c.integer('idleStopMinutes').nullable();
          c.double('dormantAfterHours').nullable();
          c.json('labels').notNull();
          c.string('createdBy', { length: 64 }).nullable();
          c.string('createdVia', { length: 16 }).notNull();
          c.datetimeTz('createdAt').notNull();
          c.datetimeTz('updatedAt').notNull();
          c.index(['environmentId']);
          c.index(['createdBy']);
        },
      },
      {
        // An immutable build: an uploaded (or promoted) archive, or OCI images CI pushed (an image release, no
        // archive), and the commit and build it came from when known.
        name: 'relReleases',
        definition: (c) => {
          c.string('id', { length: 36 }).primary().notNull();
          c.string('appId', { length: 128 }).notNull();
          c.string('kind', { length: 16 }).notNull();
          c.string('version', { length: 255 }).notNull();
          c.string('artifactKey', { length: 1024 }).nullable();
          c.string('checksum', { length: 64 }).notNull();
          c.bigInt('size').nullable();
          c.text('configTemplate').nullable();
          c.json('manifest').notNull();
          c.json('labels').notNull();
          c.string('sourceReleaseId', { length: 36 }).nullable();
          c.string('sourceCommit', { length: 64 }).nullable();
          c.string('build', { length: 255 }).nullable();
          c.string('createdBy', { length: 64 }).nullable();
          c.string('createdVia', { length: 16 }).notNull();
          c.datetimeTz('createdAt').notNull();
          c.index(['appId', 'createdAt']);
          c.unique(['artifactKey'], { mode: 'index' });
        },
      },
      {
        // An image release's images: one per platform, by repository and digest. A promoted release carries its
        // source's.
        name: 'relReleaseArtifacts',
        definition: (c) => {
          c.string('id', { length: 36 }).primary().notNull();
          c.string('releaseId', { length: 36 }).notNull();
          c.string('appId', { length: 128 }).notNull();
          c.string('kind', { length: 16 }).notNull();
          c.string('ref', { length: 500 }).notNull();
          c.string('digest', { length: 80 }).notNull();
          c.string('platform', { length: 64 }).notNull();
          c.string('sourceCommit', { length: 64 }).nullable();
          c.string('createdBy', { length: 64 }).nullable();
          c.string('createdVia', { length: 16 }).notNull();
          c.datetimeTz('createdAt').notNull();
          c.unique(['releaseId', 'kind', 'platform'], { mode: 'index' });
          c.index(['appId']);
        },
      },
      {
        // One release per archive and App: uploads of the same archive answer with it.
        name: 'relReleaseChecksums',
        definition: (c) => {
          c.string('appId', { length: 128 }).notNull();
          c.string('checksum', { length: 64 }).notNull();
          c.string('releaseId', { length: 36 }).notNull();
          c.string('deploymentId', { length: 36 }).nullable();
          c.string('configFingerprint', { length: 64 }).nullable();
          c.primary(['appId', 'checksum']);
        },
      },
      {
        // Idempotency keys of uploads.
        name: 'relUploadRequests',
        definition: (c) => {
          c.string('appId', { length: 128 }).notNull();
          c.string('requestKey', { length: 128 }).notNull();
          c.string('checksum', { length: 64 }).notNull();
          c.string('releaseId', { length: 36 }).notNull();
          c.primary(['appId', 'requestKey']);
        },
      },
      {
        // A deploy or rollback, with its phase, outcome and who started it.
        name: 'relDeployments',
        definition: (c) => {
          c.string('id', { length: 36 }).primary().notNull();
          c.string('appId', { length: 128 }).notNull();
          c.string('releaseId', { length: 36 }).notNull();
          c.string('kind', { length: 16 }).notNull();
          c.string('rollbackTargetDeploymentId', { length: 36 }).nullable();
          c.string('previousDeploymentId', { length: 36 }).nullable();
          c.string('status', { length: 16 }).notNull();
          c.string('phase', { length: 32 }).notNull();
          c.string('configMode', { length: 16 }).notNull();
          c.string('configPath', { length: 1024 }).nullable();
          c.text('error').nullable();
          c.string('actorId', { length: 64 }).nullable();
          c.string('actorKind', { length: 16 }).notNull();
          c.string('requestId', { length: 36 }).nullable();
          // What the target ran: `tarball`, `image` (pulled by digest) or `build` (built on the target from the
          // archive, so not the image another environment ran).
          c.string('artifactKind', { length: 16 }).nullable();
          c.string('imageRef', { length: 500 }).nullable();
          c.string('imageDigest', { length: 80 }).nullable();
          c.string('imagePlatform', { length: 64 }).nullable();
          c.datetimeTz('createdAt').notNull();
          c.datetimeTz('startedAt').nullable();
          c.datetimeTz('finishedAt').nullable();
          c.index(['appId', 'createdAt']);
          c.index(['appId', 'status']);
        },
      },
      {
        // Idempotency keys of deploy calls.
        name: 'relDeployRequests',
        definition: (c) => {
          c.string('appId', { length: 128 }).notNull();
          c.string('requestKey', { length: 128 }).notNull();
          c.string('fingerprint', { length: 64 }).notNull();
          c.string('deploymentId', { length: 36 }).notNull();
          c.primary(['appId', 'requestKey']);
        },
      },
      {
        // A proposed deployment on an environment that requires approval.
        name: 'relDeploymentRequests',
        definition: (c) => {
          c.string('id', { length: 36 }).primary().notNull();
          c.string('appId', { length: 128 }).notNull();
          c.string('environmentId', { length: 64 }).notNull();
          c.string('releaseId', { length: 36 }).notNull();
          // The release's checksum when it was asked for: approving deploys exactly these bytes, or nothing.
          c.string('releaseChecksum', { length: 128 }).notNull();
          c.string('kind', { length: 16 }).notNull();
          c.string('rollbackTargetDeploymentId', { length: 36 }).nullable();
          c.string('status', { length: 16 }).notNull();
          c.text('note').nullable();
          c.json('labels').notNull();
          c.string('requestedBy', { length: 64 }).nullable();
          c.string('requestedVia', { length: 16 }).notNull();
          c.string('decidedBy', { length: 64 }).nullable();
          c.datetimeTz('decidedAt').nullable();
          c.text('decisionNote').nullable();
          c.string('deploymentId', { length: 36 }).nullable();
          c.datetimeTz('createdAt').notNull();
          c.datetimeTz('updatedAt').notNull();
          c.index(['appId', 'status']);
          c.index(['status', 'createdAt']);
        },
      },
      {
        // A one-time upload credential, stored as a hash.
        name: 'relUploadTickets',
        definition: (c) => {
          c.string('id', { length: 36 }).primary().notNull();
          c.string('appId', { length: 128 }).notNull();
          c.string('tokenHash', { length: 64 }).notNull();
          c.boolean('deploy').notNull();
          c.datetimeTz('expiresAt').notNull();
          c.datetimeTz('usedAt').nullable();
          c.string('releaseId', { length: 36 }).nullable();
          c.string('createdBy', { length: 64 }).notNull();
          c.string('createdVia', { length: 16 }).notNull();
          c.datetimeTz('createdAt').notNull();
          c.unique(['tokenHash'], { mode: 'index' });
          c.index(['appId']);
        },
      },
    ]);
  },

  async down({ builder }) {
    for (const name of [
      'relUploadTickets',
      'relDeploymentRequests',
      'relDeployRequests',
      'relDeployments',
      'relUploadRequests',
      'relReleaseChecksums',
      'relReleaseArtifacts',
      'relReleases',
      'relApps',
      'relRegistries',
      'relEnvironments',
    ])
      await builder.dropCollection(name);
  },
});

export default migration;

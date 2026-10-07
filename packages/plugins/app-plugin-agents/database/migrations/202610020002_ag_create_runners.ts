import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020002_ag_create_runners',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A runtime: a runner on a computer, a VM or a server, which takes the work this application hands out.
        name: 'agRunners',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('name', { length: 200 }).notNull();
          collection.string('hostname', { length: 255 }).notNull();
          collection.string('os', { length: 64 }).notNull();
          collection.string('arch', { length: 64 }).notNull();
          collection.string('version', { length: 64 }).notNull();
          collection.integer('protocolVersion').notNull();
          collection.json('features').notNull().defaultTo([]);
          // As reported: each coding tool with its version, path and whether it is signed in.
          collection.json('tools').notNull().defaultTo([]);
          // The coding tools people let it run, chosen on the web; null for every tool it reports.
          collection.json('enabledTools').nullable();
          // team: runs anyone's work; ownerOnly (personal): only work its owner started.
          collection
            .enum('trust', { values: ['team', 'ownerOnly'] })
            .notNull()
            .defaultTo('ownerOnly');
          collection.string('ownerUserId', { length: 64 }).nullable();
          // upgrade_required: connected, but speaking a protocol this application does not serve.
          collection
            .enum('status', {
              values: ['online', 'offline', 'revoked', 'upgrade_required'],
            })
            .notNull()
            .defaultTo('online');
          collection.integer('slots').notNull().defaultTo(1);
          // Its owner (or a manager of runners) lets it take jobs (builds and the like); off until someone does.
          collection.boolean('acceptJobs').notNull().defaultTo(false);
          // What its owner's local policy lets it take, as it last reported it; null for anything.
          collection.json('policy').nullable();
          collection.datetimeTz('lastSeenAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['status', 'lastSeenAt']);
        },
      },
      {
        // A runner's keys, stored as hashes; each can be revoked on its own.
        name: 'agRunnerCredentials',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('runnerId', { length: 64 }).notNull();
          collection.string('keyHash', { length: 64 }).notNull();
          collection.string('keyPrefix', { length: 16 }).notNull();
          collection.datetimeTz('revokedAt').nullable();
          collection.datetimeTz('lastUsedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['keyHash']);
          collection.index(['runnerId']);
          collection
            .belongsTo('runner', 'agRunners')
            .targetKey('id')
            .foreignKey('runnerId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // One-time tokens a runner registers with.
        name: 'agRegistrationTokens',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('tokenHash', { length: 64 }).notNull();
          collection.string('createdById', { length: 64 }).nullable();
          collection
            .enum('trust', { values: ['team', 'ownerOnly'] })
            .notNull()
            .defaultTo('ownerOnly');
          // The coding tools the runner registering with it may run; null for every tool.
          collection.json('enabledTools').nullable();
          // The runner's slots; null leaves them to the runner (its `--slots`, else 1).
          collection.integer('slots').nullable();
          collection.datetimeTz('expiresAt').notNull();
          collection.datetimeTz('usedAt').nullable();
          collection.string('runnerId', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['tokenHash']);
        },
      },
      {
        // Short-lived tokens that download the CLI for one platform, and nothing else.
        name: 'agDownloadTokens',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('tokenHash', { length: 64 }).notNull();
          collection.string('createdById', { length: 64 }).nullable();
          // The platform of its first download; every later request must name the same one.
          collection.string('target', { length: 64 }).nullable();
          collection.integer('downloads').notNull().defaultTo(0);
          collection.datetimeTz('expiresAt').notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['tokenHash']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agDownloadTokens');
    await builder.dropCollection('agRegistrationTokens');
    await builder.dropCollection('agRunnerCredentials');
    await builder.dropCollection('agRunners');
  },
});

export default migration;

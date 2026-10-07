import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const STATUSES = [
  'queued',
  'dispatched',
  'running',
  'completed',
  'failed',
  'cancelled',
];

const migration: MigrationDefinition = defineMigration({
  name: '202610020009_ag_create_jobs',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A deterministic step a runner executes without a model (a build), through its attempts. Not a
        // run: no agent, no brief, no run token.
        name: 'agJobs',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The kind the application registered, and what the runner executes for it (`build`).
          collection.string('kind', { length: 64 }).notNull();
          collection.string('executor', { length: 32 }).notNull();
          collection
            .enum('status', { values: STATUSES })
            .notNull()
            .defaultTo('queued');
          collection.integer('priority').notNull().defaultTo(0);
          collection.integer('attempt').notNull().defaultTo(1);
          collection.integer('maxAttempts').notNull().defaultTo(2);
          collection.string('title', { length: 500 }).nullable();
          // What the job is for, as the application names it; never read here.
          collection.string('subjectKind', { length: 32 }).nullable();
          collection.string('subjectId', { length: 64 }).nullable();
          // Who started it, and how: a person, a rule a person configured, or an agent (recorded as who woke it).
          collection.string('actorUserId', { length: 64 }).notNull();
          collection.string('via', { length: 16 }).notNull();
          // The runners it may run on; null for any runner that fits.
          collection.json('runnerIds').nullable();
          collection.string('runnerId', { length: 64 }).nullable();
          // Every runner that held an attempt, to tell one that lost the job from one that never had it.
          collection.json('heldBy').notNull().defaultTo([]);
          // The spec as the application enqueued it: references to secrets, never their values.
          collection.json('spec').notNull();
          collection.json('requires').notNull().defaultTo([]);
          collection.json('result').nullable();
          collection.integer('exitCode').nullable();
          collection.string('sha', { length: 64 }).nullable();
          collection.datetimeTz('availableAt').nullable();
          collection.datetimeTz('leaseExpiresAt').nullable();
          collection.datetimeTz('dispatchedAt').nullable();
          collection.datetimeTz('startedAt').nullable();
          collection.datetimeTz('finishedAt').nullable();
          collection.datetimeTz('lastActivityAt').nullable();
          collection.datetimeTz('cancelRequestedAt').nullable();
          collection.string('cancelledById', { length: 64 }).nullable();
          collection.string('failureReason', { length: 32 }).nullable();
          collection.text('failureDetail').nullable();
          collection.string('workDir', { length: 1024 }).nullable();
          // Claims whose `prepare` failed; the job fails after a few.
          collection.integer('claimFailures').notNull().defaultTo(0);
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['status', 'priority', 'createdAt']);
          collection.index(['runnerId', 'status']);
          collection.index(['subjectKind', 'subjectId']);
          collection.index(['kind', 'createdAt']);
        },
      },
      {
        // A job's log: what its runner reported, once per (jobId, seq).
        name: 'agJobEvents',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('jobId', { length: 64 }).notNull();
          collection.integer('seq').notNull();
          collection.datetimeTz('at').notNull();
          collection.string('type', { length: 16 }).notNull();
          collection.string('stream', { length: 16 }).nullable();
          collection.string('phase', { length: 64 }).nullable();
          collection.text('content').nullable();
          collection.json('meta').nullable();
          collection.boolean('truncated').notNull().defaultTo(false);
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['jobId', 'seq']);
          collection
            .belongsTo('job', 'agJobs')
            .targetKey('id')
            .foreignKey('jobId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agJobEvents');
    await builder.dropCollection('agJobs');
  },
});

export default migration;

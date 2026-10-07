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
  name: '202610020003_ag_create_runs',

  async up({ builder }) {
    await builder.createCollections([
      {
        // One agent working on one subject, through its attempts.
        name: 'agRuns',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('agentId', { length: 64 }).notNull();
          // The agent's type when the run was queued (it never changes): online runs on the server, runner runs on a runner.
          collection
            .enum('agentType', { values: ['online', 'runner'] })
            .notNull()
            .defaultTo('runner');
          // The entry of the agent's list the run works with: a coding tool, its model (null: the tool's default)
          // for a runner run, written when a runner claims it; a model service and model for an online run, asked for
          // when it is queued (a conversation's choice) and settled when it is claimed.
          collection.string('tool', { length: 16 }).nullable();
          collection.string('modelService', { length: 100 }).nullable();
          collection.string('model', { length: 200 }).nullable();
          // The entry's reasoning effort; null for the tool's or provider's default.
          collection.string('effort', { length: 32 }).nullable();
          // A runner's id, or `server:<instance>` while an online run is held by an application instance.
          collection.string('runnerId', { length: 64 }).nullable();
          collection
            .enum('status', { values: STATUSES })
            .notNull()
            .defaultTo('queued');
          collection.integer('priority').notNull().defaultTo(0);
          collection.integer('attempt').notNull().defaultTo(1);
          collection.integer('maxAttempts').notNull().defaultTo(3);
          collection.string('retryOfRunId', { length: 64 }).nullable();
          // A consultation (an online agent asking another, `ask_agent`): the run that asked. Null for every other run.
          collection.string('parentRunId', { length: 64 }).nullable();
          // What the run works on, as its domain names it; the runs domain never reads the subject itself.
          collection.string('subjectKind', { length: 32 }).notNull();
          collection.string('subjectId', { length: 64 }).notNull();
          collection.string('threadScope', { length: 64 }).notNull();
          // The person whose permissions bound the run, and the person it is done for.
          collection.string('actorUserId', { length: 64 }).notNull();
          collection.string('ownerUserId', { length: 64 }).nullable();
          collection.json('requires').notNull().defaultTo([]);
          collection.boolean('acceptsInput').notNull().defaultTo(false);
          // A queued run is not claimed before this (a retry's back-off).
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
          collection.text('summary').nullable();
          collection.string('sessionId', { length: 200 }).nullable();
          collection.string('workDir', { length: 1024 }).nullable();
          // `<runnerId>:<path>` while the run works in a directory on that runner in place: one run at a time there.
          collection.string('directoryKey', { length: 1100 }).nullable();
          // Claims that could not assemble the run's payload; the run fails after a few.
          collection.integer('claimFailures').notNull().defaultTo(0);
          collection.string('payloadFingerprint', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['status', 'priority', 'createdAt']);
          collection.index([
            'agentId',
            'subjectKind',
            'subjectId',
            'threadScope',
          ]);
          collection.index(['subjectKind', 'subjectId']);
          collection.index(['runnerId', 'status']);
          collection.index(['directoryKey', 'status']);
          collection.index(['parentRunId']);
          collection
            .belongsTo('agent', 'agAgents')
            .targetKey('id')
            .foreignKey('agentId')
            .constraints(false);
        },
      },
      {
        // What a run must take into account: its triggers and anything added while it waits or works.
        name: 'agRunInputs',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('runId', { length: 64 }).notNull();
          collection.string('type', { length: 32 }).notNull();
          collection.string('actorKind', { length: 16 }).notNull();
          collection.string('actorId', { length: 64 }).notNull();
          collection.string('actorName', { length: 200 }).notNull();
          collection.text('text').notNull();
          collection.json('payload').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('deliveredAt').nullable();
          collection.datetimeTz('handledAt').nullable();
          collection.index(['runId', 'createdAt']);
          collection
            .belongsTo('run', 'agRuns')
            .targetKey('id')
            .foreignKey('runId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // The transcript: what a runner reported, once per (runId, seq).
        name: 'agRunEvents',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('runId', { length: 64 }).notNull();
          collection.integer('seq').notNull();
          collection.datetimeTz('at').notNull();
          collection.string('type', { length: 32 }).notNull();
          collection.string('tool', { length: 200 }).nullable();
          collection.text('content').nullable();
          collection.json('input').nullable();
          collection.text('output').nullable();
          collection.json('meta').nullable();
          collection.boolean('truncated').notNull().defaultTo(false);
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['runId', 'seq']);
          collection
            .belongsTo('run', 'agRuns')
            .targetKey('id')
            .foreignKey('runId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // Tokens per model; the columns match the platform's AI usage records. An online run records one row per model
        // call, with `tool` `online` and the model service it called, which prices it.
        name: 'agRunUsage',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('runId', { length: 64 }).notNull();
          collection.string('tool', { length: 16 }).notNull();
          collection.string('modelService', { length: 64 }).nullable();
          collection.string('model', { length: 200 }).nullable();
          collection.bigInt('inputTokens').notNull().defaultTo(0);
          collection.bigInt('outputTokens').notNull().defaultTo(0);
          collection.bigInt('cacheReadTokens').notNull().defaultTo(0);
          collection.bigInt('cacheWriteTokens').notNull().defaultTo(0);
          collection.bigInt('reasoningTokens').notNull().defaultTo(0);
          collection.datetimeTz('createdAt').notNull();
          collection.index(['runId']);
          collection
            .belongsTo('run', 'agRuns')
            .targetKey('id')
            .foreignKey('runId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // Run tokens, stored as hashes: valid while the run is held by the runner that claimed it.
        name: 'agRunTokens',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('tokenHash', { length: 64 }).notNull();
          collection.string('runId', { length: 64 }).notNull();
          collection.string('runnerId', { length: 64 }).notNull();
          collection.string('agentId', { length: 64 }).notNull();
          collection.string('actorUserId', { length: 64 }).notNull();
          collection.datetimeTz('expiresAt').notNull();
          collection.datetimeTz('revokedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['tokenHash']);
          collection.index(['runId']);
          collection
            .belongsTo('run', 'agRuns')
            .targetKey('id')
            .foreignKey('runId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // The branches a run reported.
        name: 'agRunRepos',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('runId', { length: 64 }).notNull();
          collection.string('url', { length: 500 }).notNull();
          collection.string('branch', { length: 255 }).notNull();
          collection.boolean('pushed').notNull().defaultTo(false);
          collection.string('headSha', { length: 64 }).nullable();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['runId', 'url']);
          collection
            .belongsTo('run', 'agRuns')
            .targetKey('id')
            .foreignKey('runId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // The brief a run's latest attempt was given, as people read it ("View brief").
        name: 'agRunBriefs',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('runId', { length: 64 }).notNull();
          collection.integer('attempt').notNull();
          collection.text('system').notNull();
          collection.text('task').notNull();
          collection.text('context').notNull();
          collection.text('agent').notNull();
          collection.text('turn').notNull();
          collection.text('prompt').notNull();
          collection.datetimeTz('createdAt').notNull();
          // One per run (replaced by each claim); the relation indexes runId.
          collection
            .belongsTo('run', 'agRuns')
            .targetKey('id')
            .foreignKey('runId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // "Clean working directory": the next claim on the subject tells the runner to start from a fresh checkout.
        name: 'agWorkspaceResets',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('subjectKind', { length: 32 }).notNull();
          collection.string('subjectId', { length: 64 }).notNull();
          collection.string('requestedById', { length: 64 }).nullable();
          collection.datetimeTz('requestedAt').notNull();
          // Set by the claim that delivered it.
          collection.string('consumedByRunId', { length: 64 }).nullable();
          collection.datetimeTz('consumedAt').nullable();
          collection.index(['subjectKind', 'subjectId', 'consumedAt']);
        },
      },
      {
        // A coding tool session a runner may resume: an optimization only.
        name: 'agSessions',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('agentId', { length: 64 }).notNull();
          collection.string('runnerId', { length: 64 }).notNull();
          collection.string('subjectKind', { length: 32 }).notNull();
          collection.string('subjectId', { length: 64 }).notNull();
          collection.string('threadScope', { length: 64 }).notNull();
          collection.string('sessionId', { length: 200 }).notNull();
          collection.string('workDir', { length: 1024 }).nullable();
          collection.string('branch', { length: 255 }).nullable();
          collection.string('fingerprint', { length: 64 }).nullable();
          collection.boolean('poisoned').notNull().defaultTo(false);
          collection.datetimeTz('updatedAt').notNull();
          collection.unique([
            'agentId',
            'runnerId',
            'subjectKind',
            'subjectId',
            'threadScope',
          ]);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agSessions');
    await builder.dropCollection('agWorkspaceResets');
    await builder.dropCollection('agRunBriefs');
    await builder.dropCollection('agRunRepos');
    await builder.dropCollection('agRunTokens');
    await builder.dropCollection('agRunUsage');
    await builder.dropCollection('agRunEvents');
    await builder.dropCollection('agRunInputs');
    await builder.dropCollection('agRuns');
  },
});

export default migration;

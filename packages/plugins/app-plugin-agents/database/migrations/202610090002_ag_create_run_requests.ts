import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

const STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'withdrawn',
  'expired',
  'superseded',
];

/**
 * Run requests: work someone asked of an agent on a subject another person answers for. It waits for that person
 * (the responsible) to confirm it before anything runs, keeping the input as it was when asked. Runs record who the
 * chain of work they belong to started with (`requestedByUserId`) and who confirmed it (`confirmedByUserId`); runs
 * queued before this migration were started by the person they run as.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610090002_ag_create_run_requests',

  async up({ builder, query }: MigrationContext): Promise<void> {
    await builder.createCollection('agRunRequests', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('agentId', { length: 64 }).notNull();
      collection.string('subjectKind', { length: 32 }).notNull();
      collection.string('subjectId', { length: 64 }).notNull();
      collection.string('threadScope', { length: 64 }).notNull();
      // Who answers for the subject (and confirms), and who the chain of work started with.
      collection.string('responsibleUserId', { length: 64 }).notNull();
      collection.string('requestedByUserId', { length: 64 }).notNull();
      // What the run is queued with once confirmed.
      collection.string('ownerUserId', { length: 64 }).nullable();
      collection.integer('priority').notNull().defaultTo(0);
      collection.json('requires').notNull().defaultTo([]);
      // When the work was to be claimed at the earliest (`fireAt`), and how many attempts it may take; null for now and
      // for the agent's default.
      collection.datetimeTz('fireAt').nullable();
      collection.integer('maxAttempts').nullable();
      // The input as it was when asked: confirming runs exactly this, whatever happens to its source later.
      collection.string('inputType', { length: 32 }).notNull();
      collection.string('inputActorKind', { length: 16 }).notNull();
      collection.string('inputActorId', { length: 64 }).notNull();
      collection.string('inputActorName', { length: 200 }).notNull();
      collection.text('inputText').notNull();
      collection.json('inputPayload').nullable();
      collection
        .enum('status', { values: STATUSES })
        .notNull()
        .defaultTo('pending');
      // Who settled it and when; null while pending (and for an expired one).
      collection.string('settledById', { length: 64 }).nullable();
      collection.datetimeTz('settledAt').nullable();
      collection.text('note').nullable();
      collection.datetimeTz('expiresAt').notNull();
      // The run it went into: on confirming, or when the requester ran it as themselves.
      collection.string('runId', { length: 64 }).nullable();
      // The request that took over when the subject's responsible changed.
      collection.string('supersededById', { length: 64 }).nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.index(['responsibleUserId', 'status'], {
        name: 'ag_run_requests_responsible_idx',
      });
      collection.index(['requestedByUserId', 'status'], {
        name: 'ag_run_requests_requested_by_idx',
      });
      collection.index(['subjectKind', 'subjectId', 'status'], {
        name: 'ag_run_requests_subject_idx',
      });
      collection.index(['status', 'expiresAt'], {
        name: 'ag_run_requests_expiry_idx',
      });
    });

    await builder.alterCollection('agRuns', (collection) => {
      // Who the chain of work started with; left nullable so the backfill below can fill existing rows.
      collection.string('requestedByUserId', { length: 64 }).nullable();
      // Who confirmed the run request the run was queued from; null for work its actor started.
      collection.string('confirmedByUserId', { length: 64 }).nullable();
    });

    // Every existing run was started by the person it runs as. One statement per such person keeps the backfill set
    // based, since an update cannot copy one column into another through `query`.
    const actors = await query
      .selectFrom('agRuns')
      .select('actorUserId')
      .distinct()
      .where('requestedByUserId', 'is', null)
      .execute();
    for (const row of actors) {
      const actorUserId = String(row.actorUserId);
      await query
        .updateTable('agRuns')
        .set({ requestedByUserId: actorUserId })
        .where('actorUserId', '=', actorUserId)
        .where('requestedByUserId', 'is', null)
        .execute();
    }
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('confirmedByUserId');
      collection.dropField('requestedByUserId');
    });
    await builder.dropCollection('agRunRequests');
  },
});

export default migration;

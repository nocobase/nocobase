import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Operation plans (`shared/plans.ts`): a short list of changes someone proposes and one person decides. A plan's rows
// are kept with it, in order; the rehearsal and execution results are stored per row as JSON. No optimistic lock: the
// plan's `revision` is raised by hand, so a conditional update can move it out of `pending` exactly once.
//
// An intake request to AI (`shared/intake-ai.ts`) is a job: the task handed to the organiser, its progress, and the
// plan of the drafts it delivered.

const migration: MigrationDefinition = defineMigration({
  name: '202610010021_pm_create_plans',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmPlans',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('title', { length: 200 }).notNull();
          collection.text('description').notNull();
          // pending, executing, executed, failed, stale, voided, expired, undone.
          collection.string('status', { length: 16 }).notNull();
          // person or superseded, when voided.
          collection.string('voidReason', { length: 16 }).nullable();
          // Where it comes from: `kind` and `key` are read (supersession, who may see it), `data` is opaque.
          collection.string('sourceKind', { length: 32 }).notNull();
          collection.string('sourceKey', { length: 200 }).nullable();
          collection.string('sourceIssueId', { length: 64 }).nullable();
          collection.json('sourceData').nullable();
          // The agent that proposed it, `{ agentId, runId, conversationId }`.
          collection.json('proposer').nullable();
          collection.string('deciderUserId', { length: 64 }).notNull();
          // A kind's key and id: a person, or `system` for a rule.
          collection.string('createdByType', { length: 32 }).notNull();
          collection.string('createdById', { length: 64 }).nullable();
          collection.integer('revision').notNull().defaultTo(1);
          // Why the last execution did not happen (`PlanFailure`).
          collection.json('failure').nullable();
          collection.datetimeTz('rehearsedAt').notNull();
          collection.datetimeTz('expiresAt').notNull();
          collection.datetimeTz('executedAt').nullable();
          collection.string('executedById', { length: 64 }).nullable();
          // An undone plan: the rows undoing it left alone (`PlanUndoSkip[]`).
          collection.json('skipped').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['deciderUserId', 'createdAt'], {
            name: 'pm_plans_decider_idx',
          });
          collection.index(['sourceKey', 'status'], {
            name: 'pm_plans_source_idx',
          });
          collection.index(['sourceIssueId'], { name: 'pm_plans_issue_idx' });
          collection.index(['status', 'expiresAt'], {
            name: 'pm_plans_expiry_idx',
          });
        },
      },
      {
        name: 'pmPlanRows',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('planId', { length: 64 }).notNull();
          // 0-based order of execution.
          collection.integer('position').notNull();
          collection.string('op', { length: 32 }).notNull();
          collection.string('ref', { length: 40 }).nullable();
          collection.json('params').notNull();
          // The latest rehearsal (`PlanRowCheck`) and, once executed, what it did (`PlanRowResult`).
          collection.json('check').nullable();
          collection.json('result').nullable();
          collection.unique(['planId', 'position'], {
            name: 'pm_plan_rows_position_unique',
          });
          collection
            .belongsTo('plan', 'pmPlans')
            .targetKey('id')
            .foreignKey('planId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        name: 'pmIntakeJobs',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The person who asked; the drafts are proposed to them.
          collection.string('userId', { length: 64 }).notNull();
          // split, revise or breakdown.
          collection.string('mode', { length: 16 }).notNull();
          // running, done, failed or cancelled.
          collection.string('status', { length: 16 }).notNull();
          collection.string('basePlanId', { length: 64 }).nullable();
          collection.string('issueId', { length: 64 }).nullable();
          collection.string('projectId', { length: 64 }).nullable();
          collection.text('instruction').nullable();
          // The uploads the drafts take along (`IntakeSourceData.fileIds`).
          collection.json('fileIds').nullable();
          // What the organiser was handed (`IntakeAiTask`).
          collection.json('task').notNull();
          // The organiser's reference to its work (for example, the run) and who works on it.
          collection.string('ref', { length: 64 }).nullable();
          collection.string('byName', { length: 200 }).nullable();
          collection.string('planId', { length: 64 }).nullable();
          // `IntakeAiChanges`, `unknownLabels`, and the `{ code, message }` of a failure.
          collection.json('changes').nullable();
          collection.json('unknownLabels').nullable();
          collection.integer('dropped').notNull().defaultTo(0);
          collection.json('error').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.datetimeTz('finishedAt').nullable();
          collection.index(['userId', 'createdAt'], {
            name: 'pm_intake_jobs_user_idx',
          });
          collection.index(['status'], { name: 'pm_intake_jobs_status_idx' });
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('pmIntakeJobs');
    await builder.dropCollection('pmPlanRows');
    await builder.dropCollection('pmPlans');
  },
});

export default migration;

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

// Agents are no longer configured by people: each coding tool and model the runners report becomes one agent, which
// someone who manages agents enables (`source` `runner`), and an application may keep agents of its own (`source`
// `system`). This migration
//
// - adds what such an agent is: where it comes from (`source`), whether it is offered work (`status`: pending, enabled
//   or disabled), its tool and normalized model, when a runner last reported them (`lastReportedAt`), and `deletedAt`
//   for an agent this version removed;
// - adds to each runner the tools and models a run failed `modelUnavailable` with there (`unavailableModels`);
// - removes every agent kept so far, online agents included: their rows stay, marked `deletedAt` and disabled, so the
//   runs, comments and conversations that name them still show their names; their queued runs are cancelled and their
//   pending run requests withdrawn, and the default chat agents that named them are cleared. Nothing is woken.
//
// `down` drops the columns again. The removed agents stay disabled (`status` is gone, but they keep the archive
// mark set here), and the cancelled runs and withdrawn requests stay as they are.
//
// Self-contained on purpose: nothing is imported from server/ or shared/.

const CANCELLED_DETAIL =
  'Cancelled: agents are discovered from what runners report now, and this agent was removed.';

const WITHDRAWN_NOTE =
  'Withdrawn: agents are discovered from what runners report now, and this agent was removed.';

const migration: MigrationDefinition = defineMigration({
  name: '202610240020_ag_runner_agents',

  async up({ builder, query }: MigrationContext): Promise<void> {
    await builder.alterCollection('agAgents', (collection) => {
      // runner: one of the coding tools and models runners report; system: kept by the application; null: kept by an
      // earlier version.
      collection.string('source', { length: 16 }).nullable();
      // pending until someone enables it; only enabled agents are offered work.
      collection
        .string('status', { length: 16 })
        .notNull()
        .defaultTo('enabled');
      collection.string('tool', { length: 16 }).nullable();
      // The model, normalized, so one tool's model reported under two spellings is one agent.
      collection.string('model', { length: 200 }).nullable();
      collection.datetimeTz('lastReportedAt').nullable();
      collection.datetimeTz('deletedAt').nullable();
      collection.index(['source', 'status'], {
        name: 'ag_agents_source_status',
      });
    });
    await builder.alterCollection('agRunners', (collection) => {
      // [{ tool, model, at, reported }]: not offered there until the runner reports the tool's models differently.
      collection.json('unavailableModels').nullable();
    });

    const now = new Date().toISOString();
    const removed = (
      await query.selectFrom('agAgents').select(['id']).execute()
    ).map((row) => String(row.id));
    if (removed.length === 0) return;
    await query
      .updateTable('agAgents')
      .set({ status: 'disabled', deletedAt: now, updatedAt: now })
      .where('deletedAt', 'is', null)
      .execute();
    await query
      .updateTable('agAgents')
      .set({ archivedAt: now })
      .where('archivedAt', 'is', null)
      .execute();
    await query
      .updateTable('agRuns')
      .set({
        status: 'cancelled',
        failureReason: 'cancelled',
        failureDetail: CANCELLED_DETAIL,
        finishedAt: now,
        updatedAt: now,
      })
      .where('status', '=', 'queued')
      .where('agentId', 'in', removed)
      .execute();
    if (await builder.hasCollection('agRunRequests'))
      await query
        .updateTable('agRunRequests')
        .set({
          status: 'withdrawn',
          settledAt: now,
          note: WITHDRAWN_NOTE,
          updatedAt: now,
        })
        .where('status', '=', 'pending')
        .where('agentId', 'in', removed)
        .execute();
    // Nobody's default names an agent any more; a new conversation goes to the system default the application sets.
    await query
      .updateTable('agChatPreferences')
      .set({ defaultAgentId: null, updatedAt: now })
      .where('defaultAgentId', 'is not', null)
      .execute();
    await query
      .updateTable('agSettings')
      .set({
        value: JSON.stringify({ defaultAgentId: null }),
        updatedAt: now,
      })
      .where('key', '=', 'chat')
      .execute();
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('unavailableModels');
    });
    await builder.dropIndex('agAgents', 'ag_agents_source_status');
    await builder.alterCollection('agAgents', (collection) => {
      collection.dropField('deletedAt');
      collection.dropField('lastReportedAt');
      collection.dropField('model');
      collection.dropField('tool');
      collection.dropField('status');
      collection.dropField('source');
    });
  },
});

export default migration;

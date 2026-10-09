import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * The two example records and the lifecycle log tables they share. The log
 * tables are spelled out here rather than taken from `@nocobase/lifecycle`:
 * a migration has to stay what it was when it was released.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610010001_lifecycle_example_create_collections',

  async up({ builder }) {
    await builder.createCollection('lifecycleExampleTickets', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('subject').notNull();
      table.text('description').notNull();
      table.string('category').notNull();
      table.string('priority').notNull();
      table.string('requesterId').notNull();
      table.string('assigneeId');
      table.string('closedReason');
      table.integer('failNotifications').notNull().defaultTo(0);
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
      table.index(['requesterId', 'id']);
    });

    await builder.createCollection('lifecycleExampleExpenses', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('title').notNull();
      table.text('purpose').notNull();
      table.json('items').notNull().defaultTo([]);
      table.bigInt('amountCents').notNull().defaultTo(0);
      table.string('applicantId').notNull();
      table.string('approverId');
      table.string('paymentRef');
      table.integer('failPayments').notNull().defaultTo(0);
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
      table.index(['approverId', 'status']);
      table.index(['applicantId', 'id']);
    });

    await builder.createCollection('lifecycleExampleTransitions', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('lifecycle').notNull();
      table.string('recordId').notNull();
      table.string('transition').notNull();
      // Null on the entry runtime.create() writes.
      table.string('from');
      table.string('to').notNull();
      table.string('actorId').notNull();
      table.json('input').notNull().defaultTo({});
      table.datetimeTz('at').notNull();
      table.integer('version').notNull();
      // The caller's request id, as it sent it; null when it sent none.
      table.string('requestId');
      // What a repeated request is found by: the request id, or a key derived
      // from the version for an entry without one. It is never null, so one
      // plain unique index means the same on every dialect, whichever way it
      // treats NULL in a unique index.
      table.string('requestKey').notNull();
      table.index(['lifecycle', 'recordId', 'id']);
      table.unique(['lifecycle', 'recordId', 'version']);
      table.unique(['lifecycle', 'recordId', 'requestKey']);
    });

    await builder.createCollection('lifecycleExampleEffectRuns', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.bigInt('transitionId').notNull();
      table.string('lifecycle').notNull();
      table.string('recordId').notNull();
      table.string('effect').notNull();
      table.boolean('stayBound').notNull();
      table.string('status').notNull();
      table.integer('attempts').notNull().defaultTo(0);
      table.integer('maxAttempts').notNull().defaultTo(1);
      table.json('result');
      table.text('error');
      table.datetimeTz('createdAt').notNull();
      table.datetimeTz('updatedAt').notNull();
      table.datetimeTz('claimedAt');
      table.datetimeTz('runAfter');
      // A continuation the outcome still has to fire, refused so far for a
      // reason a deploy can remove; null when nothing is pending.
      table.json('continuation');
      // When the sweep may try that continuation next: null exactly when
      // nothing is pending, so the sweep finds the due runs without a JSON
      // filter, those due longest first.
      table.datetimeTz('continuationDueAt');
      // When the sweep gave up on that continuation: null unless it did, so
      // an operations page finds those runs, and prune() keeps them, without
      // a JSON filter.
      table.datetimeTz('continuationAbandonedAt');
      table.index(['status', 'id']);
      table.index(['lifecycle', 'recordId', 'id']);
      table.index(['continuationDueAt']);
      table.index(['continuationAbandonedAt']);
    });
  },

  async down({ builder }) {
    await builder.dropCollection('lifecycleExampleEffectRuns');
    await builder.dropCollection('lifecycleExampleTransitions');
    await builder.dropCollection('lifecycleExampleExpenses');
    await builder.dropCollection('lifecycleExampleTickets');
  },
});

export default migration;

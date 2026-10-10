import type { CollectionDefinitionBuilder } from '@nocobase/db';

/**
 * Durable requests to resume a suspended node.
 *
 * Every node that suspends and is later resumed from outside the Processor —
 * a wait receiving an event, a run node reporting its background result —
 * writes one row here instead of owning a table of its own. The row carries the
 * instruction-defined `payload`; the engine only guarantees idempotency, a
 * single live request per node run, and consumption together with the checkpoint
 * the resumed segment commits.
 */
export function defineWorkflowResumeRequests(
  collection: CollectionDefinitionBuilder,
): void {
  collection.bigInt('id').primary().notNull();
  collection.bigInt('workflowRunId').notNull();
  collection.bigInt('nodeRunId').notNull();
  collection.string('nodeKey').notNull();
  collection.string('instructionType').notNull();
  collection.string('idempotencyKey').notNull();
  collection.json('payload');
  collection.string('payloadHash').notNull();
  // [executing ->] queued -> processing -> consumed, or rejected with a
  // `reason`. `executing` is a node's own background work in progress.
  collection.string('state').notNull();
  collection.string('reason');
  // While `executing`, how often its background work was claimed; once queued,
  // how many segments applied it and failed to commit. Past a limit the work is
  // not started again, or the request is rejected.
  collection.integer('attempts').notNull().defaultTo(0);
  // Non-null while the request is live; consumption or rejection releases it, so
  // every node run has at most one live request.
  collection.string('slot');
  collection.datetimeTz('createdAt').notNull();
  // The lease token of the worker that claimed the request. Every write after
  // the claim is conditioned on it, so a worker that lost the run cannot
  // release, reject or renew a request its successor is applying.
  collection.string('claimToken');
  collection.datetimeTz('claimedAt');
  collection.unique(['workflowRunId', 'nodeKey', 'idempotencyKey'], {
    mode: 'index',
  });
  collection.unique(['nodeRunId', 'slot'], { mode: 'index' });
  collection.index(['state', 'createdAt']);
}

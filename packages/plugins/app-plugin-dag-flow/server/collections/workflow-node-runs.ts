import type { CollectionDefinitionBuilder } from '@nocobase/db';

import { WORKFLOW_COLLECTIONS } from './names.js';

export function defineWorkflowNodeRuns(
  collection: CollectionDefinitionBuilder,
): void {
  collection.bigInt('id').primary().notNull();
  collection
    .belongsTo('workflowRun', WORKFLOW_COLLECTIONS.runs)
    .targetKey('id')
    .foreignKey('workflowRunId')
    .foreignKeyType('bigInt')
    .notNull()
    .constraints(false)
    .onDelete('cascade');
  collection
    .belongsTo('node', WORKFLOW_COLLECTIONS.nodes)
    .targetKey('id')
    .foreignKey('nodeId')
    .foreignKeyType('bigInt')
    .notNull()
    .constraints(false);
  collection.string('nodeKey').notNull();
  collection.integer('status').notNull();
  collection.json('meta');
  collection.json('result');
  collection.text('error');
  // These are instants, not wall clocks, so they are `datetimeTz`: it is the
  // only logical type whose value survives a driver that decodes timestamps
  // itself. The Repository is what applies that per dialect — see
  // `server/collections/store.ts`.
  collection.datetimeTz('startedAt').notNull();
  collection.datetimeTz('finishedAt');
  collection.datetimeTz('expiresAt');
  collection.text('log');

  collection.index(['workflowRun', 'id']);
}

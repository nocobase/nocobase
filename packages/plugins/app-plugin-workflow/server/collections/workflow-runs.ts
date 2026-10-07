import type { CollectionDefinitionBuilder } from '@nocobase/db';

import { WORKFLOW_COLLECTIONS } from './names.js';

export function defineWorkflowRuns(
  collection: CollectionDefinitionBuilder,
): void {
  collection.bigInt('id').primary().notNull();
  collection
    .belongsTo('workflow', WORKFLOW_COLLECTIONS.workflows)
    .targetKey('id')
    .foreignKey('workflowId')
    .foreignKeyType('bigInt')
    .notNull()
    .constraints(false);
  collection.string('workflowKey').notNull();
  collection.string('hash');
  collection.string('eventKey').notNull().unique({ mode: 'index' });
  collection
    .hasMany('nodeRuns', WORKFLOW_COLLECTIONS.nodeRuns)
    .sourceKey('id')
    .foreignKey('workflowRunId')
    .onDelete('cascade');
  collection.json('input').notNull().defaultTo({});
  collection.json('parameters').notNull().defaultTo({});
  collection.integer('status');
  collection.boolean('dispatched').notNull().defaultTo(false);
  collection.bigInt('parentRunId');
  collection.json('stack');
  collection.json('output');
  // These are instants, not wall clocks, so they are `datetimeTz`: it is the
  // only logical type whose value survives a driver that decodes timestamps
  // itself. The Repository is what applies that per dialect — see
  // `server/collections/store.ts`.
  collection.datetimeTz('startedAt');
  collection.datetimeTz('finishedAt');
  collection.datetimeTz('expiresAt');
  collection.datetimeTz('createdAt').notNull();
  collection.boolean('manually').notNull().defaultTo(false);
  collection.string('reason');
  collection.string('sourceType');
  collection.string('sourceId');
  collection.string('leaseToken');
  collection.datetimeTz('leaseExpiresAt');

  collection.index(['dispatched', 'id']);
  collection.index(['status', 'expiresAt']);
  collection.index(['parentRunId', 'status']);
  collection.index(['sourceType', 'sourceId']);
}

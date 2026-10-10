import type { CollectionDefinitionBuilder } from '@nocobase/db';

import { WORKFLOW_COLLECTIONS } from './names.js';

export function defineWorkflowNodes(
  collection: CollectionDefinitionBuilder,
): void {
  collection.bigInt('id').primary().autoIncrement().notNull();
  collection.string('key').notNull();
  collection.string('title');
  collection.text('description');
  collection
    .belongsTo('workflow', WORKFLOW_COLLECTIONS.workflows)
    .targetKey('id')
    .foreignKey('workflowId')
    .foreignKeyType('bigInt')
    .notNull()
    .constraints(false)
    .onDelete('cascade');
  collection.string('upstreamKey');
  collection
    .hasMany('branches', WORKFLOW_COLLECTIONS.nodes)
    .sourceKey('key')
    .foreignKey('upstreamKey');
  collection.string('branchKey');
  collection.string('downstreamKey');
  collection.string('type').notNull();
  collection.json('config').notNull().defaultTo({});
  collection.json('options').notNull().defaultTo({});

  collection.unique(['workflow', 'key'], { mode: 'index' });
}

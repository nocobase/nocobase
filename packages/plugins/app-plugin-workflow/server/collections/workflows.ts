import type { CollectionDefinitionBuilder } from '@nocobase/db';

import { WORKFLOW_COLLECTIONS } from './names.js';

export function defineWorkflows(collection: CollectionDefinitionBuilder): void {
  collection.bigInt('id').primary().autoIncrement().notNull();
  collection.string('key').notNull();
  collection.string('hash');
  collection.string('version');
  collection.string('title');
  collection.boolean('enabled').notNull().defaultTo(false);
  collection.text('description');
  collection.json('inputSchema').notNull().defaultTo({ type: 'object' });
  collection.json('parametersSchema').notNull().defaultTo({});
  collection.json('parameterValues').notNull().defaultTo({});
  collection.json('client').notNull().defaultTo({});
  collection
    .hasMany('nodes', WORKFLOW_COLLECTIONS.nodes)
    .sourceKey('id')
    .foreignKey('workflowId')
    .onDelete('cascade');
  collection
    .hasMany('runs', WORKFLOW_COLLECTIONS.runs)
    .sourceKey('id')
    .foreignKey('workflowId');
  collection.boolean('current');
  collection
    .hasMany('revisions', WORKFLOW_COLLECTIONS.workflows)
    .foreignKey('key')
    .sourceKey('key')
    .constraints(false)
    .onDelete('no action');
  collection.json('options').notNull().defaultTo({ timeout: 0 });
  collection
    .hasOne('stats', WORKFLOW_COLLECTIONS.stats)
    .foreignKey('key')
    .sourceKey('key')
    .constraints(false);
  collection
    .hasOne('versionStats', WORKFLOW_COLLECTIONS.versionStats)
    .foreignKey('id')
    .sourceKey('id')
    .constraints(false)
    .onDelete('cascade');

  // Keep this as a unique index, matching the legacy MySQL deadlock workaround.
  collection.unique(['key', 'current'], { mode: 'index' });
}

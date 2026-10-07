import {
  defineMigration,
  type CollectionDefinitionBuilder,
  type MigrationContext,
} from '@nocobase/db';

/**
 * Run and node run ids are allocated by the engine from the application's
 * snowflake service before a row exists, so the rows of one Processor segment
 * can be built in memory and inserted together at its checkpoint. Both columns
 * keep their type and primary key and stop generating values themselves.
 *
 * Generation cannot be switched off in place on every dialect — SQLite's
 * `AUTOINCREMENT` and SQL Server's `IDENTITY` are part of the column — and a
 * Collection another one targets can be neither renamed nor dropped while the
 * relation stands. The two tables are therefore detached, dropped and created
 * again. Their rows are not carried over: Workflow has not had a stable release,
 * so existing run history is discarded rather than copied through
 * dialect-specific statements, and the resume requests that pointed at the
 * dropped rows are cleared with them.
 *
 * `down` performs the same rebuild towards database-generated ids, and likewise
 * starts from empty tables.
 */

type IdMode = 'application' | 'database';

function defineRuns(
  collection: CollectionDefinitionBuilder,
  mode: IdMode,
): void {
  const id = collection.bigInt('id').primary().notNull();
  if (mode === 'database') id.autoIncrement();
  collection
    .belongsTo('workflow', 'workflows')
    .targetKey('id')
    .foreignKey('workflowId')
    .foreignKeyType('bigInt')
    .notNull()
    .constraints(false);
  collection.string('workflowKey').notNull();
  collection.string('hash');
  collection.string('eventKey').notNull().unique({ mode: 'index' });
  collection.json('input').notNull().defaultTo({});
  collection.json('parameters').notNull().defaultTo({});
  collection.integer('status');
  collection.boolean('dispatched').notNull().defaultTo(false);
  collection.bigInt('parentRunId');
  collection.json('stack');
  collection.json('output');
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

function defineNodeRuns(
  collection: CollectionDefinitionBuilder,
  mode: IdMode,
): void {
  const id = collection.bigInt('id').primary().notNull();
  if (mode === 'database') id.autoIncrement();
  collection
    .belongsTo('workflowRun', 'workflowRuns')
    .targetKey('id')
    .foreignKey('workflowRunId')
    .foreignKeyType('bigInt')
    .notNull()
    .constraints(false)
    .onDelete('cascade');
  collection
    .belongsTo('node', 'workflowNodes')
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
  collection.datetimeTz('startedAt').notNull();
  collection.datetimeTz('finishedAt');
  collection.datetimeTz('expiresAt');
  collection.text('log');

  collection.index(['workflowRun', 'id']);
}

async function rebuild(context: MigrationContext, mode: IdMode): Promise<void> {
  const { builder } = context;
  await context.query
    .deleteFrom('workflowResumeRequests')
    .allowAllRows()
    .execute();

  await builder.alterCollection('workflowRuns', (collection) => {
    collection.dropField('nodeRuns');
  });
  await builder.alterCollection('workflows', (collection) => {
    collection.dropField('runs');
  });
  await builder.dropCollection('workflowNodeRuns');
  await builder.dropCollection('workflowRuns');

  await builder.createCollection('workflowRuns', (collection) =>
    defineRuns(collection, mode),
  );
  await builder.createCollection('workflowNodeRuns', (collection) =>
    defineNodeRuns(collection, mode),
  );
  await builder.alterCollection('workflowRuns', (collection) => {
    collection
      .hasMany('nodeRuns', 'workflowNodeRuns')
      .sourceKey('id')
      .foreignKey('workflowRunId')
      .onDelete('cascade');
  });
  await builder.alterCollection('workflows', (collection) => {
    collection
      .hasMany('runs', 'workflowRuns')
      .sourceKey('id')
      .foreignKey('workflowId');
  });
}

export default defineMigration({
  name: '202610010001_workflow_application_ids',
  async up(context): Promise<void> {
    await rebuild(context, 'application');
  },
  async down(context): Promise<void> {
    await rebuild(context, 'database');
  },
});

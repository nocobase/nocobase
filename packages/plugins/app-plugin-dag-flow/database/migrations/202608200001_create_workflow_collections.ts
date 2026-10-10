import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202608200001_create_workflow_collections',

  async up({ builder }): Promise<void> {
    await builder.createCollection('workflows', (collection) => {
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
      collection
        .hasMany('nodes', 'workflowNodes')
        .sourceKey('id')
        .foreignKey('workflowId')
        .onDelete('cascade');
      collection
        .hasMany('runs', 'workflowRuns')
        .sourceKey('id')
        .foreignKey('workflowId');
      collection.boolean('current');
      collection
        .hasMany('revisions', 'workflows')
        .foreignKey('key')
        .sourceKey('key')
        .constraints(false)
        .onDelete('no action');
      collection.json('options').notNull().defaultTo({ timeout: 0 });
      collection
        .hasOne('stats', 'workflowStats')
        .foreignKey('key')
        .sourceKey('key')
        .constraints(false);
      collection
        .hasOne('versionStats', 'workflowVersionStats')
        .foreignKey('id')
        .sourceKey('id')
        .constraints(false)
        .onDelete('cascade');

      collection.unique(['key', 'current'], { mode: 'index' });
    });

    await builder.createCollection('workflowStats', (collection) => {
      collection.string('key').primary().notNull();
      collection.bigInt('executed').notNull().defaultTo(0);
    });

    await builder.createCollection('workflowVersionStats', (collection) => {
      collection.bigInt('id').primary().notNull();
      collection.bigInt('executed').notNull().defaultTo(0);
    });

    await builder.createCollection('workflowNodes', (collection) => {
      collection.bigInt('id').primary().autoIncrement().notNull();
      collection.string('key').notNull();
      collection.string('title');
      collection.text('description');
      collection
        .belongsTo('workflow', 'workflows')
        .targetKey('id')
        .foreignKey('workflowId')
        .foreignKeyType('bigInt')
        .notNull()
        .constraints(false)
        .onDelete('cascade');
      collection.string('upstreamKey');
      collection
        .hasMany('branches', 'workflowNodes')
        .sourceKey('key')
        .foreignKey('upstreamKey');
      collection.string('branchKey');
      collection.string('downstreamKey');
      collection.string('type').notNull();
      collection.json('config').notNull().defaultTo({});
      collection.json('options').notNull().defaultTo({});

      collection.unique(['workflow', 'key'], { mode: 'index' });
    });

    await builder.createCollection('workflowRuns', (collection) => {
      collection.bigInt('id').primary().autoIncrement().notNull();
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
      collection
        .hasMany('nodeRuns', 'workflowNodeRuns')
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
      collection.datetime('startedAt');
      collection.datetime('finishedAt');
      collection.datetime('expiresAt');
      collection.datetime('createdAt').notNull();
      collection.boolean('manually').notNull().defaultTo(false);
      collection.string('reason');

      collection.index(['dispatched', 'id']);
      collection.index(['status', 'expiresAt']);
      collection.index(['parentRunId', 'status']);
    });

    await builder.createCollection('workflowNodeRuns', (collection) => {
      collection.bigInt('id').primary().autoIncrement().notNull();
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
      collection.datetime('startedAt').notNull();
      collection.datetime('finishedAt');
      collection.datetime('expiresAt');
      collection.text('log');

      collection.index(['workflowRun', 'id']);
    });
  },

  async down({ builder }): Promise<void> {
    await builder.dropCollection('workflowNodeRuns');
    await builder.dropCollection('workflowRuns');
    await builder.dropCollection('workflowNodes');
    await builder.dropCollection('workflowVersionStats');
    await builder.dropCollection('workflowStats');
    await builder.dropCollection('workflows');
  },
});

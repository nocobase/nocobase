import {
  defineMigration,
  type CollectionDefinitionBuilder,
  type MigrationDefinition,
} from '@nocobase/db';

/** The columns every lifecycle record carries. */
function stateColumns(table: CollectionDefinitionBuilder): void {
  table.string('status').notNull();
  table.datetimeTz('statusChangedAt').notNull();
  table.integer('lifecycleVersion').notNull().defaultTo(0);
  table.datetimeTz('createdAt').notNull();
  table.index(['status', 'statusChangedAt']);
}

/** The three kinds of incoming-document task share one shape. */
function taskColumns(table: CollectionDefinitionBuilder): void {
  table.bigInt('id').primary().autoIncrement().notNull();
  table.string('number').notNull();
  table.bigInt('rootId').notNull();
  table.bigInt('parentId').notNull();
  table.bigInt('assignmentId');
  table.string('departmentName').notNull();
  table.json('assignees').notNull().defaultTo([]);
  table.json('ccHeads').notNull().defaultTo([]);
  table.json('ccLeaders').notNull().defaultTo([]);
  table.json('signedBy').notNull().defaultTo([]);
  table.string('decision');
  table.text('opinion');
  table.boolean('redHeadFeedback');
  table.string('outgoingRef');
  table.json('attachments').notNull().defaultTo([]);
  table.text('feedback');
  stateColumns(table);
  table.index(['rootId']);
  table.index(['parentId']);
}

const migration: MigrationDefinition = defineMigration({
  name: '202610010001_office_flows_example_create_collections',

  async up({ builder }) {
    await builder.createCollection('officeFlowsDataRequests', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('number').notNull();
      table.string('applicantId').notNull();
      table.string('subject').notNull();
      table.text('reason').notNull();
      table.string('volume').notNull();
      table.string('frequency').notNull();
      table.string('deliveryDate');
      table.string('firstUseDate');
      table.string('lastDeliveryDate');
      table.integer('quarterDay');
      table.integer('monthDay');
      table.integer('weekDay');
      table.string('frequencyNote');
      table.string('scope').notNull();
      table.json('consumers').notNull().defaultTo([]);
      table.boolean('fileShieldAccepted');
      table.string('fileShieldScope');
      table.boolean('fileShieldCopy');
      table.string('fileShieldValidUntil');
      table.json('ndaFiles').notNull().defaultTo([]);
      table.json('securityFiles').notNull().defaultTo([]);
      table.string('approverId');
      table.datetimeTz('acceptedAt');
      table.text('returnReason');
      stateColumns(table);
    });

    await builder.createCollection('officeFlowsExtractions', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('number').notNull();
      table.bigInt('requestId').notNull();
      table.string('periodKey').notNull();
      table.string('origin').notNull();
      table.string('scheduledDate').notNull();
      table.string('topic').notNull();
      table.text('requirement');
      table.json('executorIds').notNull().defaultTo([]);
      table.string('category');
      table.string('complexity');
      table.string('agreedDeliveryAt');
      table.string('sourceSystem');
      table.boolean('needsDownload');
      table.text('feedbackNote');
      table.json('feedbackFiles').notNull().defaultTo([]);
      table.string('reviewerId');
      table.string('managerId');
      table.string('confirmerId');
      table.text('voidReason');
      stateColumns(table);
      table.unique(['requestId', 'periodKey'], { mode: 'index' });
    });

    await builder.createCollection('officeFlowsIncoming', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('number').notNull();
      table.string('title').notNull();
      table.string('code').notNull();
      table.string('sender').notNull();
      table.string('senderRef').notNull();
      table.text('summary').notNull();
      table.text('officeOpinion').notNull();
      table.json('attachments').notNull().defaultTo([]);
      table.string('distributionType').notNull();
      table.string('registrarId').notNull();
      table.string('officeHeadId').notNull();
      table.string('officeLeaderId').notNull();
      table.boolean('ccManagement').notNull().defaultTo(false);
      table.text('returnReason');
      stateColumns(table);
    });

    await builder.createCollection('officeFlowsAssignments', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.bigInt('rootId').notNull();
      table.string('parentKind').notNull();
      table.bigInt('parentId').notNull();
      table.integer('level').notNull();
      table.string('departmentName').notNull();
      table.boolean('includeClerks').notNull().defaultTo(true);
      table.boolean('includeHeads').notNull().defaultTo(false);
      table.boolean('includeLeaders').notNull().defaultTo(false);
      table.json('assignees').notNull().defaultTo([]);
      table.json('ccHeads').notNull().defaultTo([]);
      table.json('ccLeaders').notNull().defaultTo([]);
      table.string('origin');
      table.boolean('dispatched').notNull().defaultTo(false);
      table.bigInt('childId');
      table.string('createdBy').notNull();
      table.datetimeTz('createdAt').notNull();
      table.index(['parentKind', 'parentId']);
    });

    await builder.createCollection('officeFlowsManagementCc', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.bigInt('incomingId').notNull();
      table.string('groupName').notNull();
      table.json('members').notNull().defaultTo([]);
      table.boolean('fromConfig').notNull().defaultTo(true);
      table.boolean('forwarded').notNull().defaultTo(false);
      table.datetimeTz('createdAt').notNull();
      table.index(['incomingId']);
    });

    await builder.createCollection('officeFlowsClerkTasks', taskColumns);
    await builder.createCollection('officeFlowsTeamTasks', taskColumns);
    await builder.createCollection('officeFlowsExecutorTasks', taskColumns);

    // Query task ownership through scalar columns on every supported dialect.
    // Task ids are scoped by kind because each kind has its own collection.
    await builder.createCollection('officeFlowsTaskAssignees', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('kind').notNull();
      table.bigInt('taskId').notNull();
      table.string('personId').notNull();
      table.unique(['personId', 'kind', 'taskId'], { mode: 'index' });
    });

    await builder.createCollection('officeFlowsDepartments', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('name').notNull().unique({ mode: 'index' });
      table.json('clerks').notNull().defaultTo([]);
      table.json('heads').notNull().defaultTo([]);
      table.json('leaders').notNull().defaultTo([]);
      table.integer('sort').notNull().defaultTo(0);
    });

    await builder.createCollection('officeFlowsManagementGroups', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('name').notNull();
      table.json('members').notNull().defaultTo([]);
      table.integer('sort').notNull().defaultTo(0);
    });

    await builder.createCollection('officeFlowsHolidays', (table) => {
      table.string('date').primary().notNull();
      table.string('kind').notNull();
      table.string('name').notNull();
    });

    await builder.createCollection('officeFlowsSerials', (table) => {
      table.string('key').primary().notNull();
      table.integer('value').notNull().defaultTo(0);
    });

    await builder.createCollection('officeFlowsNotices', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('rootKind').notNull();
      table.bigInt('rootId').notNull();
      table.string('level').notNull();
      table.string('recipient').notNull();
      table.text('message').notNull();
      table.string('sourceKind').notNull();
      table.bigInt('sourceId').notNull();
      table.datetimeTz('createdAt').notNull();
      table.unique(['rootKind', 'rootId', 'level', 'recipient'], {
        mode: 'index',
      });
      table.index(['recipient', 'id']);
    });

    await builder.createCollection('officeFlowsTraces', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('docKind').notNull();
      table.bigInt('docId').notNull();
      table.string('actorId').notNull();
      table.string('action').notNull();
      table.json('detail').notNull().defaultTo({});
      table.datetimeTz('at').notNull();
      // An effect writes its trace under its run's key, so a retry cannot
      // write it twice.
      table.string('key').notNull();
      table.unique(['key'], { mode: 'index' });
      table.index(['docKind', 'docId', 'id']);
    });

    await builder.createCollection('officeFlowsTransitions', (table) => {
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

    await builder.createCollection('officeFlowsEffectRuns', (table) => {
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
    for (const name of [
      'officeFlowsEffectRuns',
      'officeFlowsTransitions',
      'officeFlowsTraces',
      'officeFlowsNotices',
      'officeFlowsSerials',
      'officeFlowsHolidays',
      'officeFlowsManagementGroups',
      'officeFlowsDepartments',
      'officeFlowsTaskAssignees',
      'officeFlowsExecutorTasks',
      'officeFlowsTeamTasks',
      'officeFlowsClerkTasks',
      'officeFlowsManagementCc',
      'officeFlowsAssignments',
      'officeFlowsIncoming',
      'officeFlowsExtractions',
      'officeFlowsDataRequests',
    ])
      await builder.dropCollection(name);
  },
});

export default migration;

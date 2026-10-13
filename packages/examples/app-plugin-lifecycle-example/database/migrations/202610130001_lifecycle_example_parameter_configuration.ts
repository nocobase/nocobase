import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610130001_lifecycle_example_parameter_configuration',
  async up(context) {
    const { builder } = context;
    await builder.createCollection(
      'lifecycleExampleParameterHeads',
      (table) => {
        table.string('id', { length: 64 }).primary().notNull();
        table.string('scope').notNull();
        table.string('groupKey').notNull();
        table.string('status').notNull();
        table.integer('revision').notNull();
        table.unique(['scope', 'groupKey']);
      },
    );
    await builder.createCollection(
      'lifecycleExampleParameterVersions',
      (table) => {
        table.string('id', { length: 64 }).primary().notNull();
        table.json('payload').notNull();
        table.json('selectionCounts').notNull();
      },
    );
    await builder.createCollection(
      'lifecycleExampleParameterSelections',
      (table) => {
        table.string('id', { length: 64 }).primary().notNull();
        table.string('versionId', { length: 64 }).notNull();
        table.string('ruleKey').notNull();
        table.integer('group').notNull();
        table.string('type').notNull();
        table.string('referenceId').notNull();
        table.index(['versionId']);
      },
    );
    await builder.createCollection(
      'lifecycleExampleParameterRequests',
      (table) => {
        table.string('id', { length: 64 }).primary().notNull();
        table.string('actorId').notNull();
        table.text('fingerprint').notNull();
        table.integer('revision').notNull();
      },
    );
    await builder.createCollection(
      'lifecycleExampleParameterSnapshots',
      (table) => {
        table.string('id', { length: 64 }).primary().notNull();
        table.json('payload').notNull();
      },
    );
    await builder.createCollection(
      'lifecycleExampleParameterUsages',
      (table) => {
        table.string('id', { length: 64 }).primary().notNull();
        table.json('payload').notNull();
        table.string('recordKey', { length: 64 }).notNull();
        table.datetimeTz('at').notNull();
        table.index(['recordKey', 'at', 'id']);
      },
    );
    await builder.alterCollection('lifecycleExampleExpenses', (table) => {
      table.integer('parameterContract').nullable();
    });
    await builder.createCollection('lifecycleExampleDepartments', (table) => {
      table.string('id').primary().notNull();
      table.string('scope').notNull();
      table.string('name').notNull();
    });
    await builder.createCollection('lifecycleExampleRoles', (table) => {
      table.string('id').primary().notNull();
      table.string('scope').notNull();
      table.string('name').notNull();
    });
    await builder.createCollection('lifecycleExamplePeople', (table) => {
      table.string('id').primary().notNull();
      table.string('scope').notNull();
      table.string('name').notNull();
      table.boolean('active').notNull();
    });
    await builder.createCollection('lifecycleExampleMemberships', (table) => {
      table.string('id').primary().notNull();
      table.string('scope').notNull();
      table.string('userId').notNull();
      table.string('departmentId').notNull();
      table.string('roleId').notNull();
    });
    await builder.createCollection('lifecycleExampleReviewerDemo', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('applicantId').notNull();
      table.json('candidates').notNull().defaultTo([]);
      table.string('decidedBy');
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
    });
    await builder.createCollection(
      'lifecycleExampleReviewerLiveDemo',
      (table) => {
        table.bigInt('id').primary().autoIncrement().notNull();
        table.string('applicantId').notNull();
        table.json('candidates').notNull().defaultTo([]);
        table.string('decidedBy');
        table.string('status').notNull();
        table.datetimeTz('statusChangedAt').notNull();
        table.integer('lifecycleVersion').notNull().defaultTo(0);
        table.datetimeTz('createdAt').notNull();
      },
    );
    // Repository encoding keeps boolean values portable across supported dialects.
    for (const values of [
      { id: 'finance-one', scope: 'demo', name: 'Finance One' },
      { id: 'finance-two', scope: 'demo', name: 'Finance Two' },
    ])
      await context
        .repository('lifecycleExampleDepartments')
        .createOne({ values });
    for (const values of [
      { id: 'reviewer', scope: 'demo', name: 'Reviewer' },
      { id: 'manager', scope: 'demo', name: 'Manager' },
    ])
      await context.repository('lifecycleExampleRoles').createOne({ values });
    for (const values of [
      { id: 'lin', scope: 'demo', name: 'Lin', active: true },
      { id: 'he', scope: 'demo', name: 'He', active: true },
      { id: 'zhao', scope: 'demo', name: 'Zhao', active: true },
      { id: 'sun', scope: 'demo', name: 'Sun', active: true },
      { id: 'chen', scope: 'demo', name: 'Chen', active: true },
      { id: 'wang', scope: 'demo', name: 'Wang', active: true },
      {
        id: 'disabled',
        scope: 'demo',
        name: 'Inactive reviewer',
        active: false,
      },
    ])
      await context.repository('lifecycleExamplePeople').createOne({ values });
    for (const values of [
      {
        id: 'zhao-finance',
        scope: 'demo',
        userId: 'zhao',
        departmentId: 'finance-one',
        roleId: 'reviewer',
      },
      {
        id: 'sun-finance',
        scope: 'demo',
        userId: 'sun',
        departmentId: 'finance-two',
        roleId: 'reviewer',
      },
      {
        id: 'chen-finance',
        scope: 'demo',
        userId: 'chen',
        departmentId: 'finance-two',
        roleId: 'manager',
      },
      {
        id: 'disabled-finance',
        scope: 'demo',
        userId: 'disabled',
        departmentId: 'finance-two',
        roleId: 'reviewer',
      },
    ])
      await context
        .repository('lifecycleExampleMemberships')
        .createOne({ values });
  },
  async down({ builder }) {
    await builder.dropCollection('lifecycleExampleReviewerLiveDemo');
    await builder.dropCollection('lifecycleExampleReviewerDemo');
    await builder.dropCollection('lifecycleExampleMemberships');
    await builder.dropCollection('lifecycleExamplePeople');
    await builder.dropCollection('lifecycleExampleRoles');
    await builder.dropCollection('lifecycleExampleDepartments');
    await builder.alterCollection('lifecycleExampleExpenses', (table) => {
      table.dropField('parameterContract');
    });
    await builder.dropCollection('lifecycleExampleParameterUsages');
    await builder.dropCollection('lifecycleExampleParameterSnapshots');
    await builder.dropCollection('lifecycleExampleParameterRequests');
    await builder.dropCollection('lifecycleExampleParameterSelections');
    await builder.dropCollection('lifecycleExampleParameterVersions');
    await builder.dropCollection('lifecycleExampleParameterHeads');
  },
});
export default migration;

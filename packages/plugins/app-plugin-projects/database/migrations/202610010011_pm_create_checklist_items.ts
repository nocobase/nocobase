import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The checklists issues get when they enter a status with a checklist: a copy of the items per issue and status, so
// a later change to the workflow leaves the items an issue already has (and whether they are checked) as they are.

const migration: MigrationDefinition = defineMigration({
  name: '202610010011_pm_create_checklist_items',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmIssueChecklistItems',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('statusKey', { length: 32 }).notNull();
          collection.string('itemKey', { length: 64 }).notNull();
          collection.string('label', { length: 200 }).notNull();
          collection.boolean('required').notNull().defaultTo(false);
          collection.integer('position').notNull().defaultTo(0);
          collection.string('checkedByType', { length: 32 }).nullable();
          collection.string('checkedById', { length: 64 }).nullable();
          collection.datetimeTz('checkedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['issueId', 'statusKey', 'itemKey']);
          collection
            .belongsTo('issue', 'pmIssues')
            .targetKey('id')
            .foreignKey('issueId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('pmIssueChecklistItems');
  },
});

export default migration;

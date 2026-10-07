import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Which issue waits for which: `blockedBy` holds an issue until the other is finished, `relatedTo` only links them.

const migration: MigrationDefinition = defineMigration({
  name: '202610010013_pm_create_issue_dependencies',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmIssueDependencies',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The issue that waits (or refers).
          collection.string('issueId', { length: 64 }).notNull();
          // The issue it waits for.
          collection.string('dependsOnIssueId', { length: 64 }).notNull();
          // `blockedBy` or `relatedTo`.
          collection.string('type', { length: 16 }).notNull();
          // A kind's key (`shared/kinds.ts`).
          collection.string('createdByType', { length: 32 }).notNull();
          collection.string('createdById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['issueId', 'dependsOnIssueId', 'type']);
          collection.index(['dependsOnIssueId', 'type']);
          collection
            .belongsTo('issue', 'pmIssues')
            .targetKey('id')
            .foreignKey('issueId')
            .constraints(true)
            .onDelete('cascade');
          collection
            .belongsTo('dependsOn', 'pmIssues')
            .targetKey('id')
            .foreignKey('dependsOnIssueId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('pmIssueDependencies');
  },
});

export default migration;

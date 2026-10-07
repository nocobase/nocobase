import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609300004_pm_create_issues',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmIssues',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.integer('number').notNull();
          collection.string('identifier', { length: 32 }).notNull();
          collection.string('title', { length: 500 }).notNull();
          collection.text('description').notNull();
          collection.string('statusKey', { length: 32 }).notNull();
          collection
            .enum('priority', {
              values: ['urgent', 'high', 'medium', 'low', 'none'],
            })
            .notNull()
            .defaultTo('none');
          // The priority as a number (urgent 0 … none 4), so the list can be ordered by it.
          collection.integer('priorityRank').notNull().defaultTo(4);
          collection.string('ownerUserId', { length: 64 }).notNull();
          // A kind's key (`shared/kinds.ts`); null with executorId when nobody works on the issue.
          collection.string('executorType', { length: 32 }).nullable();
          collection.string('executorId', { length: 64 }).nullable();
          collection.string('parentIssueId', { length: 64 }).nullable();
          // The batch among its siblings: a lower stage finishes first. Only sub-issues have one; null takes no part.
          collection.integer('stage').nullable();
          collection.string('projectId', { length: 64 }).nullable();
          collection.date('startDate').nullable();
          collection.date('dueDate').nullable();
          collection.integer('revision').notNull().defaultTo(1);
          collection.optimisticLock('revision');
          collection.string('createdById', { length: 64 }).nullable();
          collection.datetimeTz('lastActivityAt').notNull();
          collection.datetimeTz('deletedAt').nullable();
          collection.string('deletedById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['identifier']);
          collection.index(['projectId', 'statusKey']);
          collection.index(['parentIssueId', 'stage']);
          collection.index(['updatedAt']);
          collection
            .belongsTo('owner', 'user')
            .targetKey('id')
            .foreignKey('ownerUserId')
            .constraints(false);
          collection
            .belongsTo('project', 'pmProjects')
            .targetKey('id')
            .foreignKey('projectId')
            .constraints(false);
          collection
            .belongsTo('parent', 'pmIssues')
            .targetKey('id')
            .foreignKey('parentIssueId')
            .constraints(false);
          collection
            .belongsToMany('labels', 'pmLabels')
            .through('pmIssueLabels')
            .sourceKey('id')
            .foreignKey('issueId')
            .otherKey('labelId')
            .targetKey('id')
            .constraints(false);
        },
      },
      {
        // Which labels an issue carries. Deleting a label removes its links.
        name: 'pmIssueLabels',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('labelId', { length: 64 }).notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['issueId', 'labelId']);
          collection
            .belongsTo('issue', 'pmIssues')
            .targetKey('id')
            .foreignKey('issueId')
            .constraints(true)
            .onDelete('cascade');
          collection
            .belongsTo('label', 'pmLabels')
            .targetKey('id')
            .foreignKey('labelId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // One row per change to an issue: the issue timeline.
        name: 'pmActivities',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('actorType', { length: 32 }).notNull();
          collection.string('actorId', { length: 64 }).nullable();
          collection.string('action', { length: 64 }).notNull();
          collection.json('details').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.index(['issueId', 'createdAt']);
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
    await builder.dropCollection('pmActivities');
    await builder.dropCollection('pmIssueLabels');
    await builder.dropCollection('pmIssues');
  },
});

export default migration;

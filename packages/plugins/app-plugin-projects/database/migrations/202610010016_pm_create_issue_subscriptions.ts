import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Who follows an issue and why. Unsubscribing keeps the row with `unsubscribedAt`, so being mentioned or commenting
// later does not follow the issue again; becoming its owner or following it by hand does.

const migration: MigrationDefinition = defineMigration({
  name: '202610010016_pm_create_issue_subscriptions',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmIssueSubscriptions',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('userId', { length: 64 }).notNull();
          // creator, owner, executor, commenter, mentioned or manual.
          collection.string('reason', { length: 16 }).notNull();
          collection.datetimeTz('unsubscribedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['issueId', 'userId'], {
            name: 'pm_issue_subscriptions_unique',
          });
          collection.index(['userId'], {
            name: 'pm_issue_subscriptions_user_idx',
          });
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
    await builder.dropCollection('pmIssueSubscriptions');
  },
});

export default migration;

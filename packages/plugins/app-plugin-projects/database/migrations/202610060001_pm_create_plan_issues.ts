import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The issues a plan touches besides its source issue: those its rows change, comment on, link or put a new issue
// under, recorded when it is stored or edited, and the issues it created once executed. `GET /plans?issueId=` lists
// a plan on each of them.

const migration: MigrationDefinition = defineMigration({
  name: '202610060001_pm_create_plan_issues',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmPlanIssues',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('planId', { length: 64 }).notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.unique(['planId', 'issueId'], {
            name: 'pm_plan_issues_unique',
          });
          collection.index(['issueId'], { name: 'pm_plan_issues_issue_idx' });
          collection
            .belongsTo('plan', 'pmPlans')
            .targetKey('id')
            .foreignKey('planId')
            .constraints(true)
            .onDelete('cascade');
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
    await builder.dropCollection('pmPlanIssues');
  },
});

export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610240012_pm_issue_acceptance',
  async up({ builder }) {
    await builder.alterCollection('pmIssues', (collection) => {
      collection.text('acceptance').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('pmIssues', (collection) => {
      collection.dropField('acceptance');
    });
  },
});

export default migration;

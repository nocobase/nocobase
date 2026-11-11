import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611110001_pm_issue_assignee_indexes',
  async up({ builder }) {
    await builder.addIndex('pmIssues', {
      name: 'idx_pm_issues_executor',
      fields: ['executorType', 'executorId'],
    });
  },
  async down({ builder }) {
    await builder.dropIndex('pmIssues', 'idx_pm_issues_executor');
  },
});
export default migration;

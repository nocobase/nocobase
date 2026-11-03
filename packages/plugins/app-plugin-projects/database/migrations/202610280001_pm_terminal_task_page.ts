import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610280001_pm_terminal_task_page',
  async up({ builder }) {
    await builder.addIndex('pmIssues', {
      name: 'idx_pm_issues_terminal_page',
      fields: ['statusKey', 'deletedAt', 'updatedAt', 'id'],
    });
  },
  async down({ builder }) {
    await builder.dropIndex('pmIssues', 'idx_pm_issues_terminal_page');
  },
});
export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610090001_pm_add_executor_tool',
  async up({ builder }) {
    await builder.alterCollection('pmIssues', (collection) => {
      collection.string('executorTool', { length: 128 });
      collection.string('executorToolSource', { length: 16 });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('pmIssues', (collection) => {
      collection.dropField('executorToolSource');
      collection.dropField('executorTool');
    });
  },
});

export default migration;

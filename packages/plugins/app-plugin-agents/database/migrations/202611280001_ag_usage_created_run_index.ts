import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611280001_ag_usage_created_run_index',
  async up({ builder }) {
    await builder.alterCollection('agRunUsage', (collection) => {
      collection.index(['createdAt', 'runId'], {
        name: 'ag_usage_created_run',
      });
    });
  },
  async down({ builder }) {
    await builder.dropIndex('agRunUsage', 'ag_usage_created_run');
  },
});

export default migration;

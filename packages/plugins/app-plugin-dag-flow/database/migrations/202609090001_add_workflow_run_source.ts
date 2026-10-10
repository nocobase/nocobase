import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609090001_add_workflow_run_source',
  async up({ builder }) {
    await builder.alterCollection('workflowRuns', (collection) => {
      collection.string('sourceType');
      collection.string('sourceId');
      collection.index(['sourceType', 'sourceId'], {
        name: 'workflow_runs_source_idx',
      });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('workflowRuns', (collection) => {
      collection.dropField('sourceId');
      collection.dropField('sourceType');
    });
  },
});

export default migration;

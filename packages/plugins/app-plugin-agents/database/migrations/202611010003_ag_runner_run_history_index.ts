import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611010003_ag_runner_run_history_index',
  async up({ builder }) {
    await builder.alterCollection('agRuns', (collection) => {
      collection.index(['runnerId', 'startedAt', 'id'], {
        name: 'ag_runs_runner_started_id',
      });
    });
  },
  async down({ builder }) {
    await builder.dropIndex('agRuns', 'ag_runs_runner_started_id');
  },
});

export default migration;

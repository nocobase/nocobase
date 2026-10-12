import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610120001_ag_index_run_retries',
  async up({ builder }) {
    await builder.alterCollection('agRuns', (collection) => {
      // Older installations can contain multiple historical retries. Preserve
      // those rows; the retry transaction prevents new duplicate relationships.
      collection.index(['retryOfRunId'], { name: 'ag_runs_retry_of' });
    });
  },
  async down({ builder }) {
    await builder.dropIndex('agRuns', 'ag_runs_retry_of');
  },
});

export default migration;

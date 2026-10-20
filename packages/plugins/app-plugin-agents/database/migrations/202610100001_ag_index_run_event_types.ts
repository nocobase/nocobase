import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610100001_ag_index_run_event_types',
  async up({ builder }) {
    await builder.alterCollection('agRunEvents', (collection) => {
      collection.index(['runId', 'type', 'seq'], {
        name: 'ag_run_events_run_type_seq',
      });
    });
  },
  async down({ builder }) {
    await builder.dropIndex('agRunEvents', 'ag_run_events_run_type_seq');
  },
});

export default migration;

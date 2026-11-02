import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610160004_office_flows_workflow_parameters',
  async up({ builder }) {
    await builder.createCollection('officeFlowsWorkflowParameters', (table) => {
      table.string('id').primary().notNull();
      table.integer('revision').notNull();
      table.json('values').notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('officeFlowsWorkflowParameters');
  },
});
export default migration;

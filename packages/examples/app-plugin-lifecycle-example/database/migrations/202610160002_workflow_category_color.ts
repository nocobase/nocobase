import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610160002_workflow_category_color',
  async up({ builder }) {
    await builder.alterCollection(
      'lifecycleExampleWorkflowCategories',
      (table) => {
        table.string('color').notNull().defaultTo('gray');
      },
    );
  },
  async down({ builder }) {
    await builder.alterCollection(
      'lifecycleExampleWorkflowCategories',
      (table) => {
        table.dropField('color');
      },
    );
  },
});
export default migration;

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610160001_lifecycle_example_workflow_catalog',
  async up({ builder }) {
    await builder.createCollection(
      'lifecycleExampleWorkflowCategories',
      (table) => {
        table.string('id').primary().notNull();
        table.string('title').notNull();
        table.integer('sortOrder').notNull().defaultTo(0);
      },
    );
    await builder.createCollection(
      'lifecycleExampleWorkflowCatalog',
      (table) => {
        table.string('id').primary().notNull();
        table.string('categoryId');
        table
          .belongsTo('category', 'lifecycleExampleWorkflowCategories')
          .targetKey('id')
          .foreignKey('categoryId')
          .constraints(true)
          .onDelete('set null');
      },
    );
  },
  async down({ builder }) {
    await builder.dropCollection('lifecycleExampleWorkflowCatalog');
    await builder.dropCollection('lifecycleExampleWorkflowCategories');
  },
});

export default migration;

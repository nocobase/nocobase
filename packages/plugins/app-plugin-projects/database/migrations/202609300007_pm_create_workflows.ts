import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Workflows and the project's choice of one. The plugin ships no workflow: until one is created or a template
// installed, every project uses the built-in statuses (`BUILTIN_STATUSES` in `shared/workflows.ts`).

const migration: MigrationDefinition = defineMigration({
  name: '202609300007_pm_create_workflows',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmWorkflows',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('name', { length: 100 }).notNull();
          collection.text('description').nullable();
          collection.boolean('isDefault').notNull().defaultTo(false);
          collection.string('builtInKey', { length: 64 }).nullable();
          collection.json('definition').notNull();
          collection.integer('revision').notNull().defaultTo(1);
          collection.optimisticLock('revision');
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['name']);
        },
      },
    ]);
    await builder.alterCollection('pmProjects', (collection) => {
      // Null: the default workflow.
      collection.string('workflowId', { length: 64 }).nullable();
    });
  },

  async down({ builder }) {
    await builder.alterCollection('pmProjects', (collection) => {
      collection.dropField('workflowId');
    });
    await builder.dropCollection('pmWorkflows');
  },
});

export default migration;

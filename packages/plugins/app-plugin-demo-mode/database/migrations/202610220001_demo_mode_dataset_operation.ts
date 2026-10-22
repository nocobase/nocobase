import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610220001_demo_mode_dataset_operation',
  async up({ builder }) {
    await builder.alterCollection('demoModeDatasets', (collection) => {
      // `import`, `clear` or `reset`; existing rows have none until their next lifecycle claim.
      collection.string('operation', { length: 16 });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('demoModeDatasets', (collection) => {
      collection.dropField('operation');
    });
  },
});

export default migration;

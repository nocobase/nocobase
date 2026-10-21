import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610210004_demo_mode_operation_lease',
  async up({ builder }) {
    await builder.alterCollection('demoModeDatasets', (collection) => {
      // Existing snapshots have no owner; their next lifecycle claim assigns one.
      collection.string('operationId', { length: 36 });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('demoModeDatasets', (collection) => {
      collection.dropField('operationId');
    });
  },
});

export default migration;

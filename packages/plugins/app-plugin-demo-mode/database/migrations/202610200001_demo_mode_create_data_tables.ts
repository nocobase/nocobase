import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610200001_demo_mode_create_data_tables',
  async up({ builder }) {
    // One row per registered dataset while it is imported, being cleared, or left behind by a failed import.
    await builder.createCollection('demoModeDatasets', (collection) => {
      collection.string('id', {
        length: 64,
        primaryKey: true,
        nullable: false,
      });
      collection.string('state', { length: 16, nullable: false });
      collection.string('language', { length: 16 });
      collection.string('actorId', { length: 64 });
      collection.integer('percent', { nullable: false, defaultValue: 0 });
      collection.json('data');
      collection.json('failure');
      collection.text('modelKey');
      collection.string('modelService', { length: 128 });
      collection.datetimeTz('createdAt', { nullable: false });
      collection.datetimeTz('updatedAt', { nullable: false });
      collection.datetimeTz('finishedAt');
    });
    // Every row, account and setting an import created, removed again when the demo is cleared.
    await builder.createCollection('demoModeRecords', (collection) => {
      collection.string('datasetId', { length: 64, nullable: false });
      collection.string('collection', { length: 128, nullable: false });
      collection.string('recordId', { length: 255, nullable: false });
      collection.string('keyField', { length: 64, nullable: false });
      collection.integer('ordinal', { nullable: false });
      collection.datetimeTz('createdAt', { nullable: false });
      collection.primary(['datasetId', 'collection', 'recordId'], {
        name: 'pk_demo_mode_records',
      });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('demoModeRecords');
    await builder.dropCollection('demoModeDatasets');
  },
});

export default migration;

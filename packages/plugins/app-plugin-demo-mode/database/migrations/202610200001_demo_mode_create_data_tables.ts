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
      // The lease of the import or clear under way; status updates are conditional on it.
      collection.string('operationId', { length: 36 });
      // `import`, `clear` or `reset`.
      collection.string('operation', { length: 16 });
      collection.string('language', { length: 16 });
      collection.string('actorId', { length: 64 });
      collection.integer('percent', { nullable: false, defaultValue: 0 });
      collection.json('data');
      collection.json('failure');
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
    // Ownership survives clearing, which disables accounts instead of deleting them. `passwordHash` is a salted
    // snapshot of the last password applied, so a reset keeps sessions while the password stays the same.
    await builder.createCollection('demoModeAccounts', (collection) => {
      collection.string('userId', {
        length: 64,
        primaryKey: true,
        nullable: false,
      });
      collection.string('datasetId', { length: 64, nullable: false });
      collection.string('passwordHash', { length: 128, nullable: false });
    });
    await builder.createCollection('demoModeConfiguration', (collection) => {
      collection.string('id', {
        length: 32,
        primaryKey: true,
        nullable: false,
      });
      collection.integer('revision', { nullable: false, defaultValue: 0 });
      collection.json('value');
      collection.string('lastDay', { length: 16 });
    });
    // The simulated model service, which belongs to the environment and survives every clear and reset.
    await builder.createCollection('demoModeModel', (collection) => {
      collection.string('id', {
        length: 64,
        primaryKey: true,
        nullable: false,
      });
      collection.text('modelKey', { nullable: false });
      collection.string('modelService', { length: 128 });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('demoModeModel');
    await builder.dropCollection('demoModeConfiguration');
    await builder.dropCollection('demoModeAccounts');
    await builder.dropCollection('demoModeRecords');
    await builder.dropCollection('demoModeDatasets');
  },
});

export default migration;

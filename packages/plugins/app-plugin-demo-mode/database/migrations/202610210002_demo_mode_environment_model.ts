import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610210002_demo_mode_environment_model',
  async up({ builder }) {
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
  },
});
export default migration;

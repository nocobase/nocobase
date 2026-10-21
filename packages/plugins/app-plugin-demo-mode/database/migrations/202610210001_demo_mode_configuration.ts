import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610210001_demo_mode_configuration',
  async up({ builder }) {
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
  },
  async down({ builder }) {
    await builder.dropCollection('demoModeConfiguration');
  },
});

export default migration;

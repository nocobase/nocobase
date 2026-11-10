import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '001_records',
  async up({ builder }) {
    await builder.createCollection('moduleRecords', (c) => {
      c.string('id', { primaryKey: true });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('moduleRecords');
  },
});
export default migration;

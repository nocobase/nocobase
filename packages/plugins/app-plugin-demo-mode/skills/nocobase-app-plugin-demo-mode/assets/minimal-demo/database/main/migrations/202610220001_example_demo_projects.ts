import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610220001_example_demo_projects',
  async up({ builder }) {
    await builder.createCollection('demoprojects', (table) => {
      table.string('id', { primaryKey: true, nullable: false });
      table.string('title', { nullable: false });
      table.string('ownerId', { nullable: false });
      table.datetime('createdAt', { nullable: false });
    });
    await builder.createCollection('demotasks', (table) => {
      table.string('id', { primaryKey: true, nullable: false });
      table.string('projectId', { nullable: false });
      table.string('title', { nullable: false });
      table.string('assigneeId', { nullable: false });
      table.string('state', { nullable: false });
      table.datetime('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('demotasks');
    await builder.dropCollection('demoprojects');
  },
});
export default migration;

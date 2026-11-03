import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610170001_ag_runner_quota',
  async up({ builder }) {
    await builder.alterCollection('agRunners', (collection) => {
      collection.json('quotaUsage').nullable();
      collection.integer('quotaRevision').notNull().defaultTo(0);
    });
  },
  async down({ builder }) {
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('quotaUsage');
      collection.dropField('quotaRevision');
    });
  },
});
export default migration;

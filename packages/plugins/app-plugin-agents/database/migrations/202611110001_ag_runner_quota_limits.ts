import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202611110001_ag_runner_quota_limits',
  async up({ builder }) {
    await builder.alterCollection('agRunners', (collection) => {
      collection.json('quotaLimits').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('quotaLimits');
    });
  },
});
export default migration;

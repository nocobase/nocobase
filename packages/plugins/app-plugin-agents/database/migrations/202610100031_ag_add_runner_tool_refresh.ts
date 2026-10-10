import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610100031_ag_add_runner_tool_refresh',
  async up({ builder }): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.string('toolsRefreshRequestId', { length: 64 }).nullable();
    });
  },
  async down({ builder }): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('toolsRefreshRequestId');
    });
  },
});
export default migration;

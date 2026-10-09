import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610090003_ag_add_execution_history',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.json('executionHistory').nullable();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('executionHistory');
    });
  },
});

export default migration;

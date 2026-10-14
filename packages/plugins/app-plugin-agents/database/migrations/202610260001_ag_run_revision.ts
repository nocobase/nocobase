import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610260001_ag_run_revision',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.integer('revision').notNull().defaultTo(1);
      collection.optimisticLock('revision');
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.clearOptimisticLock();
      collection.dropField('revision');
    });
  },
});

export default migration;

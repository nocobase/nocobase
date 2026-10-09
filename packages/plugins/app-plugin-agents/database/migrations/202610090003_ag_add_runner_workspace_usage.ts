import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * The working directories a runner last reported for this application and the disk they take (`workspaceUsage`): the
 * totals, the owner's limit and each directory with its subject and whether its work is over. Null until the runner
 * reports.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610090003_ag_add_runner_workspace_usage',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.json('workspaceUsage').nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('workspaceUsage');
    });
  },
});

export default migration;

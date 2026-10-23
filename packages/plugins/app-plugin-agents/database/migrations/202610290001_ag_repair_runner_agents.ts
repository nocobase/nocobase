import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/** Runner agents use status as their state; clear stale archives and require them to be enabled again. */
const migration: MigrationDefinition = defineMigration({
  name: '202610290001_ag_repair_runner_agents',
  async up({ query }: MigrationContext): Promise<void> {
    await query
      .updateTable('agAgents')
      .set({
        status: 'pending',
        archivedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where('source', '=', 'runner')
      .where('archivedAt', 'is not', null)
      .execute();
  },
  // The repair is permanent; rolling back the release must not restore a broken agent state.
  async down(): Promise<void> {},
});

export default migration;

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/** Freeze the previously implicit native-tool choice before expanding the tool catalog. */
const migration: MigrationDefinition = defineMigration({
  name: '202610280001_ag_explicit_runner_tools',
  async up({ query }: MigrationContext): Promise<void> {
    const enabledTools = ['claude', 'codex', 'opencode', 'pi'];
    await query
      .updateTable('agRunners')
      .set({ enabledTools })
      .where('enabledTools', 'is', null)
      .execute();
    await query
      .updateTable('agRegistrationTokens')
      .set({ enabledTools })
      .where('enabledTools', 'is', null)
      .execute();
  },
  // Explicit selections are also understood by the previous version; retain them on rollback.
  async down(): Promise<void> {},
});
export default migration;

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

function entriesAreEmpty(value: unknown): boolean {
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return true;
    }
  }
  return !Array.isArray(value) || value.length === 0;
}

function defaultEffort(tool: string): string | null {
  // Keep the migration self-contained: these runner tools support the package's initial `medium` choice.
  return ['claude', 'codex', 'opencode', 'pi'].includes(tool) ? 'medium' : null;
}

/** Clear stale runner markers and fill missing model entries without changing agent status. */
const migration: MigrationDefinition = defineMigration({
  name: '202610290001_ag_repair_runner_agents',
  async up({ query }: MigrationContext): Promise<void> {
    const agents = await query
      .selectFrom('agAgents')
      .select([
        'id',
        'tool',
        'model',
        'modelEntries',
        'archivedAt',
        'deletedAt',
      ])
      .where('source', '=', 'runner')
      .execute();
    if (agents.length === 0) return;

    const now = new Date().toISOString();
    if (
      agents.some(
        (agent) => agent.archivedAt !== null || agent.deletedAt !== null,
      )
    ) {
      await query
        .updateTable('agAgents')
        .set({ archivedAt: null, deletedAt: null, updatedAt: now })
        .where('source', '=', 'runner')
        .where((eb) =>
          eb.or([
            eb('archivedAt', 'is not', null),
            eb('deletedAt', 'is not', null),
          ]),
        )
        .execute();
    }

    for (const agent of agents) {
      if (
        !entriesAreEmpty(agent.modelEntries) ||
        typeof agent.tool !== 'string'
      )
        continue;
      await query
        .updateTable('agAgents')
        .set({
          modelEntries: [
            {
              tool: agent.tool,
              model: agent.model,
              effort: defaultEffort(agent.tool),
            },
          ],
          updatedAt: now,
        })
        .where('id', '=', agent.id)
        .execute();
    }
  },
  // The repair is permanent; rolling back the release must not restore broken agent data.
  async down(): Promise<void> {},
});

export default migration;

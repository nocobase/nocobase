import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/** Legacy models are never inferred or rewritten. Only unclaimed work is held for configuration. */
const migration: MigrationDefinition = defineMigration({
  name: '202610210002_ag_wait_for_explicit_models',
  async up({ builder, query }): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.boolean('modelPending').notNull().defaultTo(false);
    });
    const agents = await query
      .selectFrom('agAgents')
      .select(['id', 'modelEntries'])
      .where('type', '=', 'runner')
      .execute();
    const ready = new Set(
      agents
        .filter((agent) => {
          let entries: unknown = agent.modelEntries;
          if (typeof entries === 'string') {
            try {
              entries = JSON.parse(entries) as unknown;
            } catch {
              return false;
            }
          }
          return (
            Array.isArray(entries) &&
            entries.some((entry: unknown) => {
              if (!entry || typeof entry !== 'object') return false;
              const row = entry as Record<string, unknown>;
              return (
                ['claude', 'codex', 'opencode', 'pi'].includes(
                  String(row.tool),
                ) &&
                typeof row.model === 'string' &&
                row.model.trim().length > 0
              );
            })
          );
        })
        .map((agent) => String(agent.id)),
    );
    const runs = await query
      .selectFrom('agRuns')
      .select(['id', 'agentId'])
      .where('agentType', '=', 'runner')
      .where('status', '=', 'queued')
      .execute();
    for (const run of runs) {
      if (!ready.has(String(run.agentId)))
        await query
          .updateTable('agRuns')
          .set({ modelPending: true })
          .where('id', '=', run.id)
          .execute();
    }
  },
  async down({ builder, query }): Promise<void> {
    // Dropping a field can rebuild the parent table and cascade-delete run children on some drivers.
    // A populated execution history must be upgraded forward, never rolled back destructively.
    const [run] = await query
      .selectFrom('agRuns')
      .select('id')
      .limit(1)
      .execute();
    if (run)
      throw new Error(
        'Cannot roll back explicit model configuration while run records exist. Use a forward migration.',
      );
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('modelPending');
    });
  },
});
export default migration;

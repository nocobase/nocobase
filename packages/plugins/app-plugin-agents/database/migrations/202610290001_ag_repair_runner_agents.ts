import { randomUUID } from 'node:crypto';

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/** Runner agents use status as their state; clear stale archives and require them to be enabled again. */
const migration: MigrationDefinition = defineMigration({
  name: '202610290001_ag_repair_runner_agents',
  async up({ query }: MigrationContext): Promise<void> {
    const archived = await query
      .selectFrom('agAgents')
      .select(['id', 'status', 'revision'])
      .where('source', '=', 'runner')
      .where('archivedAt', 'is not', null)
      .execute();
    if (archived.length === 0) return;

    const now = new Date().toISOString();
    await query
      .updateTable('agAgents')
      .set({
        status: 'pending',
        archivedAt: null,
        updatedAt: now,
      })
      .where('source', '=', 'runner')
      .where('archivedAt', 'is not', null)
      .execute();

    const statusChanges = archived
      .filter((agent) => agent.status !== 'pending')
      .map((agent) => ({
        id: randomUUID(),
        agentId: String(agent.id),
        revision: Number(agent.revision),
        action: 'restored',
        actorUserId: null,
        changes: [
          {
            field: 'status',
            before: agent.status,
            after: 'pending',
          },
        ],
        createdAt: now,
      }));
    // Keep the portable insert below SQLite's bind-parameter limit.
    for (let offset = 0; offset < statusChanges.length; offset += 100) {
      await query
        .insertInto('agAgentChanges')
        .values(statusChanges.slice(offset, offset + 100))
        .execute();
    }
  },
  // The repair is permanent; rolling back the release must not restore a broken agent state.
  async down(): Promise<void> {},
});

export default migration;

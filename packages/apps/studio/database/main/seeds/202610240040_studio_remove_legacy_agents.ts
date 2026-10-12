import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Agents are discovered from what runners report now, and the project manager is the application's own. The earlier
// seeds still write Studio's former built-in agents on a new installation; this seed removes them right after, the way
// the agents plugin's `202610240020_ag_runner_agents` removed them on an upgrade: each row is kept for the names in its
// history, marked deleted and disabled, and the default chat agents that named one are cleared. On an upgraded
// installation the migration already did this, and nothing is left to change.
//
// Self-contained on purpose: nothing is imported from server/ or shared/.

const seed: SeedDefinition = defineSeed({
  name: '202610240040_studio_remove_legacy_agents',
  transaction: true,
  async run(context) {
    const { query } = context;
    // Without the agents plugin's collections there is nothing to remove. A missing Collection is reported before any
    // SQL runs, so probing leaves the transaction usable.
    try {
      await context.repository('agAgents').exists();
    } catch (error) {
      if (
        error instanceof Error &&
        Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
      )
        return;
      throw error;
    }
    // An agent written before agents had a source is a former one; a discovered or system agent has its source.
    const removed = (
      await query
        .selectFrom('agAgents')
        .select('id')
        .where('source', 'is', null)
        .where('deletedAt', 'is', null)
        .execute()
    ).map((row) => String(row.id));
    if (removed.length === 0) return;
    const now = new Date().toISOString();
    await query
      .updateTable('agAgents')
      .set({
        status: 'disabled',
        deletedAt: now,
        archivedAt: now,
        updatedAt: now,
      })
      .where('id', 'in', removed)
      .execute();
    await query
      .updateTable('agChatPreferences')
      .set({ defaultAgentId: null, updatedAt: now })
      .where('defaultAgentId', 'in', removed)
      .execute();
    const chat = await query
      .selectFrom('agSettings')
      .select('value')
      .where('key', '=', 'chat')
      .executeTakeFirst();
    const value: unknown =
      typeof chat?.value === 'string'
        ? (JSON.parse(chat.value) as unknown)
        : chat?.value;
    const named: unknown =
      value && typeof value === 'object'
        ? Reflect.get(value, 'defaultAgentId')
        : null;
    if (typeof named === 'string' && removed.includes(named))
      await query
        .updateTable('agSettings')
        .set({
          value: JSON.stringify({ defaultAgentId: null }),
          updatedAt: now,
        })
        .where('key', '=', 'chat')
        .execute();
  },
});

export default seed;

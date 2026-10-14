import { defineSeed, type SeedDefinition } from '@nocobase/db';

// The order of Studio's built-in agents in the agents list, which shows the application's own agents in the order they
// were created: the design and review roles first, then the developers, then the project lead and the assistant. The
// earlier seeds created them in another order, and the five role agents at the same moment.
//
// A seed rather than a migration: migrations run before seeds, so on a new installation a migration would find none of
// these agents, while a pending seed runs on an installed database too and, on a new one, after the seeds that create
// them. Each agent present gets a fixed creation time, a second apart in the wanted order; a missing one is skipped,
// and a replay writes the same values.
//
// Self-contained on purpose: nothing is imported from server/ or shared/.

const ORDER = [
  'studio-solution-designer',
  'studio-proposal-reviewer',
  'studio-frontend-designer',
  'studio-senior-developer',
  'studio-developer',
  'studio-code-reviewer',
  'studio-project-lead',
  'studio-project-assistant',
];

const BASE = Date.parse('2026-10-01T00:00:00.000Z');

const seed: SeedDefinition = defineSeed({
  name: '202610100040_studio_builtin_agents_order',
  transaction: true,
  async run(context) {
    // `repository`, because `createdAt` is a timezone-aware datetime whose encoding differs by dialect.
    const agents = context.repository('agAgents');
    try {
      await agents.exists();
    } catch (error) {
      if (
        error instanceof Error &&
        Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
      )
        return;
      throw error;
    }
    for (const [index, id] of ORDER.entries()) {
      if (!(await agents.exists({ filter: { id } }))) continue;
      await agents.updateOne({
        filter: { id },
        values: { createdAt: new Date(BASE + index * 1000).toISOString() },
      });
    }
  },
});

export default seed;

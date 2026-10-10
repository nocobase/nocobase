// @vitest-environment node
/**
 * The built-in agents' order: once the seeds create them, the order seed gives them creation times in the order the
 * agents list shows them, skips the ones missing, and writes the same times when it runs again.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import builtInAgents from '../../database/main/seeds/202610010030_studio_builtin_agents.js';
import order from '../../database/main/seeds/202610100040_studio_builtin_agents_order.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { makeRoot, runRoleAgentsSeed } from './role-agents.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

const WANTED = [
  'studio-solution-designer',
  'studio-proposal-reviewer',
  'studio-frontend-designer',
  'studio-senior-developer',
  'studio-developer',
  'studio-code-reviewer',
  'studio-project-lead',
  'studio-project-assistant',
];

async function run(seed: typeof order): Promise<void> {
  const conn = h.database.connection();
  await seed.run({
    query: conn.query,
    repository: (name: string) => conn.repository(name),
    config: { get: () => undefined },
  } as never);
}

/** The agents' ids by creation time, as the agents list orders the application's own. */
async function byCreation(): Promise<string[]> {
  const agents = await h.agents.agents.list();
  return [...agents]
    .sort(
      (a, b) =>
        Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
        a.id.localeCompare(b.id),
    )
    .map((agent) => agent.id);
}

describe('the built-in agents order seed', () => {
  it('does nothing without agents', async () => {
    await run(order);
    expect(await h.agents.agents.list()).toEqual([]);
  });

  it('orders the built-in agents, the same way when it runs again', async () => {
    await makeRoot(h, 'root-1');
    await run(builtInAgents);
    await runRoleAgentsSeed(h);
    await run(order);
    expect(await byCreation()).toEqual(WANTED);
    const designer = await h.agents.agents.get('studio-solution-designer');
    expect(new Date(designer.createdAt).toISOString()).toBe(
      '2026-10-01T00:00:00.000Z',
    );
    await run(order);
    expect(await byCreation()).toEqual(WANTED);
  });

  it('skips the agents that are missing', async () => {
    await makeRoot(h, 'root-1');
    await runRoleAgentsSeed(h);
    await run(order);
    expect(await byCreation()).toEqual(
      WANTED.filter(
        (id) =>
          id !== 'studio-project-lead' && id !== 'studio-project-assistant',
      ),
    );
  });
});

// @vitest-environment node
/**
 * Studio's former built-in agents on a new installation: the earlier seeds still write them, and
 * `202610240040_studio_remove_legacy_agents` removes them right after, clearing the chat defaults that name them and
 * leaving the agents discovered from runners and the application's own alone.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import builtInAgents from '../../database/main/seeds/202610010030_studio_builtin_agents.js';
import coordinator from '../../database/main/seeds/202610100030_studio_project_lead_coordinator.js';
import order from '../../database/main/seeds/202610100040_studio_builtin_agents_order.js';
import removeLegacy from '../../database/main/seeds/202610240040_studio_remove_legacy_agents.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { makeRoot, runRoleAgentsSeed } from './role-agents.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

async function run(seed: typeof removeLegacy): Promise<void> {
  const conn = h.database.connection();
  await seed.run({
    query: conn.query,
    repository: (name: string) => conn.repository(name),
    config: { get: () => undefined },
  } as never);
}

async function preferOf(userId: string, agentId: string): Promise<void> {
  await h.database
    .connection()
    .repository('agChatPreferences')
    .createOne({
      values: { userId, defaultAgentId: agentId, updatedAt: new Date() },
    });
}

describe('the legacy agents seed', () => {
  it('removes the former built-in agents and the chat defaults naming them, after the old seeds', async () => {
    const coder = await h.createAgent({ name: 'Coder' });
    await makeRoot(h, 'root-1');
    await run(builtInAgents);
    await runRoleAgentsSeed(h);
    await run(coordinator);
    await run(order);
    const seeded = (await h.agents.agents.list()).map((agent) => agent.id);
    expect(seeded).toContain('studio-project-lead');
    // As the built-in seed makes it on an installation whose chat default nobody chose.
    await h.agents.chat.updateSettings('root-1', {
      defaultAgentId: 'studio-project-assistant',
    });
    await preferOf('alice', 'studio-project-lead');
    await preferOf('bob', coder);

    await run(removeLegacy);

    const left = (await h.agents.agents.list()).map((agent) => agent.id);
    expect(left.sort()).toEqual([coder, PROJECT_MANAGER_ID].sort());
    // Kept for the names in their history, deleted and disabled.
    const lead = await h.agents.agents.find(
      h.database.connection(),
      'studio-project-lead',
    );
    expect(lead).toMatchObject({ status: 'disabled' });
    expect(
      (
        await h.agents.agents.names(h.database.connection(), [
          'studio-project-lead',
        ])
      ).get('studio-project-lead'),
    ).toBe('Project lead');
    expect((await h.agents.chat.settings()).defaultAgentId).toBeNull();
    expect(await h.agents.chat.preferences('alice')).toEqual({
      defaultAgentId: null,
    });
    expect(await h.agents.chat.preferences('bob')).toEqual({
      defaultAgentId: coder,
    });
    // The project manager and the discovered agent are untouched.
    expect(await h.agents.agents.get(PROJECT_MANAGER_ID)).toMatchObject({
      source: 'system',
      status: 'enabled',
    });
    expect(await h.agents.agents.get(coder)).toMatchObject({
      source: 'runner',
      status: 'enabled',
    });
  });

  it('changes nothing when no former agent is left', async () => {
    const coder = await h.createAgent();
    await h.agents.chat.updateSettings('root-1', { defaultAgentId: coder });
    await run(removeLegacy);
    await run(removeLegacy);
    expect((await h.agents.chat.settings()).defaultAgentId).toBe(coder);
    expect(
      (await h.agents.agents.list()).map((agent) => agent.id).sort(),
    ).toEqual([coder, PROJECT_MANAGER_ID].sort());
  });
});

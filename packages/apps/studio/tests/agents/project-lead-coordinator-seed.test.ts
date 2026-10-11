// @vitest-environment node
/**
 * The project lead as a coordinator on a new installation: once the built-in agents seed writes it, the coordinator
 * seed gives it the preset's configuration with explicit models; a replay, or a project lead someone changed, is left
 * alone.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import builtInAgents from '../../database/main/seeds/202610010030_studio_builtin_agents.js';
import coordinator from '../../database/main/seeds/202610100030_studio_project_lead_coordinator.js';
import { PROJECT_LEAD } from '../../server/agents/catalog/presets.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { makeRoot } from './role-agents.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

async function run(seed: typeof coordinator): Promise<void> {
  const conn = h.database.connection();
  await seed.run({
    query: conn.query,
    repository: (name: string) => conn.repository(name),
    config: { get: () => undefined },
  } as never);
}

describe('the project lead coordinator seed', () => {
  it('does nothing without a project lead', async () => {
    await run(coordinator);
    expect(await h.agents.agents.list()).toEqual([]);
  });

  it('makes the newly seeded project lead a coordinator, once', async () => {
    await makeRoot(h, 'root-1');
    await run(builtInAgents);
    await run(coordinator);
    const lead = await h.agents.agents.get('studio-project-lead');
    expect(lead).toMatchObject({
      modelEntries: [
        { tool: 'claude', model: 'claude-sonnet-5', effort: 'medium' },
        { tool: 'codex', model: 'gpt-6-luna', effort: 'medium' },
      ],
      instructions: PROJECT_LEAD.instructions,
      description: PROJECT_LEAD.description,
      // Still translated where it is shown.
      descriptionText: {
        key: 'studioAgents.presets.projectLead.description',
        ns: '@nocobase/i18n/application',
      },
      revision: 2,
    });
    expect([...lead.actions].sort()).toEqual([...PROJECT_LEAD.actions].sort());
    expect(lead.actions).not.toContain('studio.git/open-pr');
    expect(lead.actions).not.toContain('studio.previews/manage');
    expect(await h.agents.agents.history('studio-project-lead')).toEqual([
      expect.objectContaining({ action: 'updated', revision: 2 }),
      expect.objectContaining({ action: 'created', revision: 1 }),
    ]);
    // A replay changes nothing.
    await run(coordinator);
    expect(await h.agents.agents.get('studio-project-lead')).toMatchObject({
      revision: 2,
    });
  });

  it('leaves a project lead someone changed as it is', async () => {
    await makeRoot(h, 'root-1');
    await run(builtInAgents);
    await h.agents.agents.update('studio-project-lead', 'root-1', {
      name: 'Lead',
      expectedRevision: 1,
    });
    await run(coordinator);
    const lead = await h.agents.agents.get('studio-project-lead');
    expect(lead).toMatchObject({ name: 'Lead', revision: 2 });
    expect(lead.actions).toContain('studio.git/open-pr');
  });
});

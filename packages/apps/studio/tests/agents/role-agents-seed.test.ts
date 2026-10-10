// @vitest-environment node
/**
 * Studio's built-in role agents: the seeds give an installation a solution designer, a proposal reviewer, a senior
 * developer, a developer and a code reviewer, then a frontend designer, each with explicit models and its own run limit,
 * owned by the initial administrator, and add nothing when they run again. The presets the new-agent dialog offers say
 * the same.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  PRESETS,
  ROLE_AGENT_IDS,
} from '../../server/agents/catalog/presets.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { makeRoot, runRoleAgentsSeed } from './role-agents.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

const ROLES = Object.values(ROLE_AGENT_IDS);

describe('the role agents seed', () => {
  it('creates nothing without an initial administrator to own them', async () => {
    await runRoleAgentsSeed(h);
    expect(await h.agents.agents.list()).toEqual([]);
  });

  it('creates the six role agents once, with explicit models and their own run limits', async () => {
    await makeRoot(h, 'root-1');
    await runRoleAgentsSeed(h);
    const agents = await h.agents.agents.list();
    expect(agents.map((agent) => agent.id).sort()).toEqual([...ROLES].sort());

    const get = (id: string) => h.agents.agents.get(id);
    const designer = await get(ROLE_AGENT_IDS.solutionDesigner);
    expect(designer).toMatchObject({
      name: 'Solution designer',
      nameText: {
        key: 'studioAgents.presets.solutionDesigner.name',
        ns: '@nocobase/i18n/application',
      },
      descriptionText: {
        key: 'studioAgents.presets.solutionDesigner.description',
        ns: '@nocobase/i18n/application',
      },
      type: 'runner',
      modelEntries: [
        { tool: 'claude', model: 'claude-opus-5-5', effort: 'medium' },
        { tool: 'codex', model: 'gpt-6.1-sol', effort: 'medium' },
      ],
      maxConcurrentRuns: 3,
      access: 'everyone',
      ownerUserId: 'root-1',
      revision: 1,
    });
    expect((await get(ROLE_AGENT_IDS.proposalReviewer)).modelEntries).toEqual([
      { tool: 'codex', model: 'gpt-6-astra', effort: 'medium' },
      { tool: 'claude', model: 'claude-fable-5-1', effort: 'medium' },
    ]);
    expect((await get(ROLE_AGENT_IDS.seniorDeveloper)).modelEntries).toEqual([
      { tool: 'claude', model: 'claude-opus-5-5', effort: 'medium' },
      { tool: 'codex', model: 'gpt-6.1-sol', effort: 'medium' },
    ]);
    expect((await get(ROLE_AGENT_IDS.developer)).modelEntries).toEqual([
      { tool: 'claude', model: 'claude-sonnet-5', effort: 'medium' },
      { tool: 'codex', model: 'gpt-6-luna', effort: 'medium' },
    ]);
    expect((await get(ROLE_AGENT_IDS.codeReviewer)).modelEntries).toEqual([
      { tool: 'codex', model: 'gpt-6-astra', effort: 'medium' },
      { tool: 'claude', model: 'claude-opus-5-5', effort: 'medium' },
    ]);
    // Claude Code only.
    expect(await get(ROLE_AGENT_IDS.frontendDesigner)).toMatchObject({
      name: 'Frontend designer',
      nameText: {
        key: 'studioAgents.presets.frontendDesigner.name',
        ns: '@nocobase/i18n/application',
      },
      modelEntries: [
        { tool: 'claude', model: 'claude-opus-5-5', effort: 'medium' },
      ],
      maxConcurrentRuns: 3,
      ownerUserId: 'root-1',
    });

    for (const id of ROLES) {
      const agent = await get(id);
      // Every entry names its model: no run falls back to a tool's default.
      for (const entry of agent.modelEntries)
        expect(entry).toMatchObject({
          model: expect.any(String),
          effort: 'medium',
        });
      const developer =
        id === ROLE_AGENT_IDS.seniorDeveloper ||
        id === ROLE_AGENT_IDS.developer;
      expect(agent.maxConcurrentRuns).toBe(developer ? 5 : 3);
      // Only the developers push code and open pull requests.
      expect(agent.actions.includes('studio.git/open-pr')).toBe(developer);
      expect(agent.actions.includes('studio.previews/manage')).toBe(developer);
      expect(await h.agents.agents.history(id)).toEqual([
        expect.objectContaining({ action: 'created', revision: 1 }),
      ]);
    }
    // The reviewers that pass a proposal on edit the issue to move it, with the same actions; the code reviewer only
    // comments. None creates issues.
    expect(
      [...(await get(ROLE_AGENT_IDS.frontendDesigner)).actions].sort(),
    ).toEqual([...(await get(ROLE_AGENT_IDS.proposalReviewer)).actions].sort());
    expect((await get(ROLE_AGENT_IDS.proposalReviewer)).actions).toContain(
      'pm.issues/edit',
    );
    expect((await get(ROLE_AGENT_IDS.codeReviewer)).actions).not.toContain(
      'pm.issues/edit',
    );
    for (const id of [
      ROLE_AGENT_IDS.proposalReviewer,
      ROLE_AGENT_IDS.codeReviewer,
      ROLE_AGENT_IDS.frontendDesigner,
    ])
      expect((await get(id)).actions).not.toContain('pm.issues/create');
    // A reviewer's first model is not that of the author it reviews.
    const first = async (id: string) =>
      (await get(id)).modelEntries[0] as { model: string };
    expect((await first(ROLE_AGENT_IDS.proposalReviewer)).model).not.toBe(
      (await first(ROLE_AGENT_IDS.solutionDesigner)).model,
    );
    for (const author of [
      ROLE_AGENT_IDS.seniorDeveloper,
      ROLE_AGENT_IDS.developer,
    ])
      expect((await first(ROLE_AGENT_IDS.codeReviewer)).model).not.toBe(
        (await first(author)).model,
      );

    // A replay adds nothing and keeps what an administrator changed.
    await h.agents.agents.update(ROLE_AGENT_IDS.developer, 'root-1', {
      name: 'Junior',
      expectedRevision: 1,
    });
    await runRoleAgentsSeed(h);
    expect(await h.agents.agents.list()).toHaveLength(ROLES.length);
    expect(await get(ROLE_AGENT_IDS.developer)).toMatchObject({
      name: 'Junior',
      nameText: null,
    });
  });

  it('matches the presets, whose names and descriptions are translated', async () => {
    await makeRoot(h, 'root-1');
    await runRoleAgentsSeed(h);
    const presets = enUS.studioAgents.presets as Record<
      string,
      { name: string; description: string }
    >;
    const translated = zhCN.studioAgents.presets as Record<
      string,
      { name: string; description: string }
    >;
    for (const id of ROLES) {
      const agent = await h.agents.agents.get(id);
      const key = agent.nameText!.key.split('.')[2]!;
      const preset = PRESETS.find((item) => item.key === key);
      expect(preset).toMatchObject({
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions,
        type: 'runner',
      });
      expect([...preset!.actions].sort()).toEqual([...agent.actions].sort());
      expect(presets[key]).toEqual({
        name: agent.name,
        description: agent.description,
      });
      expect(translated[key]?.name).toBeTruthy();
      expect(translated[key]?.description).toBeTruthy();
    }
  });
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import builtIns from '../../database/main/seeds/202610010030_studio_builtin_agents.js';
import coordinator from '../../database/main/seeds/202610100030_studio_project_lead_coordinator.js';
import projectCreation from '../../database/main/seeds/202610100040_studio_project_creation.js';
import {
  PRESETS,
  PROJECT_ASSISTANT,
  PROJECT_LEAD,
} from '../../server/agents/catalog/presets.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { makeRoot } from './role-agents.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await makeRoot(h, 'root-1');
});
afterEach(() => h.close());

async function run(seed: typeof projectCreation): Promise<void> {
  const conn = h.database.connection();
  await seed.run({
    query: conn.query,
    repository: (name: string) => conn.repository(name),
    config: { get: () => undefined },
  } as never);
}

const IDS = ['studio-project-assistant', 'studio-project-lead'];

describe('default project creation permissions', () => {
  it('grants project creation only to the two planning presets', () => {
    expect(
      PRESETS.filter((preset) =>
        preset.actions.includes('pm.projects/create'),
      ).map((preset) => preset.key),
    ).toEqual(['projectLead', 'projectAssistant']);
  });

  it('does not recreate missing built-in agents', async () => {
    await run(projectCreation);
    expect(await h.agents.agents.list()).toEqual([]);
  });

  it.each([PROJECT_ASSISTANT, PROJECT_LEAD])(
    'allows a project plan with $key permissions only while the requester is authorized',
    async (preset) => {
      await h.addUser('alice');
      const agentId = await h.createAgent({ actions: [...preset.actions] });
      const conversation = await h.agents.conversations.create('alice', {
        agentId,
      });
      await h.agents.conversations.send('alice', conversation.id, {
        content: 'Create a support project.',
      });
      const payload = await h.claimOne();
      const propose = () =>
        h.request('POST', '/projects/plans', {
          runToken: payload.cli.credential.content.token,
          body: {
            title: 'Create support project',
            rows: [{ op: 'project.create', params: { name: 'Support' } }],
          },
        });
      expect((await propose()).status).toBe(201);
      h.roles.set('alice', 'none');
      const refused = await propose();
      expect(refused.status).toBe(400);
      expect(refused.body.error.reason).toBe('PLAN_INVALID');
    },
  );

  it('brings a fresh installation to the current presets and records each grant once', async () => {
    await run(builtIns);
    await run(coordinator);
    await run(projectCreation);
    for (const [id, preset] of [
      [IDS[0], PROJECT_ASSISTANT],
      [IDS[1], PROJECT_LEAD],
    ] as const) {
      const agent = await h.agents.agents.get(id);
      expect([...agent.actions].sort()).toEqual([...preset.actions].sort());
      expect(agent.confirmChanges).toBe('larger');
      const history = await h.agents.agents.history(id);
      expect(history[0]).toMatchObject({
        action: 'updated',
        revision: agent.revision,
        actorUserId: null,
        changes: [{ field: 'actions' }],
      });
      await run(projectCreation);
      expect(await h.agents.agents.get(id)).toEqual(agent);
      expect(await h.agents.agents.history(id)).toEqual(history);
    }
  });

  it('upgrades older defaults without overwriting a customized name or model', async () => {
    await run(builtIns);
    await h.agents.agents.update(IDS[1], 'root-1', {
      name: 'My coordinator',
      modelEntries: [{ tool: 'codex', model: 'custom-model', effort: null }],
      expectedRevision: 1,
    });
    const before = await h.agents.agents.get(IDS[1]);
    await run(projectCreation);
    const after = await h.agents.agents.get(IDS[1]);
    expect(after).toMatchObject({
      name: before.name,
      modelEntries: before.modelEntries,
      instructions: before.instructions,
      runnerIds: before.runnerIds,
      revision: before.revision + 1,
    });
    expect(after.actions).toEqual([...before.actions, 'pm.projects/create']);
  });

  it('preserves customized permissions and does not change personal copies', async () => {
    await run(builtIns);
    const assistant = await h.agents.agents.get(IDS[0]);
    const copyId = await h.createAgent({
      name: 'Personal assistant',
      actions: [...assistant.actions],
    });
    await h.agents.agents.update(IDS[0], 'root-1', {
      actions: ['pm.projects/view'],
      expectedRevision: 1,
    });
    const customized = await h.agents.agents.get(IDS[0]);
    const copy = await h.agents.agents.get(copyId);
    await run(projectCreation);
    expect(await h.agents.agents.get(IDS[0])).toEqual(customized);
    expect(await h.agents.agents.get(copyId)).toEqual(copy);
  });

  it('leaves an existing grant unchanged', async () => {
    await run(builtIns);
    const agent = await h.agents.agents.get(IDS[0]);
    await h.agents.agents.update(IDS[0], 'root-1', {
      actions: [...agent.actions, 'pm.projects/create'],
      expectedRevision: agent.revision,
    });
    const before = await h.agents.agents.get(IDS[0]);
    await run(projectCreation);
    expect(await h.agents.agents.get(IDS[0])).toEqual(before);
  });

  it('does not restore a grant revoked after the upgrade on replay', async () => {
    await run(builtIns);
    await run(projectCreation);
    for (const id of IDS) {
      const agent = await h.agents.agents.get(id);
      await h.agents.agents.update(id, 'root-1', {
        actions: agent.actions.filter(
          (action) => action !== 'pm.projects/create',
        ),
        expectedRevision: agent.revision,
      });
    }
    await run(projectCreation);
    for (const id of IDS) {
      expect((await h.agents.agents.get(id)).actions).not.toContain(
        'pm.projects/create',
      );
    }
  });
});

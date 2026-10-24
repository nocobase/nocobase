import { afterEach, describe, expect, it } from 'vitest';
import type { AgentTool } from '@nocobase/agent-protocol';
import { recordChange } from '../server/core/agents/agent.history.js';
import { insertAgent } from '../server/core/agents/agent.store.js';
import {
  createAgentService,
  runnerAgentId,
} from '../server/core/agents/agent.service.js';
import { agentNameOf, discoveryKey } from '../shared/model-catalog.js';
import { createHarness, claim, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});
const tool = (...models: string[]) => [
  {
    kind: 'pi' as const,
    authenticated: true,
    models: models.map((id) => ({ id })),
  },
];
const views = () =>
  h.services.views(h.services.tx.read(), 'alice', { canEdit: true });

/**
 * A pending agent, as one existed before the application stopped creating one per model a runner reports: the
 * discovery/ignore preferences this suite covers now only ever act on agents left from that time, since every
 * supported way to create one today enables it directly.
 */
async function seedPendingAgent(
  target: Harness,
  tool: AgentTool,
  model: string,
): Promise<string> {
  const id = runnerAgentId(tool, model);
  const now = target.clock.now().toISOString();
  await target.services.tx.run(({ conn }) =>
    insertAgent(conn, {
      id,
      name: agentNameOf(tool, model),
      description: null,
      nameText: null,
      descriptionText: null,
      avatar: null,
      type: 'runner',
      source: 'runner',
      status: 'pending',
      tool,
      model,
      modelEntries: [{ tool, model, effort: null }],
      instructions: null,
      runnerIds: [],
      actions: [],
      confirmChanges: 'larger',
      access: 'everyone',
      ownerUserId: 'system',
      maxConcurrentRuns: 100,
      maxAttempts: 3,
      toolPolicy: null,
      lastReportedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  );
  await target.services.tx.run(({ conn }) =>
    recordChange(conn, {
      id: crypto.randomUUID(),
      agentId: id,
      revision: 1,
      action: 'created',
      actorUserId: null,
      changes: [],
      createdAt: now,
    }),
  );
  return id;
}

describe('persistent discovery groups', () => {
  it('ignores and restores multiple groups atomically without changing agent records', async () => {
    h = await createHarness();
    await seedPendingAgent(h, 'pi', 'openai/gpt-6-astra');
    await seedPendingAgent(h, 'pi', 'openai/gpt-6-luna');
    const before = await h.services.agents.list();
    const groups = (await views()).map((agent) => ({
      key: agent.discoveryKey!,
      expectedRevision: 0,
    }));
    expect(await h.services.agents.setIgnored(groups, true)).toHaveLength(2);
    expect((await views()).every((agent) => agent.ignored)).toBe(true);
    await h.services.agents.setIgnored(
      groups.map((group) => ({ ...group, expectedRevision: 1 })),
      false,
    );
    expect(
      (await views()).every(
        (agent) => !agent.ignored && agent.status === 'pending',
      ),
    ).toBe(true);
    expect(await h.services.agents.list()).toEqual(before);
  });
  it('serializes concurrent enable and ignore through the group revision', async () => {
    h = await createHarness();
    await seedPendingAgent(h, 'pi', 'openai/gpt-6-astra');
    const [agent] = await views();
    const results = await Promise.allSettled([
      h.services.agents.update(agent!.id, 'alice', {
        description: 'Reviews',
        enabled: true,
        expectedRevision: agent!.revision,
      }),
      h.services.agents.setIgnored(
        [{ key: agent!.discoveryKey!, expectedRevision: 0 }],
        true,
      ),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const [current] = await views();
    expect(current!.ignored && current!.status === 'enabled').toBe(false);
  });
  it('preserves ignore through refreshed reads, a new service instance and another provider report; restores only to pending', async () => {
    h = await createHarness();
    await seedPendingAgent(h, 'pi', 'openai/gpt-6-astra');
    const key = discoveryKey('pi', 'openai/gpt-6-astra');
    await h.services.agents.setIgnored([{ key, expectedRevision: 0 }], true);
    expect((await views())[0]).toMatchObject({
      ignored: true,
      status: 'pending',
      discoveryRevision: 1,
    });
    const restarted = createAgentService({
      tx: h.services.tx,
      clock: h.clock,
      ids: { next: () => crypto.randomUUID() },
      people: h.services.people,
    });
    expect((await restarted.list())[0]!.status).toBe('pending');
    const providerRunner = await h.registerRunner({
      tools: tool('rightapi/gpt-6-astra', 'openai/gpt-6-astra'),
    });
    // Another provider's spelling of the same model joins the same discovery group once it exists, already ignored.
    await seedPendingAgent(h, 'pi', 'rightapi/gpt-6-astra');
    expect(
      (await views()).map((agent) => [agent.discoveryKey, agent.ignored]),
    ).toEqual([
      [key, true],
      [key, true],
    ]);
    await restarted.setIgnored([{ key, expectedRevision: 1 }], false);
    expect(
      (await views()).every(
        (agent) => !agent.ignored && agent.status === 'pending',
      ),
    ).toBe(true);
    const candidate = (await views()).find(
      (agent) => agent.model === 'rightapi/gpt-6-astra',
    )!;
    const enabled = await restarted.update(candidate.id, 'alice', {
      description: 'Reviews',
      enabled: true,
      expectedRevision: candidate.revision,
    });
    expect(enabled.id).toBe(candidate.id);
    expect(enabled.modelEntries[0]!.model).toBe('rightapi/gpt-6-astra');
    await h.enqueue(enabled.id, 'provider-selection');
    const [payload] = await claim(h, providerRunner);
    expect(payload.tool.model).toBe('rightapi/gpt-6-astra');
    expect(
      (await views()).filter((agent) => agent.status === 'enabled'),
    ).toHaveLength(1);
  });

  it('keeps unknown models from different providers separate', () => {
    expect(discoveryKey('pi', 'a/unknown')).not.toBe(
      discoveryKey('pi', 'b/unknown'),
    );
    expect(discoveryKey('pi', 'a/gpt-6-astra')).toBe(
      discoveryKey('pi', 'b/gpt-6-astra'),
    );
  });

  it('rejects stale ignore after enable and enable after ignore; an invalid batch rolls back', async () => {
    h = await createHarness();
    await seedPendingAgent(h, 'pi', 'openai/gpt-6-astra');
    await seedPendingAgent(h, 'pi', 'openai/gpt-6-luna');
    const [a, b] = await views();
    await h.services.agents.update(a!.id, 'alice', {
      description: 'Reviews',
      enabled: true,
      expectedRevision: a!.revision,
    });
    await expect(
      h.services.agents.setIgnored(
        [{ key: a!.discoveryKey!, expectedRevision: 0 }],
        true,
      ),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
    await expect(
      h.services.agents.setIgnored(
        [
          { key: b!.discoveryKey!, expectedRevision: 0 },
          { key: a!.discoveryKey!, expectedRevision: 1 },
        ],
        true,
      ),
    ).rejects.toThrow();
    expect((await views()).find((agent) => agent.id === b!.id)!.ignored).toBe(
      false,
    );
    await h.services.agents.setIgnored(
      [{ key: b!.discoveryKey!, expectedRevision: 0 }],
      true,
    );
    await expect(
      h.services.agents.update(b!.id, 'alice', {
        description: 'Reviews',
        enabled: true,
        expectedRevision: b!.revision,
      }),
    ).rejects.toThrow('Restore');
  });

  it('checks authentication, manager permission and revisions on the documented HTTP operation', async () => {
    h = await createHarness();
    await seedPendingAgent(h, 'pi', 'openai/gpt-6-astra');
    const body = {
      groups: [
        { key: discoveryKey('pi', 'openai/gpt-6-astra'), expectedRevision: 0 },
      ],
      ignored: true,
    };
    expect(
      (await h.request('PUT', '/agents/discoveryPreferences', { body })).status,
    ).toBe(401);
    expect(
      (
        await h.request('PUT', '/agents/discoveryPreferences', {
          user: 'bob',
          body,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('PUT', '/agents/discoveryPreferences', {
          user: 'alice',
          headers: { 'x-test-can': 'agents.agents/manage' },
          body,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await h.request('PUT', '/agents/discoveryPreferences', {
          user: 'alice',
          headers: { 'x-test-can': 'agents.agents/manage' },
          body,
        })
      ).status,
    ).toBe(409);
  });
});

import { afterEach, describe, expect, it } from 'vitest';

import { agentsRepo } from '../server/core/agents/agent.store.js';
import { settingsRepo } from '../server/core/conversations/conversation.store.js';
import { asJson } from '../server/kernel/values.js';
import { createHarness, type Harness } from './harness.js';

const manage = ['agents.agents/manage'];

describe('system default agent access', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });
  const settings = (body: unknown) =>
    h.request('PATCH', '/agents/chatSettings', {
      user: 'admin',
      can: manage,
      body,
    });

  it.each(['ownerOnly', 'users'] as const)(
    'refuses a legacy %s row without changing settings or agent revision',
    async (access) => {
      h = await createHarness();
      const team = await h.createAgent();
      const privateId = await h.createAgent();
      // Access is no longer editable; model a row kept from an earlier version.
      await agentsRepo(h.services.tx.read()).updateMany({
        filter: { id: privateId },
        values: { access, ownerUserId: 'admin' },
      });
      expect((await settings({ defaultAgentId: team })).status).toBe(200);
      const before = await h.services.agents.get(team);
      const refused = await settings({ defaultAgentId: privateId });
      expect(refused.status).toBe(400);
      expect(refused.body.error).toMatchObject({
        metadata: {
          field: 'defaultAgentId',
          reason: 'SYSTEM_DEFAULT_REQUIRES_EVERYONE',
        },
        fieldViolations: [
          { field: 'defaultAgentId', description: expect.any(String) },
        ],
      });
      expect((await h.services.chat.settings()).defaultAgentId).toBe(team);
      expect((await h.services.agents.get(team)).revision).toBe(
        before.revision,
      );
      expect((await settings({ defaultAgentId: null })).status).toBe(200);
    },
  );

  it('rejects access patches through the new agent API without changing the default', async () => {
    h = await createHarness();
    const id = await h.createAgent({ source: 'runner', description: 'Shared' });
    await settings({ defaultAgentId: id });
    const before = await h.services.agents.get(id);
    const refused = await h.request('PATCH', `/agents/${id}`, {
      user: 'admin',
      can: manage,
      body: {
        expectedRevision: before.revision,
        description: 'Changed',
        access: 'ownerOnly',
      },
    });
    expect(refused.status).toBe(400);
    expect(await h.services.agents.get(id)).toEqual(before);
    expect((await h.services.chat.settings()).defaultAgentId).toBe(id);
  });

  it('requires replacing or clearing historical restricted defaults before saving', async () => {
    h = await createHarness();
    const id = await h.createAgent();
    await agentsRepo(h.services.tx.read()).updateMany({
      filter: { id },
      values: { access: 'ownerOnly' },
    });
    await settingsRepo(h.services.tx.read()).createOne({
      values: {
        key: 'chat',
        value: asJson({ defaultAgentId: id }),
        updatedById: null,
        updatedAt: h.clock.now().toISOString(),
      },
    });
    const failed = await settings({});
    expect(failed.status).toBe(400);
    expect(failed.body.error.fieldViolations[0].field).toBe('defaultAgentId');
    const shared = await h.createAgent();
    expect((await settings({ defaultAgentId: shared })).status).toBe(200);
    expect((await settings({ defaultAgentId: null })).status).toBe(200);
  });

  it('offers workable agents to both users, refuses disabled personal defaults, and falls back', async () => {
    h = await createHarness();
    const team = await h.createAgent({ source: 'runner' });
    const personal = await h.createAgent({ source: 'runner' });
    await settings({ defaultAgentId: team });
    for (const user of ['alice', 'bob']) {
      const list = await h.request('GET', '/agents/chatAgents', { user });
      expect(
        list.body.data.map((agent: { id: string }) => agent.id).sort(),
      ).toEqual([team, personal].sort());
      expect(
        (
          await h.request('PATCH', '/agents/chatPreferences', {
            user,
            body: { defaultAgentId: personal },
          })
        ).status,
      ).toBe(200);
    }
    await h.disableAgent(personal);
    for (const user of ['alice', 'bob']) {
      expect(
        (
          await h.request('PATCH', '/agents/chatPreferences', {
            user,
            body: { defaultAgentId: personal },
          })
        ).status,
      ).toBe(403);
      const started = await h.request('POST', '/agents/conversations', {
        user,
        body: {},
      });
      expect(started.status).toBe(201);
      expect(started.body.data.agent.id).toBe(team);
    }
  });
});

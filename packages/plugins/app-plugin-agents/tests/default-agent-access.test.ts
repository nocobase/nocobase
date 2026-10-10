import { afterEach, describe, expect, it } from 'vitest';

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
  const update = (id: string, body: unknown) =>
    h.request('PATCH', `/agents/${id}`, { user: 'admin', can: manage, body });

  it.each(['ownerOnly', 'users'] as const)(
    'refuses %s even when the administrator can invoke it',
    async (access) => {
      h = await createHarness();
      const team = await h.createAgent();
      const privateId = await h.createAgent({
        access,
        ownerUserId: 'admin',
        userIds: ['admin'],
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

  it.each(['ownerOnly', 'users'] as const)(
    'rolls back all fields when restricting the default to %s',
    async (access) => {
      h = await createHarness();
      const id = await h.createAgent({ name: 'Shared' });
      await settings({ defaultAgentId: id });
      const before = await h.services.agents.get(id);
      const history = await h.services.agents.history(id);
      const refused = await update(id, {
        expectedRevision: before.revision,
        name: 'Changed',
        access,
        userIds: ['admin'],
      });
      expect(refused.status).toBe(400);
      expect(refused.body.error.fieldViolations).toEqual([
        { field: 'access', description: expect.any(String) },
      ]);
      expect(await h.services.agents.get(id)).toEqual(before);
      expect(await h.services.agents.history(id)).toEqual(history);
      expect(
        (
          await update(id, {
            expectedRevision: before.revision,
            name: 'Renamed',
          })
        ).status,
      ).toBe(200);
      await settings({ defaultAgentId: null });
      expect(
        (await update(id, { expectedRevision: before.revision + 1, access }))
          .status,
      ).toBe(200);
    },
  );

  it('allows restricting a former default after replacing it', async () => {
    h = await createHarness();
    const first = await h.createAgent();
    const second = await h.createAgent();
    await settings({ defaultAgentId: first });
    await settings({ defaultAgentId: second });
    expect(
      (
        await update(first, {
          expectedRevision: 1,
          access: 'users',
          userIds: ['alice'],
        })
      ).status,
    ).toBe(200);
  });

  it('requires repairing historical restricted defaults before saving any setting', async () => {
    h = await createHarness();
    const id = await h.createAgent({ access: 'ownerOnly' });
    await settingsRepo(h.services.tx.read()).createOne({
      values: {
        key: 'chat',
        value: asJson({ defaultAgentId: id }),
        updatedById: null,
        updatedAt: h.clock.now().toISOString(),
      },
    });
    const failed = await settings({ onlineFallbackAgentId: null });
    expect(failed.status).toBe(400);
    expect(failed.body.error.fieldViolations[0].field).toBe('defaultAgentId');
    expect(
      (await update(id, { expectedRevision: 1, access: 'everyone' })).status,
    ).toBe(200);
    expect((await settings({ onlineFallbackAgentId: null })).status).toBe(200);
  });

  it.each([
    { restrictionFirst: false, initialize: false },
    { restrictionFirst: true, initialize: false },
    { restrictionFirst: false, initialize: true },
    { restrictionFirst: true, initialize: true },
  ])(
    'serializes defaults and access (restriction first: $restrictionFirst, lock initialized: $initialize)',
    async ({ restrictionFirst, initialize }) => {
      h = await createHarness();
      const id = await h.createAgent();
      // Contend from both public writers, with and without an existing lock row.
      if (initialize) await settings({ defaultAgentId: null });
      const restrict = () =>
        update(id, { expectedRevision: 1, access: 'ownerOnly' });
      const setDefault = () => settings({ defaultAgentId: id });
      const results = await Promise.all(
        restrictionFirst
          ? [restrict(), setDefault()]
          : [setDefault(), restrict()],
      );
      expect(results.map((result) => result.status)).toContain(200);
      expect(results.some((result) => [400, 409].includes(result.status))).toBe(
        true,
      );
      const current = await h.services.chat.settings();
      if (current.defaultAgentId)
        expect(
          (await h.services.agents.get(current.defaultAgentId)).access,
        ).toBe('everyone');
    },
  );

  it('filters personal choices and rejects direct submissions, then falls back after permission revocation', async () => {
    h = await createHarness();
    const team = await h.createAgent();
    const own = await h.createAgent({
      access: 'ownerOnly',
      ownerUserId: 'alice',
    });
    const shared = await h.createAgent({
      access: 'users',
      ownerUserId: 'owner',
      userIds: ['alice'],
    });
    const archived = await h.createAgent();
    await h.services.agents.archive(archived, 'admin');
    await settings({ defaultAgentId: team });
    for (const user of ['alice', 'bob']) {
      const list = await h.request('GET', '/agents/chatAgents', { user });
      expect(
        list.body.data.map((agent: { id: string }) => agent.id).sort(),
      ).toEqual((user === 'alice' ? [team, own, shared] : [team]).sort());
      for (const id of [own, shared]) {
        const response = await h.request('PATCH', '/agents/chatPreferences', {
          user,
          body: { defaultAgentId: id },
        });
        expect(response.status).toBe(user === 'alice' ? 200 : 403);
      }
      expect(
        (
          await h.request('PATCH', '/agents/chatPreferences', {
            user,
            body: { defaultAgentId: archived },
          })
        ).status,
      ).toBe(403);
    }
    await h.services.chat.updatePreferences('owner', {
      defaultAgentId: shared,
    });
    await h.services.agents.update(shared, 'admin', {
      expectedRevision: 1,
      userIds: [],
    });
    const started = await h.request('POST', '/agents/conversations', {
      user: 'alice',
      body: {},
    });
    expect(started.status).toBe(201);
    expect(started.body.data.agent.id).toBe(team);
  });
});

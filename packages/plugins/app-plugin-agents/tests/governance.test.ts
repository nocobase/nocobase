/**
 * Governing agents: the revision lock on agents and skills, the history of every change (variables named, never
 * valued), what disabling announces and withdraws, the application's own agents, and creators editing their own skills
 * at the related level of `agents.agents` `edit`.
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { AgentsEvent } from '../server/kernel/events.js';
import { createHarness, skillMd, type Harness } from './harness.js';

const ADMIN = ['agents.agents/manage', 'agents.runners/manage'];
const READ = ['agents.agents/read'];
const OWN = ['agents.agents/edit=related'];

describe('agent governance', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const patch = (id: string, body: object, user = 'alice', can = ADMIN) =>
    h.request('PATCH', `/agents/${id}`, { user, can, body });

  /** A discovered agent, pending until enabled. */
  const discovered = (name = 'Coder') =>
    h.createAgent({ name, source: 'runner', status: 'pending' });

  it('refuses an edit made against a revision the agent has left', async () => {
    h = await createHarness();
    const id = await discovered();
    expect((await h.services.agents.get(id)).revision).toBe(1);
    const first = await patch(id, {
      description: 'Reviews',
      expectedRevision: 1,
    });
    expect(first.status).toBe(200);
    expect(first.body.data.revision).toBe(2);
    // A second tab still holding revision 1.
    const stale = await patch(id, {
      description: 'Mine',
      expectedRevision: 1,
    });
    expect(stale.status).toBe(409);
    expect(stale.body.error).toMatchObject({
      reason: 'REVISION_CONFLICT',
      metadata: { revision: 2 },
    });
    expect(stale.body.error.message).toMatch(/changed by someone else/u);
    expect((await h.services.agents.get(id)).description).toBe('Reviews');
    // A patch without the revision is not accepted at all.
    expect((await patch(id, { description: 'X' })).status).toBe(400);
    // A patch that changes nothing keeps the revision.
    const same = await patch(id, {
      description: 'Reviews',
      expectedRevision: 2,
    });
    expect(same.body.data.revision).toBe(2);
  });

  it('keeps who changed what and when, naming variables without their values', async () => {
    h = await createHarness();
    const id = await discovered();
    h.clock.advance(1000);
    await patch(id, {
      description: 'Code review',
      enabled: true,
      expectedRevision: 1,
    });
    h.clock.advance(1000);
    const variable = `/agents/variables/agent/${id}/API_TOKEN`;
    await h.request('PUT', variable, {
      user: 'bob',
      can: ADMIN,
      body: { value: 'super-secret-1' },
    });
    h.clock.advance(1000);
    await h.request('PUT', variable, {
      user: 'bob',
      can: ADMIN,
      body: { value: 'super-secret-2' },
    });
    h.clock.advance(1000);
    await h.request('DELETE', variable, { user: 'bob', can: ADMIN });
    h.clock.advance(1000);
    await patch(id, { enabled: false, expectedRevision: 2 });

    const history = await h.request('GET', `/agents/${id}/history`, {
      user: 'carol',
      can: READ,
    });
    expect(history.status).toBe(200);
    expect(
      history.body.data.map(
        (entry: { action: string; revision: number; actorUserId: string }) => [
          entry.action,
          entry.revision,
          entry.actorUserId,
        ],
      ),
    ).toEqual([
      ['disabled', 3, 'alice'],
      ['variables', 2, 'bob'],
      ['variables', 2, 'bob'],
      ['variables', 2, 'bob'],
      ['enabled', 2, 'alice'],
      ['created', 1, null],
    ]);
    expect(history.body.data[4].changes).toEqual([
      { field: 'description', before: null, after: 'Code review' },
      { field: 'status', before: 'pending', after: 'enabled' },
    ]);
    expect(
      history.body.data
        .slice(1, 4)
        .map((entry: { changes: unknown[] }) => entry.changes[0]),
    ).toEqual([
      { field: 'variable', name: 'API_TOKEN', change: 'removed' },
      { field: 'variable', name: 'API_TOKEN', change: 'changed' },
      { field: 'variable', name: 'API_TOKEN', change: 'added' },
    ]);
    expect(JSON.stringify(history.body.data)).not.toMatch(/super-secret/u);
    // What changed after the revision a stale editor held.
    const since = await h.request(
      'GET',
      `/agents/${id}/history?afterRevision=2`,
      { user: 'carol', can: READ },
    );
    expect(
      since.body.data.map((entry: { action: string }) => entry.action),
    ).toEqual(['disabled']);
    expect(
      (
        await h.request('GET', `/agents/${id}/history`, {
          user: 'carol',
        })
      ).status,
    ).toBe(403);
  });

  it('withdraws queued runs and announces agent.removed when disabled', async () => {
    h = await createHarness();
    const events: AgentsEvent[] = [];
    h.services.events.on('agent.removed', (event) => events.push(event));
    const id = await h.createAgent({ name: 'Builder', source: 'runner' });
    const runId = await h.enqueue(id, '1');
    const disabled = await patch(id, {
      description: 'Builds',
      enabled: false,
      expectedRevision: 1,
    });
    expect(disabled.body.data.status).toBe('disabled');
    const run = await h.services.runs.get(runId);
    expect(run.status).toBe('cancelled');
    expect(events).toEqual([
      {
        type: 'agent.removed',
        agentId: id,
        name: 'Builder',
        reason: 'disabled',
        byUserId: 'alice',
      },
    ]);
    // Disabling again announces nothing new, and a disabled agent takes no work.
    await patch(id, { enabled: false, expectedRevision: 2 });
    expect(events).toHaveLength(1);
    await expect(h.enqueue(id, '2')).rejects.toMatchObject({
      code: 'AGENT_NOT_ENABLED',
    });
  });

  it("keeps the application's own agent as it says, recording only what changed", async () => {
    h = await createHarness();
    const input = {
      id: 'manager',
      name: 'Project manager',
      nameText: { key: 'agents.manager', ns: 'acme' },
      description: 'Arranges every issue',
      instructions: 'Hand each step over.',
      actions: ['crm.deals/view'],
      modelEntries: [],
    };
    const created = await h.services.agents.ensureSystem(input, 'alice');
    expect(created).toMatchObject({
      source: 'system',
      status: 'enabled',
      revision: 1,
      nameText: { key: 'agents.manager', ns: 'acme' },
    });
    // Configured without a tool and model, it cannot be given work yet.
    expect(
      await h.services.agents.findWorkable(h.services.tx.read(), 'manager'),
    ).toBeNull();
    expect(
      (await h.services.agents.ensureSystem(input, 'alice')).revision,
    ).toBe(1);
    const configured = await h.services.agents.ensureSystem(
      {
        ...input,
        modelEntries: [{ tool: 'claude', model: 'claude-opus-5-5' }],
      },
      'alice',
    );
    expect(configured.revision).toBe(2);
    expect(
      await h.services.agents.findWorkable(h.services.tx.read(), 'manager'),
    ).not.toBeNull();
    const history = await h.services.agents.history('manager');
    expect(history.map((entry) => entry.action)).toEqual([
      'updated',
      'created',
    ]);
    expect(history[0]?.changes).toEqual([
      {
        field: 'modelEntries',
        before: [],
        after: [{ tool: 'claude', model: 'claude-opus-5-5', effort: null }],
      },
    ]);
  });

  it("lets a skill's creator edit it at the related level, against its current revision", async () => {
    h = await createHarness();
    const skill = await h.services.skills.create('bob', {
      content: skillMd('review', 'How we review.'),
    });
    const other = await h.services.skills.create('carol', {
      content: skillMd('deploy', 'How we deploy.'),
    });
    const save = (id: string, expectedRevision: number, user = 'bob') =>
      h.request('PATCH', `/agents/skills/${id}`, {
        user,
        can: READ,
        scope: OWN,
        body: {
          content: skillMd('review', 'How we review code.', '# Review'),
          files: [],
          expectedRevision,
        },
      });
    const read = await h.request('GET', `/agents/skills/${skill.id}`, {
      user: 'bob',
      can: READ,
      scope: OWN,
    });
    expect(read.body.data.canEdit).toBe(true);
    const saved = await save(skill.id, 1);
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({ version: 2, canEdit: true });
    const stale = await save(skill.id, 1);
    expect(stale.status).toBe(409);
    expect(stale.body.error).toMatchObject({
      reason: 'REVISION_CONFLICT',
      metadata: { revision: 2 },
    });
    expect((await save(other.id, 1)).status).toBe(403);
    const restore = (expectedRevision: number) =>
      h.request('POST', `/agents/skills/${skill.id}/versions/1/restore`, {
        user: 'bob',
        can: READ,
        scope: OWN,
        body: { expectedRevision },
      });
    expect((await restore(1)).status).toBe(409);
    expect((await restore(2)).body.data.version).toBe(3);
    // Deleting a skill still needs managing agents.
    expect(
      (
        await h.request('DELETE', `/agents/skills/${skill.id}`, {
          user: 'bob',
          can: READ,
          scope: OWN,
        })
      ).status,
    ).toBe(403);
  });
});

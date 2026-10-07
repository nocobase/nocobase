/**
 * Governing agents' configuration: the revision lock on agents and skills, the history of every change (variables
 * named, never valued), what archiving and deleting announce and withdraw, and owners editing their own agents and
 * skills at the related level of `agents.agents` `edit`.
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

  it('refuses an edit made against a revision the agent has left', async () => {
    h = await createHarness();
    const id = await h.createAgent();
    expect((await h.services.agents.get(id)).revision).toBe(1);
    const first = await patch(id, { name: 'Reviewer', expectedRevision: 1 });
    expect(first.status).toBe(200);
    expect(first.body.data.revision).toBe(2);
    // A second tab still holding revision 1.
    const stale = await patch(id, {
      instructions: 'Mine',
      expectedRevision: 1,
    });
    expect(stale.status).toBe(409);
    expect(stale.body.error).toMatchObject({
      reason: 'REVISION_CONFLICT',
      metadata: { revision: 2 },
    });
    expect(stale.body.error.message).toMatch(/changed by someone else/u);
    expect((await h.services.agents.get(id)).instructions).toBeNull();
    // A patch without the revision is not accepted at all.
    expect((await patch(id, { name: 'X' })).status).toBe(400);
    // A patch that changes nothing keeps the revision.
    const same = await patch(id, { name: 'Reviewer', expectedRevision: 2 });
    expect(same.body.data.revision).toBe(2);
  });

  it('raises the revision when the agent is archived or restored', async () => {
    h = await createHarness();
    const id = await h.createAgent();
    await h.services.agents.archive(id, 'alice');
    await h.services.agents.restore(id, 'alice');
    expect((await h.services.agents.get(id)).revision).toBe(3);
    expect(
      (await patch(id, { name: 'Late', expectedRevision: 1 })).status,
    ).toBe(409);
  });

  it('keeps who changed what and when, naming variables without their values', async () => {
    h = await createHarness();
    const id = await h.createAgent({ actions: ['crm.deals/view'] });
    h.clock.advance(1000);
    await patch(id, {
      instructions: 'Write tests first.',
      actions: ['crm.deals/view', 'crm.deals/comment'],
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
    await h.request('POST', `/agents/${id}/archive`, {
      user: 'alice',
      can: ADMIN,
    });

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
      ['archived', 3, 'alice'],
      ['variables', 2, 'bob'],
      ['variables', 2, 'bob'],
      ['variables', 2, 'bob'],
      ['updated', 2, 'alice'],
      ['created', 1, 'owner'],
    ]);
    expect(history.body.data[4].changes).toEqual([
      { field: 'instructions', before: null, after: 'Write tests first.' },
      {
        field: 'actions',
        before: ['crm.deals/view'],
        after: ['crm.deals/view', 'crm.deals/comment'],
      },
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
    ).toEqual(['archived']);
    expect(
      (
        await h.request('GET', `/agents/${id}/history`, {
          user: 'carol',
        })
      ).status,
    ).toBe(403);
  });

  it('withdraws queued runs and announces agent.removed when archived or deleted', async () => {
    h = await createHarness();
    const events: AgentsEvent[] = [];
    h.services.events.on('agent.removed', (event) => events.push(event));
    const id = await h.createAgent({ name: 'Builder' });
    const runId = await h.enqueue(id, '1');
    await h.request('POST', `/agents/${id}/archive`, {
      user: 'alice',
      can: ADMIN,
    });
    const run = await h.services.runs.get(runId);
    expect(run.status).toBe('cancelled');
    expect(events).toEqual([
      {
        type: 'agent.removed',
        agentId: id,
        name: 'Builder',
        reason: 'archived',
        byUserId: 'alice',
      },
    ]);
    // Archiving again announces nothing new.
    await h.services.agents.archive(id, 'alice');
    expect(events).toHaveLength(1);
    const deleted = await h.request('DELETE', `/agents/${id}`, {
      user: 'alice',
      can: ADMIN,
    });
    expect(deleted.status).toBe(204);
    expect(events[1]).toMatchObject({
      type: 'agent.removed',
      agentId: id,
      reason: 'deleted',
      byUserId: 'alice',
    });
    // Its history goes with it.
    await expect(h.services.agents.history(id)).rejects.toMatchObject({
      code: 'AGENT_NOT_FOUND',
    });
  });

  it("keeps a built-in agent's translations until someone edits the field", async () => {
    h = await createHarness();
    const id = await h.createAgent({
      name: 'Project lead',
      description: 'Plans the work',
    });
    // What an application's seed writes for an agent it ships.
    await h.database
      .connection()
      .repository('agAgents')
      .updateOne({
        filter: { id },
        values: {
          nameText: { key: 'presets.lead.name', ns: 'acme' },
          descriptionText: { key: 'presets.lead.description', ns: 'acme' },
        },
      });
    expect(await h.services.agents.get(id)).toMatchObject({
      nameText: { key: 'presets.lead.name', ns: 'acme' },
      descriptionText: { key: 'presets.lead.description', ns: 'acme' },
    });
    // Saving the same name keeps it; a new description drops only the description's.
    const edited = await h.services.agents.update(id, 'alice', {
      name: 'Project lead',
      description: 'Plans and ships',
      expectedRevision: 1,
    });
    expect(edited).toMatchObject({
      nameText: { key: 'presets.lead.name', ns: 'acme' },
      descriptionText: null,
    });
    const renamed = await h.services.agents.update(id, 'alice', {
      name: 'Lead',
      expectedRevision: edited.revision,
    });
    expect(renamed.nameText).toBeNull();
  });

  it("lets an agent's owner change it at the related level, and no one else", async () => {
    h = await createHarness();
    const mine = await h.createAgent({ ownerUserId: 'bob', name: 'Mine' });
    const theirs = await h.createAgent({ ownerUserId: 'carol' });
    const listed = await h.request('GET', '/agents', {
      user: 'bob',
      can: READ,
      scope: OWN,
    });
    expect(
      Object.fromEntries(
        listed.body.data.map((agent: { id: string; canEdit: boolean }) => [
          agent.id,
          agent.canEdit,
        ]),
      ),
    ).toEqual({ [mine]: true, [theirs]: false });

    const own = await h.request('PATCH', `/agents/${mine}`, {
      user: 'bob',
      can: READ,
      scope: OWN,
      body: { instructions: 'Be brief.', expectedRevision: 1 },
    });
    expect(own.status).toBe(200);
    expect(own.body.data.instructions).toBe('Be brief.');
    const other = await h.request('PATCH', `/agents/${theirs}`, {
      user: 'bob',
      can: READ,
      scope: OWN,
      body: { instructions: 'Be brief.', expectedRevision: 1 },
    });
    expect(other.status).toBe(403);
    // Without the related level, owning it is not enough.
    expect(
      (
        await h.request('PATCH', `/agents/${mine}`, {
          user: 'bob',
          can: READ,
          body: { name: 'X', expectedRevision: 2 },
        })
      ).status,
    ).toBe(403);
    // The `all` level reaches every agent.
    expect(
      (
        await h.request('PATCH', `/agents/${theirs}`, {
          user: 'dave',
          can: READ,
          scope: ['agents.agents/edit=all'],
          body: { name: 'Renamed', expectedRevision: 1 },
        })
      ).status,
    ).toBe(200);

    // Its variables, archiving and restoring are the owner's too.
    expect(
      (
        await h.request('PUT', `/agents/variables/agent/${mine}/TOKEN`, {
          user: 'bob',
          can: READ,
          scope: OWN,
          body: { value: 'x' },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await h.request('PUT', `/agents/variables/agent/${theirs}/TOKEN`, {
          user: 'bob',
          can: READ,
          scope: OWN,
          body: { value: 'x' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('POST', `/agents/${mine}/archive`, {
          user: 'bob',
          can: READ,
          scope: OWN,
        })
      ).status,
    ).toBe(200);
    // Creating agents still needs managing them.
    expect(
      (
        await h.request('POST', '/agents', {
          user: 'bob',
          can: READ,
          scope: OWN,
          body: { name: 'New', modelEntries: [{ tool: 'claude' }] },
        })
      ).status,
    ).toBe(403);
  });

  it('gives an agent only what its owner may grant', async () => {
    h = await createHarness();
    h.services.gate.set({
      allowed: (identity) =>
        Promise.resolve(
          new Set(identity.userId === 'bob' ? ['crm.deals/view'] : []),
        ),
    });
    const id = await h.createAgent({
      ownerUserId: 'bob',
      actions: ['crm.deals/close'],
    });
    const edit = (body: object) =>
      h.request('PATCH', `/agents/${id}`, {
        user: 'bob',
        can: READ,
        scope: OWN,
        body,
      });
    const beyond = await edit({
      actions: ['crm.deals/close', 'crm.deals/comment'],
      expectedRevision: 1,
    });
    expect(beyond.status).toBe(403);
    expect(beyond.body.error.message).toMatch(/crm\.deals\/comment/u);
    // What it already had stays; what the owner holds may be added.
    const within = await edit({
      actions: ['crm.deals/close', 'crm.deals/view'],
      expectedRevision: 1,
    });
    expect(within.status).toBe(200);
    expect(
      (await edit({ ownerUserId: 'carol', expectedRevision: 2 })).status,
    ).toBe(403);
    // A manager of agents gives what they choose.
    expect(
      (
        await patch(id, {
          actions: ['crm.deals/comment'],
          ownerUserId: 'carol',
          expectedRevision: 2,
        })
      ).status,
    ).toBe(200);
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

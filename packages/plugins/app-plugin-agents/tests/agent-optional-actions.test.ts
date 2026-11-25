/**
 * Optional business actions (`AgentDefaults.optionalActions`): off for every discovered agent until someone who
 * manages agents turns them on for one, kept per agent when the defaults are applied again.
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { ToolInfo } from '@nocobase/agent-protocol';

import { createHarness, type Harness } from './harness.js';

const claude = (model: string): ToolInfo => ({
  kind: 'claude',
  authenticated: true,
  models: [{ id: model }],
});

describe('optional agent actions', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('starts off, is turned on and off per agent by a manager of agents, and survives applying the defaults', async () => {
    h = await createHarness();
    const defaults = () => ({
      instructions: null,
      actions: ['crm.deals/view', 'crm.skills/read'],
      optionalActions: ['crm.skills/read', 'crm.skills/manage'],
      recommendedModels: [
        { tool: 'claude' as const, model: 'claude-sonnet-5' },
        { tool: 'claude' as const, model: 'claude-opus-5-5' },
      ],
    });
    h.services.agents.setDefaults(defaults);
    await h.registerRunner({ tools: [claude('claude-sonnet-5')] });
    await h.registerRunner({ tools: [claude('claude-opus-5-5')] });
    const agents = await h.services.agents.list();
    expect(agents).toHaveLength(2);
    // An optional action is never a default, even when the application lists it among them.
    for (const agent of agents)
      expect(agent.actions).toEqual(['crm.deals/view']);
    const [first, second] = agents as [
      (typeof agents)[number],
      (typeof agents)[number],
    ];

    const patch = (
      optionalActions: readonly string[],
      expectedRevision: number,
      can: readonly string[] = ['agents.agents/manage'],
    ) =>
      h.request('PATCH', `/agents/${first.id}`, {
        user: 'alice',
        can,
        body: { optionalActions, expectedRevision },
      });
    // Reading agents is not enough to change them.
    expect(
      (await patch(['crm.skills/read'], first.revision, ['agents.agents/read']))
        .status,
    ).toBe(403);
    const unknown = await patch(['crm.deals/view'], first.revision);
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.metadata).toMatchObject({
      field: 'optionalActions',
      reason: 'ACTION_NOT_OPTIONAL',
    });

    const on = await patch(
      ['crm.skills/manage', 'crm.skills/read'],
      first.revision,
    );
    expect(on.status).toBe(200);
    expect(on.body.data.actions).toEqual([
      'crm.deals/view',
      'crm.skills/read',
      'crm.skills/manage',
    ]);
    // The other agent is untouched.
    expect((await h.services.agents.get(second.id)).actions).toEqual([
      'crm.deals/view',
    ]);
    // Applying the defaults again (a restart) keeps the choice; a changed default still reaches the agent.
    h.services.agents.setDefaults(() => ({
      ...defaults(),
      actions: ['crm.deals/view', 'crm.deals/edit'],
    }));
    expect(await h.services.agents.applyDefaults()).toBe(2);
    expect((await h.services.agents.get(first.id)).actions).toEqual([
      'crm.deals/view',
      'crm.deals/edit',
      'crm.skills/read',
      'crm.skills/manage',
    ]);
    expect(await h.services.agents.applyDefaults()).toBe(0);

    // Turning one off keeps the other; the history records each change.
    const current = await h.services.agents.get(first.id);
    const off = await patch(['crm.skills/read'], current.revision);
    expect(off.body.data.actions).toEqual([
      'crm.deals/view',
      'crm.deals/edit',
      'crm.skills/read',
    ]);
    const history = await h.services.agents.history(first.id);
    expect(
      history.filter((change) =>
        change.changes.some((entry) => entry.field === 'actions'),
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });
});

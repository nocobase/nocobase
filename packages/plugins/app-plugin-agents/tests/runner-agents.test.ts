/**
 * Agents discovered from runners: one agent per coding tool and normalized model whatever reports it, pending until
 * someone enables it; where each can run for whom (team runners, personal runners only, others' personal runners);
 * hidden from the roster once no runner reported it for 14 days and back on the next report; and a model a run found
 * unavailable on a runner kept off that runner until it reports the tool's models differently.
 */
import type { ToolInfo } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import { runnerAgentId } from '../server/core/agents/index.js';
import { claim, createHarness, type Harness } from './harness.js';

const DAY = 24 * 60 * 60_000;

const claude = (...models: string[]): ToolInfo => ({
  kind: 'claude',
  authenticated: true,
  models: models.map((id) => ({ id })),
  modelsDetectionStatus: 'detected',
});

describe('agents discovered from runners', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const heartbeat = (key: string, tools: readonly ToolInfo[]) =>
    h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: key,
      body: {
        version: '0.0.2',
        features: ['input'],
        tools,
        active: [],
        load: { slots: 1, free: 1 },
      },
    });

  const enable = async (id: string, description = 'Reviews code') => {
    const agent = await h.services.agents.get(id);
    return h.services.agents.update(id, 'alice', {
      description,
      enabled: true,
      expectedRevision: agent.revision,
    });
  };

  it('keeps one pending agent per tool and model, whatever reports it under whichever spelling', async () => {
    h = await createHarness();
    await h.registerRunner({
      name: 'dev-1',
      tools: [claude('claude-haiku-4-5-20251001', 'claude-sonnet-5')],
    });
    await h.registerRunner({
      name: 'dev-2',
      tools: [
        claude('claude-haiku-4-5'),
        {
          kind: 'codex',
          authenticated: false,
          models: [{ id: 'gpt-6-astra' }],
        },
      ],
    });
    const agents = await h.services.agents.list();
    expect(
      agents.map((agent) => [
        agent.name,
        agent.tool,
        agent.model,
        agent.status,
        agent.source,
      ]),
    ).toEqual([
      ['Claude · Haiku 4.5', 'claude', 'claude-haiku-4-5', 'pending', 'runner'],
      ['Claude · Sonnet 5', 'claude', 'claude-sonnet-5', 'pending', 'runner'],
    ]);
    expect(agents[0]!.id).toBe(runnerAgentId('claude', 'claude-haiku-4-5'));
    expect(agents[0]!.modelEntries).toEqual([
      { tool: 'claude', model: 'claude-haiku-4-5', effort: 'medium' },
    ]);
    // Pending: not offered work, and not in anyone's roster.
    expect(await h.services.roster(h.services.tx.read(), 'alice')).toEqual([]);
  });

  it('gives each discovered agent the application’s instructions and actions', async () => {
    h = await createHarness();
    h.services.agents.setDefaults(() => ({
      instructions: 'Do the one step you are given.',
      actions: ['crm.deals/view', 'crm.deals/view'],
    }));
    await h.registerRunner({ tools: [claude('claude-sonnet-5')] });
    const [agent] = await h.services.agents.list();
    expect(agent).toMatchObject({
      instructions: 'Do the one step you are given.',
      actions: ['crm.deals/view'],
    });
    h.services.agents.setDefaults(() => ({
      instructions: 'Reply once.',
      actions: [],
    }));
    expect(await h.services.agents.applyDefaults()).toBe(1);
    expect(await h.services.agents.get(agent!.id)).toMatchObject({
      instructions: 'Reply once.',
      actions: [],
    });
    expect(await h.services.agents.applyDefaults()).toBe(0);
  });

  it('says where an agent can run for whom, and hides one no runner reported for 14 days', async () => {
    h = await createHarness();
    const mine = await h.registerRunner({
      name: 'alice-mac',
      trust: 'ownerOnly',
      ownerUserId: 'alice',
      tools: [claude('claude-sonnet-5')],
    });
    const id = runnerAgentId('claude', 'claude-sonnet-5');
    await enable(id, 'Small changes');
    const conn = h.services.tx.read();
    const [asAlice] = await h.services.views(conn, 'alice', { canEdit: true });
    expect(asAlice).toMatchObject({
      status: 'enabled',
      reported: true,
      runners: { team: 0, personal: 1, mine: 1, names: ['alice-mac'] },
      personalOnly: true,
      unusable: null,
      canEdit: true,
      suggestion: {
        en: 'Well-scoped implementation, small fixes, tests and wording.',
      },
    });
    const [asBob] = await h.services.views(conn, 'bob', { canEdit: false });
    expect(asBob).toMatchObject({ unusable: 'othersPersonal', canEdit: false });
    expect(await h.services.roster(conn, 'bob')).toEqual([
      expect.objectContaining({ id, online: false, personalOnly: true }),
    ]);
    // A team runner takes everyone's work.
    await h.registerRunner({
      name: 'dev-2',
      tools: [claude('claude-sonnet-5')],
    });
    expect(await h.services.roster(conn, 'bob')).toEqual([
      expect.objectContaining({
        id,
        goodAt: 'Small changes',
        online: true,
        personalOnly: false,
      }),
    ]);

    // Fifteen days without a report: kept, but no runner and out of the roster.
    h.clock.advance(15 * DAY);
    const [stale] = await h.services.views(conn, 'bob', { canEdit: false });
    expect(stale).toMatchObject({ reported: false, unusable: 'unreported' });
    expect(await h.services.roster(conn, 'bob')).toEqual([]);
    // Reported again: back as it was.
    await heartbeat(mine.key, [claude('claude-sonnet-5')]);
    expect(await h.services.agents.get(id)).toMatchObject({
      status: 'enabled',
      description: 'Small changes',
      lastReportedAt: h.clock.now().toISOString(),
    });
    expect(await h.services.roster(conn, 'alice')).toHaveLength(1);
  });

  it('refreshes when a model was last reported at most every ten minutes', async () => {
    h = await createHarness();
    const runner = await h.registerRunner({
      tools: [claude('claude-sonnet-5')],
    });
    const id = runnerAgentId('claude', 'claude-sonnet-5');
    const first = (await h.services.agents.get(id)).lastReportedAt;
    h.clock.advance(60_000);
    await heartbeat(runner.key, [claude('claude-sonnet-5')]);
    expect((await h.services.agents.get(id)).lastReportedAt).toBe(first);
    h.clock.advance(10 * 60_000);
    await heartbeat(runner.key, [claude('claude-sonnet-5')]);
    expect((await h.services.agents.get(id)).lastReportedAt).toBe(
      h.clock.now().toISOString(),
    );
  });

  it('keeps a model a run found unavailable off that runner until it reports the tool differently', async () => {
    h = await createHarness();
    const dev1 = await h.registerRunner({
      name: 'dev-1',
      tools: [claude('claude-opus-5-5')],
    });
    const id = runnerAgentId('claude', 'claude-opus-5-5');
    await enable(id);
    const runId = await h.enqueue(id, '1');
    expect(await claim(h, dev1)).toHaveLength(1);
    await h.services.reports.fail({ id: dev1.runnerId }, runId, {
      reason: 'modelUnavailable',
      detail: 'The model is not available to this account.',
    });
    expect(
      (await h.services.runners.get(dev1.runnerId)).unavailableModels,
    ).toMatchObject([
      {
        tool: 'claude',
        model: 'claude-opus-5-5',
        reported: ['claude-opus-5-5'],
      },
    ]);
    await h.enqueue(id, '2');
    expect(await claim(h, dev1)).toEqual([]);
    // The same report keeps the mark; a different one lifts it.
    await heartbeat(dev1.key, [claude('claude-opus-5-5')]);
    expect(await claim(h, dev1)).toEqual([]);
    await heartbeat(dev1.key, [claude('claude-opus-5-5', 'claude-sonnet-5')]);
    expect(
      (await h.services.runners.get(dev1.runnerId)).unavailableModels,
    ).toEqual([]);
    expect(await claim(h, dev1)).toHaveLength(1);
  });
});

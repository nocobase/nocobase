/**
 * Agents built from what runners report. A runner reporting a tool and model signed in no longer creates an agent by
 * itself: only a combination in the application's recommended list does, already enabled (`syncRunner`); every other
 * one only joins the available models list (`availableModels`) until someone creates one from it
 * (`createFromAvailable`). Once an agent exists, visibility (team runners, personal runners, 14-day unreported) and
 * stale refresh behave as before.
 */
import type { ToolInfo } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import { availableModels } from '../server/core/agents/available-models.js';
import { catalogEntry } from '../shared/model-catalog.js';
import { runnerAgentId } from '../server/core/agents/index.js';
import { claim, createHarness, type Harness } from './harness.js';

const DAY = 24 * 60 * 60_000;

const claude = (...models: string[]): ToolInfo => ({
  kind: 'claude',
  authenticated: true,
  models: models.map((id) => ({ id })),
  modelsDetectionStatus: 'detected',
});

describe('agents built from runner reports', () => {
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

  it('creates no agent for a reported tool and model outside the recommended list, only lists it as available', async () => {
    h = await createHarness();
    await h.registerRunner({
      tools: [claude('claude-haiku-4-5-20251001', 'claude-sonnet-5')],
    });
    expect(await h.services.agents.list()).toEqual([]);
    const conn = h.services.tx.read();
    const models = availableModels(
      await h.services.runners.all(conn),
      await h.services.agents.list(),
      {
        recommendedModels: h.services.agents.recommended(),
        suggestion: h.services.agents.suggestion,
      },
    );
    expect(
      models.map((model) => [model.tool, model.model, model.agentId, model.status]),
    ).toEqual([
      ['claude', 'claude-haiku-4-5', null, null],
      ['claude', 'claude-sonnet-5', null, null],
    ]);
  });

  it('auto-creates and enables a recommended combination as soon as a runner reports it signed in, once', async () => {
    h = await createHarness();
    h.services.agents.setDefaults(() => ({
      instructions: null,
      actions: [],
      modelDescriptions: {
        claude: {
          'claude-sonnet-5': { en: 'Routine work', zh: '常规工作' },
        },
      },
      recommendedModels: [{ tool: 'claude', model: 'claude-sonnet-5' }],
    }));
    const runner = await h.registerRunner({
      tools: [claude('claude-haiku-4-5', 'claude-sonnet-5')],
    });
    const agents = await h.services.agents.list();
    expect(agents).toHaveLength(1);
    const [agent] = agents;
    expect(agent).toMatchObject({
      name: 'Claude · Sonnet 5',
      tool: 'claude',
      model: 'claude-sonnet-5',
      status: 'enabled',
      description: 'Routine work',
      source: 'runner',
    });
    expect(agent!.id).toBe(runnerAgentId('claude', 'claude-sonnet-5'));
    // Not pending: already in the roster.
    expect(await h.services.roster(h.services.tx.read(), 'alice')).toHaveLength(
      1,
    );
    // A later report of the same combination never creates a second one.
    await heartbeat(runner.key, [claude('claude-sonnet-5')]);
    expect(await h.services.agents.list()).toHaveLength(1);
  });

  it('never re-enables or recreates a recommended combination someone disabled or that already exists', async () => {
    h = await createHarness();
    h.services.agents.setDefaults(() => ({
      instructions: null,
      actions: [],
      recommendedModels: [{ tool: 'claude', model: 'claude-sonnet-5' }],
    }));
    await h.registerRunner({ tools: [claude('claude-sonnet-5')] });
    const [agent] = await h.services.agents.list();
    await h.services.agents.update(agent!.id, 'alice', {
      enabled: false,
      expectedRevision: agent!.revision,
    });
    await h.registerRunner({
      name: 'dev-2',
      tools: [claude('claude-sonnet-5')],
    });
    expect(await h.services.agents.list()).toHaveLength(1);
    expect((await h.services.agents.get(agent!.id)).status).toBe('disabled');
  });

  it('creates and enables an agent from the available models list, naming it uniquely and failing on a duplicate', async () => {
    h = await createHarness();
    await h.registerRunner({ tools: [claude('claude-haiku-4-5')] });
    const agent = await h.services.agents.createFromAvailable(
      { tool: 'claude', model: 'claude-haiku-4-5', description: 'Small fixes' },
      'alice',
    );
    expect(agent).toMatchObject({
      name: 'Claude · Haiku 4.5',
      status: 'enabled',
      description: 'Small fixes',
      tool: 'claude',
      model: 'claude-haiku-4-5',
    });
    await expect(
      h.services.agents.createFromAvailable(
        { tool: 'claude', model: 'claude-haiku-4-5', description: 'Again' },
        'alice',
      ),
    ).rejects.toMatchObject({ details: { reason: 'AGENT_EXISTS' } });
    await expect(
      h.services.agents.createFromAvailable(
        { tool: 'claude', model: 'claude-opus-5-5', description: '   ' },
        'alice',
      ),
    ).rejects.toMatchObject({ details: { reason: 'GOOD_AT_REQUIRED' } });
    await expect(
      h.services.agents.createFromAvailable(
        {
          tool: 'claude',
          model: 'claude-opus-5-5',
          description: 'Reviews',
          effort: 'not-a-real-effort',
        },
        'alice',
      ),
    ).rejects.toMatchObject({ details: { reason: 'EFFORT_UNSUPPORTED' } });
  });

  it('prefers application suggestions over the model catalog, for a model reported but not yet created too', async () => {
    h = await createHarness();
    const suggestion = { en: 'Application suggestion', zh: '应用建议' };
    const remove = h.services.agents.setDefaults(() => ({
      instructions: null,
      actions: [],
      modelDescriptions: { claude: { 'claude-sonnet-5': suggestion } },
    }));
    expect(h.services.agents.suggestion('claude', 'claude-sonnet-5')).toEqual(
      suggestion,
    );
    expect(h.services.agents.suggestion('claude', 'claude-haiku-4-5')).toEqual(
      catalogEntry('claude', 'claude-haiku-4-5')!.goodAt,
    );
    remove();
    expect(h.services.agents.suggestion('claude', 'claude-sonnet-5')).toEqual(
      catalogEntry('claude', 'claude-sonnet-5')!.goodAt,
    );
    expect(h.services.agents.suggestion('claude', 'unknown')).toBeNull();
  });

  it('gives each discovered agent the application’s instructions and actions, applying later changes without touching an edited description', async () => {
    h = await createHarness();
    h.services.agents.setDefaults(() => ({
      instructions: 'Do the one step you are given.',
      actions: ['crm.deals/view', 'crm.deals/view'],
      recommendedModels: [{ tool: 'claude', model: 'claude-sonnet-5' }],
    }));
    await h.registerRunner({ tools: [claude('claude-sonnet-5')] });
    const [agent] = await h.services.agents.list();
    expect(agent).toMatchObject({
      instructions: 'Do the one step you are given.',
      actions: ['crm.deals/view'],
    });
    await h.services.agents.update(agent!.id, 'alice', {
      description: 'My own words',
      expectedRevision: agent!.revision,
    });
    h.services.agents.setDefaults(() => ({
      instructions: 'Reply once.',
      actions: [],
    }));
    expect(await h.services.agents.applyDefaults()).toBe(1);
    const after = await h.services.agents.get(agent!.id);
    expect(after).toMatchObject({
      instructions: 'Reply once.',
      actions: [],
      description: 'My own words',
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
    const { id } = await h.services.agents.createFromAvailable(
      { tool: 'claude', model: 'claude-sonnet-5', description: 'Small changes' },
      'alice',
    );
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
    const { id } = await h.services.agents.createFromAvailable(
      { tool: 'claude', model: 'claude-sonnet-5', description: 'Reviews' },
      'alice',
    );
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
    const { id } = await h.services.agents.createFromAvailable(
      { tool: 'claude', model: 'claude-opus-5-5', description: 'Design' },
      'alice',
    );
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

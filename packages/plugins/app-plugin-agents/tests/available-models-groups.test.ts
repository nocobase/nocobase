/**
 * The enable drawer's two-tier list (`GET /agents/availableModels`): group summaries, one row per tool, and each
 * tool's models a page at a time. Covers what the flat list could not: a tool with many more models than a dialog
 * should ever fetch at once, a tool down on one runner but up on another, and search across both tool and model
 * names.
 */
import type { AgentTool, ToolInfo } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import { recordChange } from '../server/core/agents/agent.history.js';
import { insertAgent } from '../server/core/agents/agent.store.js';
import { runnerAgentId } from '../server/core/agents/agent.service.js';
import { agentNameOf } from '../shared/model-catalog.js';
import { createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});

/** An existing disabled agent remains in the model catalog. */
async function seedDisabledAgent(
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
      status: 'disabled',
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

const kilo = (count: number): ToolInfo => ({
  kind: 'kilo',
  authenticated: true,
  status: 'ready',
  models: Array.from({ length: count }, (_, index) => ({
    id: `model-${index}`,
  })),
  modelsDetectionStatus: 'detected',
});

describe('available models groups', () => {
  it('marks enabled and disabled agents as added, and adds a missing model directly enabled', async () => {
    h = await createHarness();
    await h.registerRunner({ enabledTools: ['kilo'], tools: [kilo(3)] });
    const create = (model: string) =>
      h.request('POST', '/agents/runnerAgents', {
        user: 'admin',
        can: ['agents.agents/manage'],
        body: { tool: 'kilo', model, description: 'Test model' },
      });
    const enabled = await create('model-0');
    const disabled = await create('model-1');
    expect(enabled.status).toBe(201);
    await h.services.agents.update(disabled.body.data.id, 'admin', {
      enabled: false,
      expectedRevision: 1,
    });
    const rows = await h.request('GET', '/agents/availableModels?tool=kilo', {
      user: 'admin',
      can: ['agents.agents/read'],
    });
    expect(
      rows.body.data.map((row: { model: string; status: string | null }) => [
        row.model,
        row.status,
      ]),
    ).toEqual([
      ['model-0', 'enabled'],
      ['model-1', 'disabled'],
      ['model-2', null],
    ]);
    expect(await h.services.agents.list()).toHaveLength(2);
    expect((await create('model-2')).body.data.status).toBe('enabled');
    for (const model of ['model-0', 'model-1', 'model-2']) {
      const duplicate = await create(model);
      expect(duplicate.status).toBe(400);
      expect(duplicate.body.error.metadata.reason).toBe('AGENT_EXISTS');
    }
    expect(
      (
        await h.request('POST', '/agents/runnerAgents', {
          body: { tool: 'kilo', model: 'model-3', description: 'Test' },
        })
      ).status,
    ).toBe(401);
    expect((await h.request('GET', '/agents/availableModels')).status).toBe(
      401,
    );
  });

  it('no longer exposes discovery preferences or cleanup routes', async () => {
    h = await createHarness();
    for (const [method, route] of [
      ['PUT', 'discoveryPreferences'],
      ['GET', 'cleanupCandidates'],
      ['POST', 'cleanup'],
    ] as const) {
      expect(
        (
          await h.request(method, `/agents/${route}`, {
            user: 'admin',
            can: ['agents.agents/manage'],
            body: method === 'GET' ? undefined : {},
          })
        ).status,
      ).toBe(404);
    }
  });

  it('keeps a failed historical model in a ready tool with matching row and group counts', async () => {
    h = await createHarness();
    await seedDisabledAgent(h, 'claude', 'historical-model');
    await h.registerRunner({
      enabledTools: ['claude'],
      tools: [
        {
          kind: 'claude',
          authenticated: true,
          status: 'ready',
          models: [{ id: 'online-model' }],
        },
      ],
    });
    const read = async (suffix: string) =>
      (
        await h.request('GET', '/agents/availableModels' + suffix, {
          user: 'admin',
          can: ['agents.agents/read'],
        })
      ).body;
    for (const [status, model] of [
      ['available', 'online-model'],
      ['failed', 'historical-model'],
    ]) {
      const groups = await read('?status=' + status);
      expect(groups.data).toEqual([
        expect.objectContaining({
          tool: 'claude',
          status: 'available',
          modelCount: 1,
        }),
      ]);
      const rows = await read('?tool=claude&status=' + status);
      expect(rows.meta.total).toBe(1);
      expect(rows.data).toEqual([
        expect.objectContaining({ model, availability: status }),
      ]);
    }
    expect((await read('')).data).toEqual([
      expect.objectContaining({ tool: 'claude', modelCount: 2 }),
    ]);
    const first = await read('?tool=claude&page=1&pageSize=1');
    const second = await read('?tool=claude&page=2&pageSize=1');
    expect(first.meta.total).toBe(2);
    expect(second.meta.total).toBe(2);
    expect(
      [...first.data, ...second.data].map(
        (row: { model: string }) => row.model,
      ),
    ).toEqual(['historical-model', 'online-model']);
    expect((await read('?q=historical&status=failed')).data).toEqual([
      expect.objectContaining({ modelCount: 1 }),
    ]);
    expect(
      (await read('?tool=claude&q=historical&status=failed')).data,
    ).toEqual([expect.objectContaining({ model: 'historical-model' })]);
    expect(
      (await read('?tool=claude&q=historical&status=available')).data,
    ).toEqual([]);
  });

  it('lists one group per tool with its model count, never shipping a large tool’s models unasked', async () => {
    h = await createHarness();
    await h.registerRunner({
      enabledTools: ['claude', 'kilo'],
      tools: [
        {
          kind: 'claude',
          authenticated: true,
          models: [{ id: 'claude-sonnet-5' }],
        },
        kilo(60),
      ],
    });
    const groups = await h.request('GET', '/agents/availableModels', {
      user: 'admin',
      can: ['agents.agents/read'],
    });
    expect(groups.status).toBe(200);
    expect(groups.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tool: 'claude', modelCount: 1 }),
        expect.objectContaining({
          tool: 'kilo',
          modelCount: 60,
          status: 'available',
        }),
      ]),
    );
    // The group call never carries a single kilo model: that only comes from the tool-scoped, paged call.
    expect(JSON.stringify(groups.body.data)).not.toContain('model-0');
  });

  it('pages one tool’s models, and cross-page selection only needs the ids, not every page loaded first', async () => {
    h = await createHarness();
    await h.registerRunner({
      enabledTools: ['kilo'],
      tools: [kilo(60)],
    });
    const first = await h.request(
      'GET',
      '/agents/availableModels?tool=kilo&page=1&pageSize=25',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(first.body.data).toHaveLength(25);
    expect(first.body.meta).toEqual({ total: 60, page: 1, pageSize: 25 });
    const third = await h.request(
      'GET',
      '/agents/availableModels?tool=kilo&page=3&pageSize=25',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    // Page 3 of 25 holds the last 10: selecting "everything" needs only total and page math, not every row in memory.
    expect(third.body.data).toHaveLength(10);
    expect(third.body.meta.total).toBe(60);
  });

  it('searches by tool name and by model name, across the group and the row list', async () => {
    h = await createHarness();
    await h.registerRunner({
      enabledTools: ['claude', 'qwen'],
      tools: [
        {
          kind: 'claude',
          authenticated: true,
          models: [{ id: 'claude-sonnet-5' }],
        },
        {
          kind: 'qwen',
          authenticated: true,
          models: [{ id: 'qwen3-coder-plus' }],
        },
      ],
    });
    const byTool = await h.request('GET', '/agents/availableModels?q=qwen', {
      user: 'admin',
      can: ['agents.agents/read'],
    });
    expect(byTool.body.data).toEqual([
      expect.objectContaining({ tool: 'qwen' }),
    ]);
    const byModel = await h.request(
      'GET',
      '/agents/availableModels?tool=claude&q=sonnet',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(byModel.body.data).toEqual([
      expect.objectContaining({ model: 'claude-sonnet-5' }),
    ]);
    const noMatch = await h.request(
      'GET',
      '/agents/availableModels?tool=claude&q=nonexistent',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(noMatch.body.data).toEqual([]);
  });

  it('matches a model’s own id even when its display name reads differently', async () => {
    h = await createHarness();
    await h.registerRunner({
      enabledTools: ['kilo'],
      tools: [
        {
          kind: 'kilo',
          authenticated: true,
          models: [{ id: 'model-25', name: 'Kilo Model 25' }],
        },
      ],
    });
    const byId = await h.request(
      'GET',
      '/agents/availableModels?tool=kilo&q=model-25',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(byId.body.data).toEqual([
      expect.objectContaining({
        model: 'model-25',
        displayModel: 'Kilo Model 25',
      }),
    ]);
  });

  it('aggregates a tool’s availability across its runners: one down one does not hide another’s ready models', async () => {
    h = await createHarness();
    await h.registerRunner({
      name: 'blocked',
      enabledTools: ['amp'],
      tools: [
        {
          kind: 'amp',
          authenticated: false,
          status: 'needsLogin',
          statusReason: 'notLoggedIn',
          statusDetail: 'Run `amp login` first.',
        },
      ],
    });
    await h.registerRunner({
      name: 'working',
      enabledTools: ['amp'],
      tools: [
        {
          kind: 'amp',
          authenticated: true,
          status: 'ready',
          models: [{ id: 'default' }],
        },
      ],
    });
    const groups = await h.request('GET', '/agents/availableModels', {
      user: 'admin',
      can: ['agents.agents/read'],
    });
    expect(groups.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tool: 'amp',
          status: 'available',
          runnerCount: 2,
        }),
      ]),
    );
  });

  it('reports why a tool is unavailable, with the tool’s own words, when every runner reporting it agrees', async () => {
    h = await createHarness();
    await h.registerRunner({
      enabledTools: ['amp'],
      tools: [
        {
          kind: 'amp',
          authenticated: false,
          status: 'needsLogin',
          statusReason: 'notLoggedIn',
          statusDetail: 'Run `amp login` first.',
        },
      ],
    });
    const groups = await h.request('GET', '/agents/availableModels', {
      user: 'admin',
      can: ['agents.agents/read'],
    });
    expect(groups.body.data).toEqual([
      expect.objectContaining({
        tool: 'amp',
        status: 'needsSetup',
        statusReason: 'notLoggedIn',
        statusDetail: 'Run `amp login` first.',
        modelCount: 0,
      }),
    ]);
    // Nothing to select: the tool reported no models while down, so its row list is empty too.
    const rows = await h.request('GET', '/agents/availableModels?tool=amp', {
      user: 'admin',
      can: ['agents.agents/read'],
    });
    expect(rows.body.data).toEqual([]);
  });

  it('buckets version-too-old separately from not-configured, which joins needs-setup, for the status filter', async () => {
    h = await createHarness();
    await h.registerRunner({
      name: 'gemini-old',
      enabledTools: ['gemini'],
      tools: [
        {
          kind: 'gemini',
          authenticated: false,
          status: 'failed',
          statusReason: 'versionTooOld',
        },
      ],
    });
    await h.registerRunner({
      name: 'goose-unset',
      enabledTools: ['goose'],
      tools: [
        {
          kind: 'goose',
          authenticated: false,
          status: 'failed',
          statusReason: 'notConfigured',
        },
      ],
    });
    const tooOld = await h.request(
      'GET',
      '/agents/availableModels?status=versionTooOld',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(tooOld.body.data).toEqual([
      expect.objectContaining({ tool: 'gemini', status: 'versionTooOld' }),
    ]);
    const needsSetup = await h.request(
      'GET',
      '/agents/availableModels?status=needsSetup',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(needsSetup.body.data).toEqual([
      expect.objectContaining({ tool: 'goose', status: 'needsSetup' }),
    ]);
  });

  it('keeps unconfirmed sign-in in detection failure rather than claiming setup is missing', async () => {
    h = await createHarness();
    await h.registerRunner({
      enabledTools: ['amp'],
      tools: [
        {
          kind: 'amp',
          authenticated: false,
          status: 'failed',
          statusReason: 'signInUnconfirmed',
          statusDetail: 'The adapter cannot confirm native CLI login.',
        },
      ],
    });
    const failed = await h.request(
      'GET',
      '/agents/availableModels?status=failed',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(failed.body.data).toEqual([
      expect.objectContaining({
        tool: 'amp',
        status: 'failed',
        statusReason: 'signInUnconfirmed',
      }),
    ]);
    const setup = await h.request(
      'GET',
      '/agents/availableModels?status=needsSetup',
      { user: 'admin', can: ['agents.agents/read'] },
    );
    expect(setup.body.data).toEqual([]);
  });

  it('refuses the list to someone without agents.agents read', async () => {
    h = await createHarness();
    const denied = await h.request('GET', '/agents/availableModels', {
      user: 'nobody',
      can: [],
    });
    expect(denied.status).toBe(403);
  });
});

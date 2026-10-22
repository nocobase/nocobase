import type { Knex } from 'knex';
import { afterEach, expect, it } from 'vitest';
import { createHarness, claim, type Harness } from './harness.js';
import { availableModels } from '../../server/core/agents/available-models.js';
import { runnerAgentId } from '../../server/core/agents/agent.service.js';
import { PROTOCOL_VERSION } from '@nocobase/agent-protocol';
let h: Harness;
afterEach(async () => h?.close());

it('discovers separate catalog tools, preserves opaque model ids, and names the default agent after the tool', async () => {
  h = await createHarness();
  const first = await h.registerRunner({
    enabledTools: ['gemini', 'kimi'],
    tools: [
      {
        kind: 'gemini',
        authenticated: true,
        status: 'ready',
        models: [{ id: 'model-latest', name: 'Current model' }],
        modelsDetectionStatus: 'detected',
      },
      {
        kind: 'kimi',
        authenticated: true,
        status: 'ready',
        modelsDetectionStatus: 'unsupported',
      },
    ],
  });
  // Neither combination is recommended: a runner's report lists them as available, creating no agent by itself.
  const available = availableModels(
    await h.services.runners.all(h.services.tx.read()),
    [],
    { recommendedModels: [], suggestion: h.services.agents.suggestion },
  );
  expect(available).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ tool: 'gemini', model: 'model-latest' }),
      expect.objectContaining({ tool: 'kimi', model: '' }),
    ]),
  );
  expect(available.every((model) => model.agentId === null)).toBe(true);
  await h.services.agents.createFromAvailable(
    {
      tool: 'gemini',
      model: 'model-latest',
      displayModel: 'Current model',
      description: 'Reviews',
    },
    'alice',
  );
  const defaultAgent = await h.services.agents.createFromAvailable(
    { tool: 'kimi', model: '', description: 'Reviews' },
    'alice',
  );
  const agents = await h.services.agents.list();
  expect(agents).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: runnerAgentId('gemini', 'model-latest'),
        name: 'Gemini CLI · Current model',
        model: 'model-latest',
      }),
      expect.objectContaining({
        id: runnerAgentId('kimi', ''),
        name: 'Kimi CLI',
        model: null,
        modelEntries: [{ tool: 'kimi', model: null, effort: null }],
      }),
    ]),
  );
  const defaultId = defaultAgent.id;
  expect(defaultId).toBe(runnerAgentId('kimi', ''));
  await h.enqueue(defaultId);
  const [payload] = await claim(h, first);
  expect(payload.tool.kind).toBe('kimi');
  expect(payload.tool).not.toHaveProperty('model');
  const second = await h.registerRunner({
    enabledTools: ['kimi'],
    tools: [
      {
        kind: 'kimi',
        authenticated: true,
        models: [{ id: 'model-latest' }],
        modelsDetectionStatus: 'detected',
      },
    ],
  });
  const afterSecond = availableModels(
    await h.services.runners.all(h.services.tx.read()),
    await h.services.agents.list(),
    { recommendedModels: [], suggestion: h.services.agents.suggestion },
  );
  expect(afterSecond).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ tool: 'kimi', model: 'model-latest' }),
    ]),
  );
  expect((await h.services.runners.get(second.runnerId)).enabledTools).toEqual([
    'kimi',
  ]);
});

it('sends selections on registration and heartbeat, filters disabled reports, and refreshes only on an explicit signal', async () => {
  h = await createHarness();
  const runner = await h.registerRunner({
    ownerUserId: 'owner',
    enabledTools: ['gemini'],
    tools: [],
  });
  const heartbeat = async () =>
    h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: 'test',
        features: [],
        tools: [
          {
            kind: 'gemini',
            authenticated: true,
            modelsDetectionStatus: 'unsupported',
          },
          {
            kind: 'kimi',
            authenticated: true,
            modelsDetectionStatus: 'unsupported',
          },
        ],
        active: [],
        load: { free: 1, slots: 1 },
      },
    });
  expect((await heartbeat()).body.data).toMatchObject({
    enabledTools: ['gemini'],
    detectTools: false,
    protocolVersion: PROTOCOL_VERSION,
  });
  expect(
    (await h.services.runners.get(runner.runnerId)).tools.map(
      (tool) => tool.kind,
    ),
  ).toEqual(['gemini']);
  await heartbeat();
  const client = await h.database.connection().client<Knex>();
  const statements: string[] = [];
  const observe = (query: { sql: string }) => statements.push(query.sql);
  client.on('query', observe);
  try {
    expect((await heartbeat()).status).toBe(200);
  } finally {
    client.off('query', observe);
  }
  const count = (kind: string) =>
    statements.filter((sql) => new RegExp(`^${kind}`, 'i').test(sql)).length;
  const cost = {
    select: count('select'),
    insert: count('insert'),
    update: count('update'),
    delete: count('delete'),
  };
  expect(cost.insert).toBe(0);
  // Existing authentication touches the runtime and credential; the heartbeat updates its runtime row once.
  expect(cost.update).toBe(3);
  console.log('cached-acp-heartbeat-cost', JSON.stringify(cost));
  const path = `/agents/runners/${runner.runnerId}`;
  expect(
    (
      await h.request('PATCH', path, {
        user: 'owner',
        body: { redetectTools: true },
      })
    ).status,
  ).toBe(200);
  expect((await heartbeat()).body.data.detectTools).toBe(true);
  expect((await heartbeat()).body.data.detectTools).toBe(false);
  await h.request('PATCH', path, {
    user: 'owner',
    body: { enabledTools: ['kimi'] },
  });
  expect((await heartbeat()).body.data.enabledTools).toEqual(['kimi']);
});

/** Online chat admission, saved defaults and usage follow the enabled chat catalog without deleting history. */
import { afterEach, expect, it } from 'vitest';

import { createHarness, type Harness } from './harness.js';
import { startMockOpenAI, type MockOpenAI } from './mock-openai.js';

let h: Harness;
let mock: MockOpenAI | undefined;
afterEach(async () => {
  await h?.close();
  await mock?.close();
  mock = undefined;
});
const user = 'alice';
const manager = { user, can: ['agents.agents/manage'] };
const missingModel = {
  code: 400,
  status: 'INVALID_ARGUMENT',
  reason: 'INVALID_REQUEST',
  message: 'No enabled chat model is configured.',
};

it('hides unconfigured native chat, validates only submitted defaults and restores saved choices', async () => {
  h = await createHarness();
  const list = () => h.services.conversations.chatAgents(user);
  expect(await list()).toEqual([]);
  for (const path of ['/agents/chatPreferences', '/agents/chatSettings']) {
    const refused = await h.request('PATCH', path, {
      ...manager,
      body: { defaultAgentId: 'online' },
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatchObject(missingModel);
    expect(
      (await h.request('GET', path, { user })).body.data.defaultAgentId,
    ).toBeNull();
  }
  const denied = await h.request('PATCH', '/agents/chatSettings', {
    user,
    body: { defaultAgentId: 'online' },
  });
  expect(denied.status).toBe(403);
  const refused = await h.request('POST', '/agents/conversations', {
    user,
    body: { agentId: 'online' },
  });
  expect(refused.status).toBe(400);
  expect(refused.body.error).toMatchObject(missingModel);
  expect(
    (await h.request('GET', '/agents/conversations', { user })).body.data,
  ).toEqual([]);

  const services = h.services.models.services;
  const service = await services.create({
    title: 'Local',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:1/v1',
    apiKey: 'test',
    models: [{ value: 'embed', kind: 'embedding' }],
  });
  expect(await list()).toEqual([]);
  await services.update(service.name, { models: [{ value: 'chat' }] });
  expect(await list()).toMatchObject([
    { id: 'online', isSystemDefault: true, availability: { online: true } },
  ]);
  for (const path of ['/agents/chatPreferences', '/agents/chatSettings']) {
    expect(
      (
        await h.request('PATCH', path, {
          ...manager,
          body: { defaultAgentId: 'online' },
        })
      ).status,
    ).toBe(200);
  }
  await services.update(service.name, { enabled: false });
  const runner = await h.createAgent({ source: 'runner', name: 'Runner' });
  expect(await list()).toMatchObject([
    { id: runner, isSystemDefault: false, isMyDefault: false },
  ]);
  for (const path of ['/agents/chatPreferences', '/agents/chatSettings']) {
    expect(
      (await h.request('GET', path, { user })).body.data.defaultAgentId,
    ).toBe('online');
    expect(
      (await h.request('PATCH', path, { ...manager, body: {} })).status,
    ).toBe(200);
  }
  await h.services.chat.updateSettings(user, { defaultAgentId: runner });
  expect(await list()).toMatchObject([{ id: runner, isSystemDefault: true }]);
  await services.update(service.name, { enabled: true });
  expect(await list()).toMatchObject([
    { id: runner, isSystemDefault: true },
    { id: 'online', isSystemDefault: false, isMyDefault: true },
  ]);
});

it('creates and answers with a configured model, and keeps its conversation readable after disabling it', async () => {
  h = await createHarness();
  mock = await startMockOpenAI();
  mock.answer({ text: ['Hello from the configured model.'] });
  await h.services.models.services.create({
    title: 'Local',
    provider: 'openai-compatible',
    baseUrl: mock.url,
    apiKey: 'test',
    models: [{ value: 'mock-model' }],
  });
  const created = await h.request('POST', '/agents/conversations', {
    user,
    body: { agentId: 'online' },
  });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  const response = await h.app.request(`/agents/conversations/${id}/messages`, {
    method: 'POST',
    headers: { 'x-test-user': user, 'content-type': 'application/json' },
    body: JSON.stringify({
      message: {
        id: 'first',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
    }),
  });
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('Hello from the configured model.');
  expect(mock.requests).toHaveLength(1);
  await h.services.models.services.update('local', { enabled: false });
  expect(
    (await h.request('GET', `/agents/conversations/${id}`, { user })).body.data
      .agent.id,
  ).toBe('online');
  expect(
    (await h.request('GET', `/agents/conversations/${id}/messages`, { user }))
      .status,
  ).toBe(200);
  expect(
    (await h.request('GET', '/agents/conversations', { user })).body.data.map(
      (item: { id: string }) => item.id,
    ),
  ).toContain(id);
  await h.services.models.services.update('local', { enabled: true });
  expect(
    (await h.services.conversations.chatAgents(user)).some(
      (agent) => agent.id === 'online',
    ),
  ).toBe(true);
});

it('filters online history before all usage aggregates and restores it when models are enabled', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const conn = h.database.connection();
  for (const type of ['runner', 'online']) {
    const runId = await h.enqueue(agent, type, { actorUserId: user });
    await conn
      .repository('agRuns')
      .updateMany({ filter: { id: runId }, values: { agentType: type } });
    await conn.repository('agRunUsage').createOne({
      values: {
        id: `usage-${type}`,
        runId,
        tool: type === 'online' ? 'online' : 'claude',
        modelService: type === 'online' ? 'local' : null,
        model: type,
        inputTokens: type === 'online' ? 200 : 100,
        createdAt: h.clock.now().toISOString(),
      },
    });
  }
  await conn.repository('agModelUsage').createOne({
    values: {
      id: 'other-use',
      purpose: 'text',
      source: 'test',
      modelService: 'local',
      model: 'chat',
      inputTokens: 50,
      createdAt: h.clock.now().toISOString(),
    },
  });
  const caller = { userId: user, allRuns: true };
  const read = (groupBy: 'type' | 'model') =>
    h.services.reporting.usage(caller, { groupBy, series: true });
  const hidden = await read('type');
  expect(hidden.rows.map((row) => row.key)).toEqual(['runner']);
  expect(hidden.totals.inputTokens).toBe(100);
  expect(
    hidden.daily.reduce((total, point) => total + point.inputTokens, 0),
  ).toBe(100);
  expect((await read('model')).rows.map((row) => row.key)).toHaveLength(1);
  expect((await h.services.reporting.modelUsage(caller, {})).rows).toEqual([]);
  await h.services.models.services.create({
    title: 'Local',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:1/v1',
    apiKey: 'test',
    models: [{ value: 'chat' }],
  });
  expect((await read('type')).rows.map((row) => row.key).sort()).toEqual([
    'online',
    'runner',
  ]);
  expect((await read('model')).totals.inputTokens).toBe(300);
  expect((await h.services.reporting.modelUsage(caller, {})).rows).toHaveLength(
    1,
  );
});

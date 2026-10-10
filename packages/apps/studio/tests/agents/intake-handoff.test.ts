// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.addUser('bob');
});
afterEach(() => h.close());

const submit = (agentId?: string, user = 'alice') =>
  h.request('POST', '/organizeIntake', {
    user,
    body: { text: 'Keep the requirement', ...(agentId ? { agentId } : {}) },
  });

async function expectNothingStarted() {
  expect(
    (await h.agents.conversations.list('alice', { archived: 'all' })).items,
  ).toEqual([]);
  expect(await h.agents.runs.list({ subjectKind: 'conversation' })).toEqual([]);
}

describe('intake requires a runnable handoff', () => {
  it('rejects anonymous requests', async () => {
    const response = await h.request('POST', '/organizeIntake', {
      body: { text: 'Requirements' },
    });
    expect(response.status).toBe(401);
    await expectNothingStarted();
  });

  it('explains a missing default without creating a conversation', async () => {
    const response = await submit();
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_AGENT');
    await expectNothingStarted();
  });

  it('explains a missing online model instead of blaming runners', async () => {
    const id = await h.createAgent({ type: 'online', modelEntries: [] });
    await h.agents.chat.updateSettings('admin', { defaultAgentId: id });
    const response = await submit();
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_MODEL_MISSING');
    await expectNothingStarted();
  });

  it('explains an unavailable online model', async () => {
    const service = await h.agents.online.services.create({
      title: 'Local',
      provider: 'openai-compatible',
      baseUrl: 'http://127.0.0.1:9/v1',
      models: [{ value: 'mock-model', label: 'Mock model' }],
    });
    const id = await h.createAgent({
      type: 'online',
      modelEntries: [{ modelService: service.name, model: 'mock-model' }],
    });
    await h.agents.online.services.remove(service.name);
    const response = await submit(id);
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_MODEL_UNAVAILABLE');
    await expectNothingStarted();
  });

  it('explains an absent runner and creates no queued work', async () => {
    const id = await h.createAgent();
    const response = await submit(id);
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_RUNNER');
    await expectNothingStarted();
  });

  it('refuses agents the caller cannot invoke', async () => {
    const id = await h.createAgent({ access: 'ownerOnly' });
    const response = await submit(id, 'bob');
    expect(response.status).toBe(403);
    await expectNothingStarted();
  });
});

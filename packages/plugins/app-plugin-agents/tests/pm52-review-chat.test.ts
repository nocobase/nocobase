import { afterEach, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';
let h: Harness;
afterEach(async () => {
  await h?.close();
});

it('does not automatically switch to an online agent with no usable model', async () => {
  h = await createHarness();
  const lead = await h.createAgent({ name: 'Review lead' });
  const online = await h.createAgent({
    name: 'Unconfigured fallback',
    type: 'online',
    modelEntries: [],
  });
  await h.services.chat.updateSettings('owner', {
    onlineFallbackAgentId: online,
  });
  const conversation = await h.services.conversations.create('bob', {
    agentId: lead,
  });
  // The retained runner has no runner; the unavailable fallback's model has its own explanatory notice.
  expect(conversation.availability).toMatchObject({
    online: false,
    reason: 'noRunner',
  });
  expect(conversation.agent.id).toBe(lead);
  expect(conversation.fallbackFrom).toBeNull();
  expect(conversation.canFallback).toBe(false);
  const messages = await h.services.conversations.messages(
    'bob',
    conversation.id,
    {},
  );
  expect(messages.items.map((message) => message.metadata.notice)).toEqual([
    {
      code: 'onlineFallbackUnavailable',
      fromAgentId: lead,
      reason: 'modelUnavailable',
    },
  ]);
});

it.each(['disabled', 'removed', 'modelRemoved'] as const)(
  'does not offer or switch to the fallback after its service is %s',
  async (failure) => {
    h = await createHarness();
    const lead = await h.createAgent({ name: 'Review lead' });
    const service = await h.services.online.services.create({
      title: 'Mock',
      provider: 'openai-compatible',
      baseUrl: 'http://127.0.0.1:9/v1',
      models: [{ value: 'm1', label: 'Model one' }],
    });
    const online = await h.createAgent({
      name: 'Review assistant',
      type: 'online',
      modelEntries: [{ modelService: service.name, model: 'm1' }],
    });
    await h.services.chat.updateSettings('owner', {
      onlineFallbackAgentId: online,
    });
    const waiting = await h.services.conversations.create('bob', {
      agentId: lead,
    });
    expect(waiting.agent.id).toBe(online);
    await h.services.conversations.restore('bob', waiting.id);
    if (failure === 'removed')
      await h.services.online.services.remove(service.name);
    else
      await h.services.online.services.update(
        service.name,
        failure === 'disabled' ? { enabled: false } : { models: [] },
      );
    expect(
      (await h.services.conversations.get('bob', waiting.id)).canFallback,
    ).toBe(false);
    await expect(
      h.services.conversations.fallback('bob', waiting.id),
    ).rejects.toMatchObject({
      code: 'CONVERSATION_CONFLICT',
      details: { reason: 'noFallback' },
    });
    const created = await h.services.conversations.create('bob', {
      agentId: lead,
    });
    expect(created).toMatchObject({
      agent: { id: lead },
      mode: 'runner',
      fallbackFrom: null,
    });
    expect(
      (await h.services.conversations.chatAgents('bob')).find(
        (agent) => agent.id === lead,
      ),
    ).toMatchObject({ fallbackAgentId: null });
    const messages = await h.services.conversations.messages(
      'bob',
      created.id,
      {},
    );
    expect(messages.items.map((message) => message.metadata.notice)).toEqual([
      {
        code: 'onlineFallbackUnavailable',
        fromAgentId: lead,
        reason: 'modelUnavailable',
      },
    ]);
  },
);

it('uses a configured online fallback with an available system default model', async () => {
  h = await createHarness();
  const lead = await h.createAgent({ name: 'Review lead' });
  await h.services.online.services.create({
    title: 'Mock',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:9/v1',
    models: [{ value: 'm1', label: 'Model one' }],
  });
  const online = await h.createAgent({
    name: 'Review assistant',
    type: 'online',
    modelEntries: [],
  });
  await h.services.chat.updateSettings('owner', {
    onlineFallbackAgentId: online,
  });
  const created = await h.services.conversations.create('bob', {
    agentId: lead,
  });
  expect(created).toMatchObject({
    agent: { id: online },
    fallbackFrom: { id: lead },
    availability: { online: true },
  });
  expect(
    (await h.services.conversations.chatAgents('bob')).find(
      (agent) => agent.id === lead,
    ),
  ).toMatchObject({ fallbackAgentId: online });
});

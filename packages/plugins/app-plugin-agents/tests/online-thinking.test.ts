import { afterEach, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import type { ModelMessage } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { createHarness, type Harness } from './harness.js';
import { OnlineAgentService } from '../server/online/agent/service.js';
import { createSandboxProvider } from '../server/online/sandbox/provider.js';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { createSessionManager } from '../server/online/agent/persistence/manager.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { REASONING_LEVELS, type ModelCapabilities } from '../shared/models.js';
import type { RealtimeOnlineAgent } from '../server/online/agent/contracts.js';

const withOff = { modelService: 'fixture', model: 'gpt-6-astra' };
const unknownModel = { modelService: 'fixture', model: 'my-alias' };
const plain = { modelService: 'fixture', model: 'plain' };
const actor: OnlineAgentContext = {
  user: { id: 'alice' },
  credentials: { kind: 'fixture', userId: 'alice' },
  authorization: {
    identity: { principal: { type: 'user', id: 'alice' } },
  } as AuthorizationContext,
};
const messages: ModelMessage[] = [{ role: 'user', content: 'Answer' }];
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

let h: Harness | undefined;
const owners: { shutdown(): Promise<void> }[] = [];
afterEach(async () => {
  for (const owner of owners.splice(0).reverse()) await owner.shutdown();
  await h?.close();
  h = undefined;
});

/** A native service recording the `reasoning` each call was sent. */
async function fixture(
  warnings: { type: 'unsupported'; feature: string; details?: string }[] = [],
) {
  h = await createHarness();
  let counter = 0;
  const ids = { next: () => `thinking-${++counter}` };
  const attachments = createChatAttachments({
    limitForDisk: () => ({ maxFileSizeMb: 20 }),
    tx: h.services.tx,
    basePath: () => '',
    storage: {
      store: async () => {
        throw new Error('No upload fixture.');
      },
      bytes: async () => new Uint8Array(),
      stream: async () => new ReadableStream(),
      remove: async () => {},
    },
  });
  const sessions = createSessionManager({
    tx: h.services.tx,
    ids,
    attachments: attachments.links,
    now: () => new Date().toISOString(),
  });
  const sent: unknown[] = [];
  const languageModel = () =>
    new MockLanguageModelV4({
      doStream: async (options) => {
        sent.push(options.reasoning);
        return {
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue({ type: 'stream-start', warnings });
              for (const chunk of [
                { type: 'text-start' as const, id: 'text' },
                { type: 'text-delta' as const, id: 'text', delta: 'Done' },
                { type: 'text-end' as const, id: 'text' },
                {
                  type: 'finish' as const,
                  usage,
                  finishReason: { unified: 'stop' as const, raw: 'stop' },
                },
              ])
                controller.enqueue(chunk);
              controller.close();
            },
          }),
        };
      },
    });
  const capabilities = vi.fn(async (): Promise<ModelCapabilities> => ({
    webSearch: false,
  }));
  const configurator = new OnlineAgentConfigurator();
  const errors: unknown[] = [];
  const service = new OnlineAgentService({
    sandboxProvider: createSandboxProvider({ skills: h.services.skills }),
    sessions,
    ids,
    configurator,
    model: async () => languageModel(),
    defaultModel: async () => plain,
    webSearch: {
      capabilities,
      search: async () => {
        throw new Error('No search in these tests.');
      },
    },
    onError: (error: unknown) => errors.push(error),
  });
  owners.push(service);
  return { service, sessions, configurator, sent, capabilities };
}

async function send(agent: RealtimeOnlineAgent) {
  await agent.send(messages);
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
}

async function notices(agent: RealtimeOnlineAgent) {
  return (await agent.history())
    .flatMap((message) => message.parts)
    .filter(
      (part) =>
        part.type === 'data-notice' &&
        (part.id === 'thinking-adjusted' || part.id === 'thinking-warning'),
    )
    .map((part) => (part.type === 'data-notice' ? part.data : null));
}

it('refuses a thinking level that is not one of the SDK’s seven, from a request or a scope', async () => {
  const f = await fixture();
  for (const thinking of ['deep', 'default', 'off', 'max'])
    await expect(
      f.service.realtime(actor, { selectedModel: withOff, thinking }),
    ).rejects.toMatchObject({ details: { reason: 'REASONING_LEVEL_INVALID' } });
  const agent = await f.service.realtime(actor, { selectedModel: withOff });
  for (const thinking of ['default', 'off', 'max'])
    await expect(
      f.service.configure(actor, agent.sessionId, { thinking }),
    ).rejects.toMatchObject({ details: { reason: 'REASONING_LEVEL_INVALID' } });
  await expect(
    agent.send(messages, { overrides: { thinking: 'off' } }),
  ).rejects.toMatchObject({ details: { reason: 'REASONING_LEVEL_INVALID' } });
  f.configurator.registerOnlineAgentScope('broken', { thinking: 'max' });
  await expect(
    f.service.realtime(actor, { selectedModel: withOff, scope: ['broken'] }),
  ).rejects.toMatchObject({ details: { reason: 'REASONING_LEVEL_INVALID' } });
  expect(f.sent).toEqual([]);
});

it('sends each of the seven levels to the SDK exactly as it was chosen, saved and read back', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor, {
    selectedModel: unknownModel,
    thinking: 'provider-default',
  });
  expect((await f.service.configuration(actor, agent.sessionId)).thinking).toBe(
    'provider-default',
  );
  await send(agent);
  for (const level of REASONING_LEVELS.slice(1)) {
    const saved = await f.service.configure(actor, agent.sessionId, {
      thinking: level,
    });
    expect(saved.thinking).toBe(level);
    expect(
      (await f.service.configuration(actor, agent.sessionId)).thinking,
    ).toBe(level);
    await send(agent);
  }
  expect(f.sent).toEqual([...REASONING_LEVELS]);
  expect(await notices(agent)).toEqual([]);
  expect(f.capabilities).not.toHaveBeenCalled();
});

it('keeps the level across a model switch and sends an override as it is', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor, {
    selectedModel: unknownModel,
    thinking: 'none',
  });
  await send(agent);
  await f.service.configure(
    actor,
    agent.sessionId,
    { thinking: 'minimal' },
    withOff,
  );
  await send(agent);
  // A model switch without a new level keeps the conversation's level as it is.
  const switched = await f.service.configure(
    actor,
    agent.sessionId,
    {},
    unknownModel,
  );
  expect(switched).toMatchObject({
    thinking: 'minimal',
    selectedModel: unknownModel,
  });
  await agent.send(messages, {
    overrides: { thinking: 'none' },
    selectedModel: withOff,
  });
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  expect(f.sent).toEqual(['none', 'minimal', 'none']);
});

it('sends the provider default when neither a scope nor the conversation names a level', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor, { selectedModel: withOff });
  await send(agent);
  expect(f.sent).toEqual(['provider-default']);
});

it('refuses to run a conversation whose saved level is not a standard one until one is chosen', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor, { selectedModel: withOff });
  const session = await f.sessions.load(actor.user.id, agent.sessionId);
  // A value saved before the levels were the SDK's own.
  await f.sessions.configure(
    actor.user.id,
    agent.sessionId,
    { ...session.config, thinking: 'off' },
    session.model,
  );
  await expect(agent.send(messages)).rejects.toMatchObject({
    details: { reason: 'REASONING_LEVEL_INVALID' },
  });
  expect(f.sent).toEqual([]);
  await f.service.configure(actor, agent.sessionId, { thinking: 'none' });
  await send(agent);
  expect(f.sent).toEqual(['none']);
});

it('records the provider package’s warning about the level it was sent', async () => {
  const f = await fixture([
    {
      type: 'unsupported',
      feature: 'reasoning',
      details: 'xhigh is not supported by this model.',
    },
  ]);
  const agent = await f.service.realtime(actor, {
    selectedModel: withOff,
    thinking: 'xhigh',
  });
  await send(agent);
  expect(await notices(agent)).toEqual([
    expect.objectContaining({
      type: 'thinkingWarning',
      params: { level: 'xhigh' },
      title: expect.stringContaining('xhigh is not supported by this model.'),
    }),
  ]);
});

it('uses a code scope’s level as the Agent default, and the conversation’s choice over it', async () => {
  const f = await fixture();
  f.configurator.registerOnlineAgentScope('careful', { thinking: 'high' });
  const agent = await f.service.realtime(actor, {
    selectedModel: withOff,
    scope: ['careful'],
  });
  await send(agent);
  await f.service.configure(actor, agent.sessionId, { thinking: 'low' });
  await send(agent);
  expect(f.sent).toEqual(['high', 'low']);
});

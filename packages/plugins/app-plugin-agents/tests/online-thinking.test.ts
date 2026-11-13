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
import type {
  ModelCapabilities,
  ModelReasoning,
  ModelRef,
} from '../shared/models.js';
import type { RealtimeOnlineAgent } from '../server/online/agent/contracts.js';

const withOff = { modelService: 'fixture', model: 'with-off' };
const lowOnly = { modelService: 'fixture', model: 'low-only' };
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

/** A native service whose models take the levels in `levels`, recording the `reasoning` each call was sent. */
async function fixture(
  levels: Record<string, ModelReasoning | undefined> = {
    'with-off': { levels: ['off', 'low', 'medium', 'high', 'xhigh', 'max'] },
    'low-only': { levels: ['low'] },
  },
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
  const capabilities = vi.fn(
    async (ref: ModelRef): Promise<ModelCapabilities> => {
      const reasoning = levels[ref.model];
      return reasoning ? { webSearch: false, reasoning } : { webSearch: false };
    },
  );
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
  return { service, sessions, configurator, sent, capabilities, levels };
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

it('refuses a thinking level that is not a standard one, from a request or a scope', async () => {
  const f = await fixture();
  await expect(
    f.service.realtime(actor, { selectedModel: withOff, thinking: 'deep' }),
  ).rejects.toMatchObject({ details: { reason: 'REASONING_LEVEL_INVALID' } });
  const agent = await f.service.realtime(actor, { selectedModel: withOff });
  await expect(
    f.service.configure(actor, agent.sessionId, { thinking: 'none' }),
  ).rejects.toMatchObject({ details: { reason: 'REASONING_LEVEL_INVALID' } });
  f.configurator.registerOnlineAgentScope('broken', { thinking: 'huge' });
  await expect(
    f.service.realtime(actor, { selectedModel: withOff, scope: ['broken'] }),
  ).rejects.toMatchObject({ details: { reason: 'REASONING_LEVEL_INVALID' } });
});

it('refuses off for a model that cannot turn thinking off, and sends none for one that can', async () => {
  const f = await fixture();
  await expect(
    f.service.realtime(actor, { selectedModel: lowOnly, thinking: 'off' }),
  ).rejects.toMatchObject({
    details: { reason: 'REASONING_LEVEL_UNSUPPORTED' },
  });
  const agent = await f.service.realtime(actor, {
    selectedModel: withOff,
    thinking: 'off',
  });
  await send(agent);
  expect(f.sent).toEqual(['none']);
  await expect(
    f.service.configure(actor, agent.sessionId, { thinking: 'off' }, lowOnly),
  ).rejects.toMatchObject({
    details: { reason: 'REASONING_LEVEL_UNSUPPORTED' },
  });
  await expect(
    agent.send(messages, {
      overrides: { thinking: 'off' },
      selectedModel: lowOnly,
    }),
  ).rejects.toMatchObject({
    details: { reason: 'REASONING_LEVEL_UNSUPPORTED' },
  });
  // Switching without naming a level resets an off the new model cannot take.
  const switched = await f.service.configure(
    actor,
    agent.sessionId,
    {},
    lowOnly,
  );
  expect(switched).toMatchObject({
    thinking: 'default',
    selectedModel: lowOnly,
  });
});

it('passes max and the levels that turn thinking on to the SDK as they are, and default as the provider default', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor, {
    selectedModel: withOff,
    thinking: 'max',
  });
  await send(agent);
  await f.service.configure(actor, agent.sessionId, { thinking: 'xhigh' });
  await send(agent);
  await f.service.configure(actor, agent.sessionId, { thinking: 'default' });
  await send(agent);
  expect(f.sent).toEqual(['max', 'xhigh', 'provider-default']);
  expect(await notices(agent)).toEqual([]);
});

it('runs a level the model no longer takes at the nearest lower one, or the provider default, and says so', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor, {
    selectedModel: withOff,
    thinking: 'high',
  });
  // An administrator narrows the model's levels after the conversation chose one.
  f.levels['with-off'] = { levels: ['low'] };
  await send(agent);
  f.levels['with-off'] = { levels: ['medium'] };
  await f.service.configure(actor, agent.sessionId, { thinking: 'minimal' });
  await send(agent);
  f.levels['with-off'] = { levels: ['off', 'high'] };
  await f.service.configure(actor, agent.sessionId, { thinking: 'off' });
  f.levels['with-off'] = undefined;
  await send(agent);
  expect(f.sent).toEqual(['low', 'provider-default', 'provider-default']);
  expect(await notices(agent)).toEqual([
    expect.objectContaining({
      type: 'thinkingAdjusted',
      params: { requested: 'high', used: 'low' },
    }),
    expect.objectContaining({
      type: 'thinkingAdjusted',
      params: { requested: 'minimal', used: 'default' },
    }),
    expect.objectContaining({
      type: 'thinkingAdjusted',
      params: { requested: 'off', used: 'default' },
    }),
  ]);
  // The conversation keeps its own level; only the runs were adjusted.
  expect(
    (await f.sessions.load('alice', agent.sessionId)).config.thinking,
  ).toBe('off');
});

it('records the provider package’s warning about the level it was sent', async () => {
  const f = await fixture(undefined, [
    {
      type: 'unsupported',
      feature: 'reasoning',
      details: 'max is not a known reasoning level.',
    },
  ]);
  const agent = await f.service.realtime(actor, {
    selectedModel: withOff,
    thinking: 'max',
  });
  await send(agent);
  expect(await notices(agent)).toEqual([
    expect.objectContaining({
      type: 'thinkingWarning',
      params: { level: 'max' },
      title: expect.stringContaining('max is not a known reasoning level.'),
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

it('reads a model’s capabilities only for a level other than default', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor, { selectedModel: withOff });
  await send(agent);
  expect(f.capabilities).not.toHaveBeenCalled();
  await f.service.configure(actor, agent.sessionId, { thinking: 'high' });
  expect(f.capabilities).not.toHaveBeenCalled();
  await send(agent);
  expect(f.capabilities).toHaveBeenCalledTimes(1);
});

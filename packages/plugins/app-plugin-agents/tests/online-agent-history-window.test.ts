import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { afterEach, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import type { ModelMessage } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { createSandboxProvider } from '../server/online/sandbox/provider.js';
import { createHarness, type Harness } from './harness.js';
import { OnlineAgentService } from '../server/online/agent/service.js';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import { createSessionManager } from '../server/online/agent/persistence/manager.js';
import { keepRecentTurns } from '../server/online/agent/messages/history-window.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { addMessageUsage, conversationUsage } from '../shared/online-agent.js';

let h: Harness;
afterEach(async () => h?.close());
const actor: OnlineAgentContext = {
  user: { id: 'alice' },
  credentials: {},
  authorization: {
    identity: { principal: { type: 'user', id: 'alice' } },
  } as AuthorizationContext,
};

async function fixture(turns?: number) {
  h = await createHarness();
  let next = 0;
  const prompts: { role: string; content: unknown }[][] = [];
  const model = new MockLanguageModelV4({
    doStream: async (options) => {
      prompts.push(options.prompt as never);
      return {
        stream: new ReadableStream({
          start(c) {
            c.enqueue({ type: 'text-start', id: 'answer' });
            c.enqueue({ type: 'text-delta', id: 'answer', delta: 'Answer' });
            c.enqueue({ type: 'text-end', id: 'answer' });
            c.enqueue({
              type: 'finish',
              finishReason: { unified: 'stop', raw: 'stop' },
              usage: {
                inputTokens: {
                  total: 120,
                  noCache: 120,
                  cacheRead: 0,
                  cacheWrite: 0,
                },
                outputTokens: { total: 30, text: 30, reasoning: 0 },
              },
            });
            c.close();
          },
        }),
      };
    },
  });
  const sessions = createSessionManager({
    tx: h.services.tx,
    attachments: createChatAttachments({
      limitForDisk: () => ({ maxFileSizeMb: 20 }),
      tx: h.services.tx,
      basePath: () => '',
      now: () => new Date().toISOString(),
      storage: {
        store: async () => {
          throw new Error('No file fixture.');
        },
        bytes: async () => new Uint8Array(),
        stream: async () => new ReadableStream(),
        remove: async () => {},
      },
    }).links,
    ids: { next: () => 'history-' + ++next },
    now: () => new Date().toISOString(),
    contextKinds: h.services.conversations.contextKinds,
  });
  const configurator = new OnlineAgentConfigurator();
  configurator.setHistoryTurns(turns);
  const service = new OnlineAgentService({
    sandboxProvider: createSandboxProvider({ skills: h.services.skills }),
    sessions,
    configurator,
    ids: { next: () => 'history-' + ++next },
    model: async () => model,
    defaultModel: async () => ({ modelService: 'local', model: 'chat' }),
    onError: (error) => {
      throw error;
    },
  });
  return { service, prompts };
}

const asked = (prompt: { role: string; content: unknown }[]) =>
  prompt
    .filter((message) => message.role === 'user')
    .map(
      (message) => JSON.stringify(message.content).match(/Question \d+/u)?.[0],
    );

it('sends the model only the latest earlier turns, keeps the stored conversation whole and records each answer’s tokens', async () => {
  const f = await fixture(2);
  const agent = await f.service.realtime(actor);
  for (let index = 1; index <= 5; index += 1) {
    await agent.send([{ role: 'user', content: `Question ${index}` }]);
    await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  }
  expect(asked(f.prompts[0])).toEqual(['Question 1']);
  expect(asked(f.prompts[2])).toEqual([
    'Question 1',
    'Question 2',
    'Question 3',
  ]);
  // The fifth turn reads two earlier ones besides its own, answers included.
  expect(asked(f.prompts[4])).toEqual([
    'Question 3',
    'Question 4',
    'Question 5',
  ]);
  expect(
    f.prompts[4].filter((message) => message.role === 'assistant'),
  ).toHaveLength(2);

  const history = await agent.history();
  expect(history.filter((message) => message.role === 'user')).toHaveLength(5);
  const answers = history.filter((message) => message.role === 'assistant');
  expect(answers.map((message) => message.metadata?.usage)).toEqual(
    Array.from({ length: 5 }, () => ({ inputTokens: 120, outputTokens: 30 })),
  );
  expect(conversationUsage(history)).toEqual({
    inputTokens: 600,
    outputTokens: 150,
  });
  // A restored conversation reads the same usage back.
  const restored = await f.service.realtime(actor, {
    sessionId: agent.sessionId,
  });
  expect(conversationUsage(await restored.history())).toEqual({
    inputTokens: 600,
    outputTokens: 150,
  });
  await f.service.shutdown();
});

it('sends every turn without a limit', async () => {
  const f = await fixture();
  const agent = await f.service.realtime(actor);
  for (let index = 1; index <= 4; index += 1) {
    await agent.send([{ role: 'user', content: `Question ${index}` }]);
    await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  }
  expect(asked(f.prompts[3])).toEqual([
    'Question 1',
    'Question 2',
    'Question 3',
    'Question 4',
  ]);
  await f.service.shutdown();
});

it('keeps or drops a turn with its tool calls and results whole', () => {
  const turn = (n: number): ModelMessage[] => [
    { role: 'user', content: `Question ${n}` },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: `call-${n}`,
          toolName: 'lookup',
          input: {},
        },
      ],
    },
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: `call-${n}`,
          toolName: 'lookup',
          output: { type: 'json', value: { n } },
        },
      ],
    },
    { role: 'assistant', content: `Answer ${n}` },
  ];
  const system: ModelMessage = { role: 'system', content: 'Rules' };
  const history = [system, ...turn(1), ...turn(2), ...turn(3), ...turn(4)];
  const kept = keepRecentTurns(history, 2);
  expect(kept[0]).toBe(system);
  expect(kept.slice(1)).toEqual([...turn(2), ...turn(3), ...turn(4)]);
  const calls = kept.flatMap((message) =>
    Array.isArray(message.content)
      ? message.content.flatMap((part) =>
          'toolCallId' in part ? [`${part.type}:${part.toolCallId}`] : [],
        )
      : [],
  );
  expect(calls).toEqual([
    'tool-call:call-2',
    'tool-result:call-2',
    'tool-call:call-3',
    'tool-result:call-3',
    'tool-call:call-4',
    'tool-result:call-4',
  ]);
  expect(keepRecentTurns(history, 3)).toBe(history);
  expect(keepRecentTurns(history, undefined)).toBe(history);
  expect(keepRecentTurns(history, 0)).toEqual([system, ...turn(4)]);
});

it('adds usage and refuses an invalid history limit', () => {
  expect(
    addMessageUsage(
      { inputTokens: 1, outputTokens: 2 },
      {
        inputTokens: 3,
        outputTokens: 4,
      },
    ),
  ).toEqual({ inputTokens: 4, outputTokens: 6 });
  expect(conversationUsage([{ metadata: {} }, {}])).toBeNull();
  const configurator = new OnlineAgentConfigurator();
  expect(() => configurator.setHistoryTurns(-1)).toThrow();
  expect(() => configurator.setHistoryTurns(1.5)).toThrow();
  configurator.setHistoryTurns(6);
  expect(configurator.historyTurns).toBe(6);
});

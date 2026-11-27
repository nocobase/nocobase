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
import {
  keepRecentTurns,
  windowSnapshot,
} from '../server/online/agent/messages/history-window.js';
import { readFileSync } from 'node:fs';
import { createDocumentFixture } from './helpers/document-inputs.js';
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

async function documentTurns(turns: number | undefined) {
  const f = await createDocumentFixture({
    register: (service) => service.configurator.setHistoryTurns(turns),
  });
  const pdf = await f.upload(
    'sample.pdf',
    'application/pdf',
    readFileSync(
      new URL('./fixtures/document-inputs/sample.pdf', import.meta.url),
    ),
  );
  const ask = async (text: string, attachmentIds?: string[]) => {
    await f.agent.send(
      [{ role: 'user', content: text }],
      attachmentIds ? { attachmentIds: [attachmentIds] } : {},
    );
    await f.settle();
    return (await f.rows()).at(-1)?.metadata.nativeOutcome;
  };
  const unreadable = () =>
    f.h.database
      .connection()
      .repository('agChatAttachments')
      .deleteMany({ filter: { id: pdf.id } });
  const sent = (index: number) => JSON.stringify(f.prompts.at(index));
  return { f, pdf, ask, unreadable, sent };
}

it('reads no file of a dropped turn: a question after an unreadable early PDF still reaches the model', async () => {
  const { f, pdf, ask, unreadable, sent } = await documentTurns(6);
  expect(await ask('Question 1', [pdf.id])).toBe('completed');
  expect(sent(0)).toContain('sample.pdf');
  for (let n = 2; n <= 7; n += 1)
    expect(await ask(`Question ${n}`)).toBe('completed');
  // The seventh question still reads the PDF of the first turn, within the window.
  expect(sent(6)).toContain('sample.pdf');
  await unreadable();
  expect(await ask('Question 8')).toBe('completed');
  expect(f.prompts).toHaveLength(8);
  expect(sent(7)).toContain('Question 8');
  expect(sent(7)).not.toContain('Question 1"');
  expect(sent(7)).not.toContain('sample.pdf');
  // Resending the eighth question prepares the same window: the dropped PDF is not read either.
  await f.agent.resend({ input: { text: 'Question 8 edited' } });
  await f.settle();
  expect((await f.rows()).at(-1)?.metadata.nativeOutcome).toBe('completed');
  expect(f.prompts).toHaveLength(9);
  expect(sent(8)).toContain('Question 8 edited');
  expect(sent(8)).not.toContain('sample.pdf');
  expect(f.errors).toEqual([]);
  await f.close();
});

it('still reads the files of the current turn and of the turns in the window', async () => {
  const { f, pdf, ask, unreadable, sent } = await documentTurns(2);
  for (let n = 1; n <= 3; n += 1)
    expect(await ask(`Question ${n}`)).toBe('completed');
  expect(await ask('Question 4', [pdf.id])).toBe('completed');
  expect(sent(3)).toContain('sample.pdf');
  expect(await ask('Question 5')).toBe('completed');
  expect(sent(4)).toContain('sample.pdf');
  // A file of a turn the model still reads must be readable: it fails as before.
  await unreadable();
  expect(await ask('Question 6')).toBe('failed');
  expect(f.prompts).toHaveLength(5);
  await f.close();
});

it('reads every file without a limit, as before', async () => {
  const { f, pdf, ask, unreadable } = await documentTurns(undefined);
  expect(await ask('Question 1', [pdf.id])).toBe('completed');
  for (let n = 2; n <= 8; n += 1)
    expect(await ask(`Question ${n}`)).toBe('completed');
  await unreadable();
  expect(await ask('Question 9')).toBe('failed');
  expect(f.prompts).toHaveLength(8);
  await f.close();
});

it('keeps only the files of the kept turns in the execution snapshot', () => {
  const message = (id: string, role: 'user' | 'assistant') => ({
    id,
    role,
    parts: [],
  });
  const replay = [
    message('u1', 'user'),
    message('a1', 'assistant'),
    message('u2', 'user'),
    message('a2', 'assistant'),
    message('u3', 'user'),
  ];
  const snapshot = {
    original: replay,
    replay,
    files: [
      { messageId: 'u1', partIndex: 0 },
      { messageId: 'u2', partIndex: 0 },
      { messageId: 'u3', partIndex: 1 },
    ],
  } as never;
  const windowed = windowSnapshot(snapshot, 1);
  expect(windowed.replay.map((item) => item.id)).toEqual(['u2', 'a2', 'u3']);
  expect(windowed.files.map((file) => file.messageId)).toEqual(['u2', 'u3']);
  expect(windowed.original).toBe(replay);
  expect(windowSnapshot(snapshot, 2)).toBe(snapshot);
  expect(windowSnapshot(snapshot, undefined)).toBe(snapshot);
});

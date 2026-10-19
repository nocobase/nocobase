import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { afterEach, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { appendFile } from 'node:fs/promises';
import { createHarness, type Harness } from './harness.js';
import { OnlineAgentService } from '../server/online/agent/service.js';
import { createSessionManager } from '../server/online/agent/persistence/manager.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import type { ResolvedPageContext } from '../shared/conversations.js';

let h: Harness;
afterEach(async () => h?.close());
const actor = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { secret: 'ENTRY_SECRET_NEVER_REPLAY' },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});
const page = (id: string): ResolvedPageContext => ({
  route: '/old?token=OLD_ROUTE_SECRET',
  items: [
    {
      kind: 'page',
      id,
      title: 'STALE_TITLE',
      key: 'OLD_KEY',
      url: '/old?secret=OLD_URL_SECRET',
    },
  ],
  filter: { page: 'old', params: { secret: 'OLD_FILTER_SECRET' } },
  selection: { text: 'OLD_SELECTION_SECRET' },
  dropped: 0,
});
async function fixture() {
  h = await createHarness();
  let next = 0;
  const inputs: unknown[] = [];
  const resolve = vi.fn(
    async (_conn, userId, ids: readonly string[]) =>
      new Map(
        userId === 'alice'
          ? ids
              .filter((id) => allowed.has(id))
              .map((id) => [
                id,
                {
                  title: 'Current ' + id,
                  key: 'NEW_KEY',
                  url: '/new?secret=NEW_URL_SECRET',
                },
              ])
          : [],
      ),
  );
  const allowed = new Set(['A', 'B']);
  h.services.conversations.contextKinds.register('page', resolve);
  const model = new MockLanguageModelV4({
    doStream: async (options) => {
      inputs.push(options.prompt);
      return {
        stream: new ReadableStream({
          start(c) {
            c.enqueue({ type: 'text-start', id: 'answer' });
            c.enqueue({
              type: 'text-delta',
              id: 'answer',
              delta: 'Plain answer without page data.',
            });
            c.enqueue({ type: 'text-end', id: 'answer' });
            c.enqueue({
              type: 'finish',
              finishReason: { unified: 'stop', raw: 'stop' },
              usage: {
                inputTokens: {
                  total: 1,
                  noCache: 1,
                  cacheRead: 0,
                  cacheWrite: 0,
                },
                outputTokens: { total: 1, text: 1, reasoning: 0 },
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
    ids: { next: () => 'context-' + ++next },
    now: () => new Date().toISOString(),
    contextKinds: h.services.conversations.contextKinds,
  });
  const service = new OnlineAgentService({
    sessions,
    ids: { next: () => 'context-' + ++next },
    model: async () => model,
    defaultModel: async () => ({ modelService: 'local', model: 'chat' }),
    onError: (error) => {
      throw error;
    },
  });
  const turn = async (
    id: string | undefined,
    current?: ResolvedPageContext,
  ) => {
    const agent = await service.realtime(
      { ...actor(), ...(current ? { business: current } : {}) },
      id ? { sessionId: id } : {},
    );
    await agent.send([{ role: 'user', content: 'Question ' + inputs.length }], {
      workContext: current,
    });
    await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
    return agent;
  };
  return { turn, inputs, resolve, allowed, service };
}

it('replays one reauthorized page as transient user data, prefers current refs and stops at an empty recent page', async () => {
  const f = await fixture();
  const a = await f.turn(undefined, page('A'));
  await f.turn(a.sessionId, {
    ...page('B'),
    route: '/current',
    selection: undefined,
    filter: undefined,
  });
  const second = JSON.stringify(f.inputs[1]);
  expect(second).toContain('Current A');
  const replay = (f.inputs[1] as { role: string; content: unknown }[]).find(
    (m) => JSON.stringify(m.content).includes('Previous page references'),
  )!;
  expect(replay.role).toBe('user');
  expect(JSON.stringify(replay)).not.toMatch(
    /STALE_TITLE|OLD_|NEW_KEY|NEW_URL_SECRET|ENTRY_SECRET/,
  );
  expect(second).not.toContain('OLD_ROUTE_SECRET');
  expect(f.resolve).toHaveBeenLastCalledWith(expect.anything(), 'alice', ['A']);
  await f.turn(a.sessionId);
  expect(JSON.stringify(f.inputs[2])).toContain('Current B');
  expect(JSON.stringify(f.inputs[2])).not.toContain('Current A');
  f.resolve.mockClear();
  await f.turn(a.sessionId, {
    ...page('B'),
    items: [{ ...page('B').items[0], title: 'CURRENT_WINS' }],
  });
  expect(f.resolve).not.toHaveBeenCalled();
  expect(JSON.stringify(f.inputs[3])).toContain('CURRENT_WINS');
  expect(JSON.stringify(f.inputs[3])).not.toContain('Previous page references');
  await f.turn(a.sessionId, { route: '/empty', items: [], dropped: 0 });
  f.resolve.mockClear();
  await f.turn(a.sessionId);
  expect(f.resolve).not.toHaveBeenCalled();
  expect(JSON.stringify(f.inputs[5])).not.toContain('Previous page references');
  const rows = await h.services.conversations.messages(
    'alice',
    a.sessionId,
    {},
  );
  expect(rows.items.filter((m) => m.role === 'user')).toHaveLength(6);
  expect(JSON.stringify(rows)).not.toContain('Previous page references');
  if (process.env.PM438_CONTEXT_INPUTS)
    await appendFile(
      process.env.PM438_CONTEXT_INPUTS,
      JSON.stringify({ case: 'latest-and-current', inputs: f.inputs }) + '\n',
    );
  await f.service.shutdown();
});

it.each(['revoked', 'deleted', 'inaccessible'] as const)(
  'omits a %s latest page without falling back, and isolates ownership',
  async () => {
    const f = await fixture();
    const a = await f.turn(undefined, page('A'));
    await f.turn(a.sessionId, page('B'));
    f.allowed.delete('B');
    f.resolve.mockClear();
    await f.turn(a.sessionId);
    expect(f.resolve).toHaveBeenCalledTimes(1);
    expect(f.resolve).toHaveBeenLastCalledWith(expect.anything(), 'alice', [
      'B',
    ]);
    expect(JSON.stringify(f.inputs[2])).not.toMatch(
      /Previous page references|Current A|Current B|OLD_|ENTRY_SECRET/,
    );
    f.resolve.mockClear();
    await expect(
      f.service.realtime(actor('bob'), { sessionId: a.sessionId }),
    ).rejects.toThrow(/not found/i);
    expect(f.resolve).not.toHaveBeenCalled();
    expect(f.inputs).toHaveLength(3);
    await f.service.shutdown();
  },
);

it('carries open UI snapshots as untrusted user model data and retains them across native history and restoration', async () => {
  const f = await fixture();
  const ui = {
    version: 1 as const,
    items: [
      {
        kind: 'unknown.application-widget',
        id: 'widget',
        extra: { nested: [false, 0, '', null] },
      },
    ],
  };
  const agent = await f.service.realtime(actor());
  await agent.send([{ role: 'user', content: 'Use this UI snapshot' }], {
    messageId: 'ui-source-message',
    workContext: { route: '/widget', items: [], dropped: 0, ui },
  });
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  const prompt = f.inputs[0] as { role: string; content: unknown }[];
  const uiMessages = prompt.filter((message) =>
    JSON.stringify(message.content).includes('unknown.application-widget'),
  );
  expect(uiMessages.length).toBeGreaterThan(0);
  expect(uiMessages.every((message) => message.role === 'user')).toBe(true);
  expect(JSON.stringify(uiMessages)).toContain('untrusted browser data');
  const history = await agent.history();
  expect(
    history.find((message) => message.role === 'user')?.metadata?.context?.ui,
  ).toEqual(ui);
  expect(
    history.find((message) => message.role === 'assistant')?.metadata
      ?.sourceUserMessageId,
  ).toBe('ui-source-message');
  const restored = await f.service.realtime(actor(), {
    sessionId: agent.sessionId,
  });
  expect(await restored.history()).toEqual(history);
  expect(f.resolve).not.toHaveBeenCalled();
  await f.service.shutdown();
});

it('omits missing history without resolver work', async () => {
  const f = await fixture();
  const a = await f.turn(undefined);
  await f.turn(a.sessionId);
  expect(f.resolve).not.toHaveBeenCalled();
  expect(JSON.stringify(f.inputs)).not.toMatch(
    /Previous page references|OLD_|ENTRY_SECRET/,
  );
  await f.service.shutdown();
});

it('does not infer history through a user-only resolver for a restricted entry credential', async () => {
  const f = await fixture();
  const first = await f.turn(undefined, page('A'));
  f.resolve.mockClear();
  const scoped = actor();
  const agent = await f.service.realtime(
    {
      ...scoped,
      authorization: {
        ...scoped.authorization,
        identity: {
          ...scoped.authorization.identity,
          keyScope: { allows: () => false },
        },
      },
    },
    { sessionId: first.sessionId },
  );
  await agent.send([{ role: 'user', content: 'A restricted follow-up' }]);
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  expect(f.resolve).not.toHaveBeenCalled();
  expect(JSON.stringify(f.inputs[1])).not.toContain('Previous page references');
  await f.service.shutdown();
});

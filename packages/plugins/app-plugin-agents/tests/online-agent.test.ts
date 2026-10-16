import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import type { ModelMessage } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import {
  createServiceToken,
  ServiceContainer,
} from '@nocobase/service-provider';
import { z } from 'zod';
import type { Knex } from 'knex';
import { appendFile } from 'node:fs/promises';
import { createHarness, type Harness } from './harness.js';
import { OnlineAgentService } from '../server/online-agent/service.js';
import { createSessionManager } from '../server/online-agent/sessions.js';
import {
  OnlineAgentConfigurer,
  type Context,
  type ToolContext,
} from '../server/online-agent/config.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { MemoryOnlineAgentStreamManager } from '../server/online-agent/streams.js';
import {
  content,
  decode,
  encode,
  project,
  restore,
} from '../server/online-agent/codec.js';

const ref = { modelService: 'fixture', model: 'chat' };
const context = (id = 'alice'): Context => ({
  user: { id },
  credentials: { kind: 'fixture-session', userId: id },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const finish = (reason: 'stop' | 'tool-calls' = 'stop') => ({
  type: 'finish' as const,
  usage,
  finishReason: { unified: reason, raw: reason },
});
const text = (value: string) => [
  { type: 'text-start' as const, id: 'txt' },
  { type: 'text-delta' as const, id: 'txt', delta: value },
  { type: 'text-end' as const, id: 'txt' },
  finish(),
];
const streamed = <T>(chunks: T[]) =>
  new ReadableStream<T>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { resolve, promise };
};

let h: Harness;
afterEach(async () => h?.close());

async function fixture(
  model: MockLanguageModelV4,
  streams = new MemoryOnlineAgentStreamManager(),
) {
  h = await createHarness();
  let counter = 0;
  const ids = { next: () => `online-${++counter}` };
  const attachments = createChatAttachments({
    tx: h.services.tx,
    basePath: () => '',
    storage: {
      store: async () => {
        throw new Error('No file fixture.');
      },
      bytes: async () => new Uint8Array(),
      stream: async () => new ReadableStream(),
      remove: async () => {},
    },
  });
  const measurements: { phase: string; durationMs: number }[] = [];
  const sessions = createSessionManager({
    tx: h.services.tx,
    ids,
    attachments: attachments.links,
    now: () => new Date().toISOString(),
    measure: (phase, durationMs) => measurements.push({ phase, durationMs }),
  });
  const resolver = new ServiceContainer();
  const errors: unknown[] = [];
  const resolveModel = vi.fn(
    async (_ref: typeof ref, _sessionId: string) => model,
  );
  const service = new OnlineAgentService({
    sessions,
    ids,
    resolver,
    streams,
    model: resolveModel,
    defaultModel: async () => ref,
    onError: (error) => errors.push(error),
  });
  return { service, sessions, resolver, errors, measurements, resolveModel };
}

async function settle(
  agent: Awaited<ReturnType<OnlineAgentService['realtime']>>,
) {
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
}

describe('OnlineAgent service slice', () => {
  it('runs the real SDK through two injected business tools, preserves complete history and measures SQL', async () => {
    let step = 0;
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: streamed(
          step++ < 2
            ? [
                {
                  type: 'tool-call',
                  toolCallId: `call-${step}`,
                  toolName: 'read',
                  input: JSON.stringify({ value: step }),
                  providerMetadata: {
                    fixture: { signature: 'private-signature' },
                  },
                },
                finish('tool-calls'),
              ]
            : text('The business result is ready.'),
        ),
      }),
    });
    const f = await fixture(model);
    const token = createServiceToken<{
      read(value: number, actor: ToolContext): number;
    }>('fixture-business');
    const read = vi.fn((value: number, actor: ToolContext) => {
      expect(actor.user.id).toBe('alice');
      expect(actor.credentials).toEqual(context().credentials);
      expect(actor.sessionId).toBe(agent.sessionId);
      return value * 10;
    });
    f.resolver.instance(token, { read });
    f.service.configurer.registerTool('read', {
      version: '1',
      definition: (resolver) => ({
        inputSchema: z.object({ value: z.number() }),
        execute: ({ value }, { context: actor }) =>
          resolver.resolve(token).read(value, actor),
      }),
    });
    f.service.configurer.registerOnlineAgentGlobalScope({
      tool: ['read'],
      systemPromptTemplate: 'Use the read tool twice.',
    });
    const client = await h.database.connection().client<Knex>();
    const sql: string[] = [];
    const record = (query: { sql: string }) => sql.push(query.sql);
    client.on('query', record);
    const agent = await f.service.realtime({
      ...context(),
      business: { sessionId: 'untrusted-other-session' },
    });
    await agent.send([{ role: 'user', content: 'Read twice.' }]);
    await settle(agent);
    client.off('query', record);
    expect(
      await h.database
        .connection()
        .repository('agConversationMessages')
        .count({ filter: { conversationId: agent.sessionId } }),
    ).toBe(6);
    expect(read).toHaveBeenCalledTimes(2);
    expect(step).toBe(3);
    expect(f.errors).toEqual([]);
    const history = await agent.history();
    expect(history.map((message) => message.role)).toEqual([
      'user',
      'assistant',
      'tool',
      'assistant',
      'tool',
      'assistant',
    ]);
    expect(JSON.stringify(history)).toContain('private-signature');
    expect(
      JSON.stringify(history.map((message) => project(message))),
    ).not.toContain('private-signature');
    expect(
      JSON.stringify(history.map((message) => project(message))),
    ).not.toContain('toolCallId');
    expect(await agent.receive()).toBeNull();
    const reloaded = await f.service.realtime(context(), {
      sessionId: agent.sessionId,
    });
    expect(await reloaded.history()).toEqual(history);
    expect(f.measurements.map((item) => item.phase)).toEqual([
      'accept',
      'save',
      'finish',
    ]);
    if (process.env.PM438_SQL_REPORT)
      await appendFile(
        process.env.PM438_SQL_REPORT,
        JSON.stringify({
          dialect: h.database.connection().dialect,
          sql,
          measurements: f.measurements,
        }) + '\n',
      );
  });

  it('freezes a running session across facades, rejects concurrent input and waits for an accepted tool to stop', async () => {
    const entered = deferred();
    const release = deferred();
    let step = 0;
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: streamed(
          step++ === 0
            ? [
                {
                  type: 'tool-call',
                  toolCallId: 'call',
                  toolName: 'wait',
                  input: '{}',
                },
                finish('tool-calls'),
              ]
            : text('Done'),
        ),
      }),
    });
    const f = await fixture(model);
    f.service.configurer.registerTool('wait', {
      version: '1',
      definition: {
        inputSchema: z.object({}),
        execute: async () => {
          entered.resolve();
          await release.promise;
          return 'stopped';
        },
      },
    });
    const provider = vi.fn(() => ({ tool: ['wait'] }));
    f.service.configurer.registerOnlineAgentGlobalScope(provider);
    const client = await h.database.connection().client<Knex>();
    const sql: string[] = [];
    const record = (query: { sql: string }) => sql.push(query.sql);
    client.on('query', record);
    const agent = await f.service.realtime(context());
    await agent.send([{ role: 'user', content: 'Wait' }]);
    await entered.promise;
    const second = await f.service.realtime(context(), {
      sessionId: agent.sessionId,
    });
    expect(provider).toHaveBeenCalledTimes(1);
    await expect(
      second.send([{ role: 'user', content: 'Again' }], {
        overrides: { tool: [] },
      }),
    ).rejects.toThrow('busy');
    let stopped = false;
    const stopping = second.abort().then(() => {
      stopped = true;
    });
    await Promise.resolve();
    expect(stopped).toBe(false);
    expect(await agent.status()).toBe('running');
    release.resolve();
    await stopping;
    expect(await agent.status()).toBe('idle');
    const rows = await h.database
      .connection()
      .repository('agConversationMessages')
      .findMany({
        filter: { conversationId: agent.sessionId },
        sort: (sort) => sort.field('seq').asc(),
      });
    const evidence = rows.filter(
      (row) => row.content.original?.excludedFromHistory,
    );
    expect(evidence).toHaveLength(2);
    expect(evidence.map((row) => decode(row.content.original.message))).toEqual(
      [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call',
              toolName: 'wait',
              input: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call',
              toolName: 'wait',
              output: { type: 'text', value: 'stopped' },
            },
          ],
        },
      ],
    );
    expect(evidence.map((row) => row.content.content)).toEqual(['', '']);
    expect(await agent.history()).toEqual([{ role: 'user', content: 'Wait' }]);
    expect(model.doStreamCalls).toHaveLength(1);
    client.off('query', record);
    expect(f.measurements.map((item) => item.phase)).toEqual([
      'accept',
      'save',
      'finish',
    ]);
    if (process.env.PM438_SQL_REPORT)
      await appendFile(
        process.env.PM438_SQL_REPORT,
        JSON.stringify({
          scenario: 'cancelled-tool',
          dialect: h.database.connection().dialect,
          sql,
          measurements: f.measurements,
        }) + '\n',
      );
    expect(
      (await f.sessions.load('alice', agent.sessionId)).call,
    ).toMatchObject({ outcome: 'cancelled' });
    await expect(
      f.service.realtime(context('bob'), { sessionId: agent.sessionId }),
    ).rejects.toThrow('not found');
  });

  it('retries save and seal without rerunning the SDK or duplicating messages', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Saved once')) }),
    });
    const streams = new MemoryOnlineAgentStreamManager();
    const f = await fixture(model, streams);
    const save = vi
      .spyOn(f.sessions, 'save')
      .mockRejectedValueOnce(new Error('save failed'));
    const clear = vi
      .spyOn(f.sessions, 'finish')
      .mockRejectedValueOnce(new Error('marker clear failed'));
    const open = streams.open.bind(streams);
    vi.spyOn(streams, 'open').mockImplementation(async (...args) => {
      const writer = await open(...args);
      const finish = writer.finish.bind(writer);
      let first = true;
      return {
        ...writer,
        finish: async (...completion) => {
          await finish(...completion);
          if (first) {
            first = false;
            throw new Error('seal response lost');
          }
        },
      };
    });
    const agent = await f.service.realtime(context());
    await agent.send([{ role: 'user', content: 'Save' }]);
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(await agent.status()).toBe('running');
    await expect(agent.retryFinalization()).rejects.toThrow(
      'seal response lost',
    );
    await expect(agent.retryFinalization()).rejects.toThrow(
      'marker clear failed',
    );
    expect(await agent.status()).toBe('running');
    await agent.retryFinalization();
    expect(clear).toHaveBeenCalledTimes(2);
    expect(await agent.status()).toBe('idle');
    expect(model.doStreamCalls).toHaveLength(1);
    expect(await agent.history()).toHaveLength(2);
  });

  it('returns tool failure to the model, and accepts a repeated ordinary input as a new message', async () => {
    let step = 0;
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: streamed(
          step++ === 0
            ? [
                {
                  type: 'tool-call',
                  toolCallId: 'call',
                  toolName: 'fail',
                  input: '{}',
                },
                finish('tool-calls'),
              ]
            : text('The lookup failed.'),
        ),
      }),
    });
    const f = await fixture(model);
    f.service.configurer.registerTool('fail', {
      version: '1',
      definition: {
        inputSchema: z.object({}),
        execute: () => {
          throw new Error('Lookup unavailable');
        },
      },
    });
    const agent = await f.service.realtime(context(), { tool: ['fail'] });
    await agent.send([{ role: 'user', content: 'Lookup' }]);
    await settle(agent);
    expect(JSON.stringify(await agent.history())).toContain(
      'Lookup unavailable',
    );
    await agent.send([{ role: 'user', content: 'Lookup' }]);
    await settle(agent);
    expect(
      (await agent.history()).filter((message) => message.role === 'user'),
    ).toHaveLength(2);
    expect(model.doStreamCalls).toHaveLength(3);
  });
});

it('round trips provider fields, bytes, URLs and marker-shaped tool data without exposing private parts', () => {
  const data = {
    bytes: new Uint8Array([1, 255]),
    url: new URL('https://example.test/file'),
    nested: { __type: 'bytes', data: 'ordinary' },
  };
  expect(decode(encode(data))).toEqual(data);
  expect(() => encode({ infinite: Infinity })).toThrow();
  const message: ModelMessage = {
    role: 'assistant',
    content: [
      { type: 'text', text: 'Public' },
      {
        type: 'reasoning',
        text: 'Private',
        providerOptions: { fixture: { signature: 'secret' } },
      },
    ],
  };
  expect(restore(content(message), 'assistant')).toEqual(message);
  expect(project(message)).toEqual({
    role: 'assistant',
    parts: [{ type: 'text', text: 'Public' }],
  });
  expect(restore({ content: 'Old notice' }, 'system')).toBeNull();
});

it('resolves scope order and explicit overrides, rejects unsupported requirements and changed tools', async () => {
  const configurer = new OnlineAgentConfigurer();
  configurer.registerOnlineAgentGlobalScope({
    systemPromptTemplate: 'Global',
    model: ['fixture/chat'],
  });
  configurer.registerOnlineAgentScope('business', {
    systemPromptTemplate: { template: (ctx) => `${ctx.systemPrompt}:business` },
    context: { variable: { value: 1 } },
  });
  const initial = await configurer.resolve(context(), { scope: ['business'] });
  expect(initial.systemPrompt).toBe('Global:business');
  expect(
    (await configurer.resolve(context(), { model: [] }, initial)).model,
  ).toEqual([]);
  expect(() =>
    configurer.registerOnlineAgentGlobalScope({ permissions: [] } as never),
  ).toThrow('not supported');
  expect(() =>
    configurer.registerTool('approval', {
      version: '1',
      definition: { needsApproval: true } as never,
    }),
  ).toThrow('not supported');
});

it('replays the first cache before live events, disconnects without stopping execution and isolates old writers', async () => {
  const streams = new MemoryOnlineAgentStreamManager();
  const writer = await streams.open('s', 1);
  await writer.publish(0, project(null, 'First'));
  const reader = (await streams.receive('s'))!.getReader();
  expect((await reader.read()).value).toMatchObject({
    type: 'part',
    item: { parts: [{ text: 'First' }] },
  });
  await reader.cancel();
  await writer.publish(0, project(null, 'Final'));
  const late = (await streams.receive('s'))!.getReader();
  expect((await late.read()).value).toMatchObject({ type: 'part' });
  await writer.finish('completed', 2);
  expect(await streams.receive('s')).toBeNull();
  const next = await streams.open('s', 2);
  await writer.finish('completed', 2);
  expect(await streams.receive('s')).not.toBeNull();
  await next.finish('completed', 2);
});

it('commits all inputs and attachment links atomically and rolls them back on a later failure', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Done')) }),
    }),
  );
  const first = await f.service.realtime(context());
  const second = await f.service.realtime(context());
  const attachment = await h.services.chatAttachments.upload(
    'alice',
    new File(['fixture'], 'fixture.txt', { type: 'text/plain' }),
  );
  await expect(
    first.send(
      [
        { role: 'user', content: 'First' },
        { role: 'user', content: 'Second' },
      ],
      { attachmentIds: [[attachment.id], ['missing-upload']] },
    ),
  ).rejects.toThrow();
  expect(await first.history()).toEqual([]);
  expect((await f.sessions.load('alice', first.sessionId)).call).toBeNull();
  expect(
    (
      await h.database
        .connection()
        .repository('agChatAttachments')
        .findOne({ filter: { id: attachment.id } })
    )?.conversationId,
  ).toBeNull();
  await second.send([{ role: 'user', content: 'Use the upload' }], {
    attachmentIds: [[attachment.id]],
  });
  await settle(second);
  await expect(
    first.send([{ role: 'user', content: 'Reuse' }], {
      attachmentIds: [[attachment.id]],
    }),
  ).rejects.toThrow();
  expect(await first.history()).toEqual([]);
});

it('keeps per-user tool context separate and validates background results with the original schema instance', async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({ stream: streamed(text('{"count":2}')) }),
  });
  const f = await fixture(model);
  const schema = z
    .object({ count: z.number() })
    .transform(({ count }) => ({ doubled: count * 2 }));
  const background = await f.service.background(context('bob'));
  await background.run([{ role: 'user', content: 'Count' }], schema);
  await settle(background);
  expect(await background.get()).toEqual({ doubled: 4 });
  expect(await background.receive()).toBeNull();
  await background.run(
    [{ role: 'user', content: 'Invalid schema' }],
    z.object({ count: z.string() }),
  );
  await settle(background);
  await expect(background.get()).rejects.toThrow('No successful');
  const row = await f.sessions.load('bob', background.sessionId);
  expect(row.call).toMatchObject({ actorId: 'bob', outcome: 'failed' });
});

it('does not evaluate providers on read and persists only explicit idle overrides with the original model columns', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Done')) }),
    }),
  );
  const global = vi.fn(() => ({ systemPromptTemplate: 'Initial' }));
  const business = vi.fn(() => ({ systemPromptTemplate: 'Changed' }));
  f.service.configurer.registerOnlineAgentGlobalScope(global);
  f.service.configurer.registerOnlineAgentScope('change', business);
  const agent = await f.service.realtime(context());
  const loaded = await f.service.realtime(context(), {
    sessionId: agent.sessionId,
  });
  await loaded.status();
  await loaded.history();
  await loaded.receive();
  expect(global).toHaveBeenCalledTimes(1);
  expect(business).not.toHaveBeenCalled();
  await loaded.send([{ role: 'user', content: 'Change' }], {
    overrides: { scope: ['change'] },
  });
  await settle(loaded);
  const session = await f.sessions.load('alice', agent.sessionId);
  expect(session.config.systemPrompt).toBe('Changed');
  expect(session.model).toEqual(ref);
  expect(global).toHaveBeenCalledTimes(1);
  expect(business).toHaveBeenCalledTimes(1);
  await expect(
    loaded.send([{ role: 'user', content: 'Clear models' }], {
      overrides: { model: [] },
    }),
  ).rejects.toThrow('outside');
  expect(
    (await f.sessions.load('alice', agent.sessionId)).config.model,
  ).toEqual(['fixture/chat']);
});

it('caches a shared factory while binding distinct users to streaming tool execution', async () => {
  let step = 0;
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: streamed(
        step++ % 2 === 0
          ? [
              {
                type: 'tool-call',
                toolCallId: `call-${step}`,
                toolName: 'who',
                input: '{}',
              },
              finish('tool-calls'),
            ]
          : text('Done'),
      ),
    }),
  });
  const f = await fixture(model);
  const actors: string[] = [];
  const factory = vi.fn(() => ({
    inputSchema: z.object({}),
    execute: async function* (
      _input: object,
      {
        context: actor,
      }: { context: import('../server/online-agent/config.js').ToolContext },
    ) {
      actors.push(actor.user.id);
      expect(actor.authorization.identity.principal?.id).toBe(actor.user.id);
      yield { phase: 'working', actor: actor.user.id };
      yield { phase: 'complete', actor: actor.user.id };
    },
  }));
  f.service.configurer.registerTool('who', {
    version: '1',
    definition: factory,
  });
  for (const id of ['alice', 'bob']) {
    const agent = await f.service.realtime(context(id), { tool: ['who'] });
    await agent.send([{ role: 'user', content: id }]);
    await settle(agent);
    expect(JSON.stringify(await agent.history())).toContain(id);
    expect(JSON.stringify(await agent.history())).not.toContain(
      id === 'alice' ? 'bob' : 'alice',
    );
  }
  expect(actors).toEqual(['alice', 'bob']);
  expect(factory).toHaveBeenCalledTimes(1);
});

it('drains a provider error before finalization and keeps incomplete text out of canonical history', async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: streamed([
        { type: 'text-start', id: 'partial' },
        { type: 'text-delta', id: 'partial', delta: 'Partial answer' },
        { type: 'error', error: new Error('Fixture provider failed') },
      ]),
    }),
  });
  const f = await fixture(model);
  const agent = await f.service.realtime(context());
  await agent.send([{ role: 'user', content: 'Answer' }]);
  await settle(agent);
  expect((await f.sessions.load('alice', agent.sessionId)).call).toMatchObject({
    outcome: 'failed',
  });
  expect(await agent.history()).toHaveLength(1);
  const rows = await h.database
    .connection()
    .repository('agConversationMessages')
    .findMany({ filter: { conversationId: agent.sessionId } });
  expect(JSON.stringify(rows)).toContain('Partial answer');
  expect(model.doStreamCalls).toHaveLength(1);
});

it('selects the first resolved business or request model before validating the original model columns', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Done')) }),
    }),
  );
  f.service.configurer.registerOnlineAgentScope('business', {
    model: ['fixture/business'],
  });
  const business = await f.service.realtime(context(), { scope: ['business'] });
  expect((await f.sessions.load('alice', business.sessionId)).model).toEqual({
    modelService: 'fixture',
    model: 'business',
  });
  const direct = await f.service.realtime(context(), {
    model: ['other/direct'],
  });
  expect((await f.sessions.load('alice', direct.sessionId)).model).toEqual({
    modelService: 'other',
    model: 'direct',
  });
  expect(f.resolveModel).toHaveBeenCalledWith(
    { modelService: 'other', model: 'direct' },
    '',
  );
});

it('atomically changes idle model columns and configuration within or across services', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Done')) }),
    }),
  );
  const agent = await f.service.realtime(context());
  for (const selectedModel of [
    { modelService: 'fixture', model: 'other' },
    { modelService: 'other', model: 'chat' },
  ]) {
    const model = [`${selectedModel.modelService}/${selectedModel.model}`];
    await expect(
      agent.send([{ role: 'user', content: 'Change' }], {
        overrides: { model },
        selectedModel,
        attachmentIds: [['missing-upload']],
      }),
    ).rejects.toThrow();
    const unchanged = await f.sessions.load('alice', agent.sessionId);
    expect(unchanged.model).not.toEqual(selectedModel);
    expect(unchanged.config.model).not.toEqual(model);
    await agent.send([{ role: 'user', content: 'Change' }], {
      overrides: { model },
      selectedModel,
    });
    await settle(agent);
    const changed = await f.sessions.load('alice', agent.sessionId);
    expect(changed.model).toEqual(selectedModel);
    expect(changed.config.model).toEqual(model);
    expect(f.resolveModel).toHaveBeenCalledWith(selectedModel, agent.sessionId);
  }
  await agent.send([{ role: 'user', content: 'Implicit first model' }], {
    overrides: { model: ['third/chat'] },
  });
  await settle(agent);
  expect((await f.sessions.load('alice', agent.sessionId)).model).toEqual({
    modelService: 'third',
    model: 'chat',
  });
});

it.each(['realtime', 'background'] as const)(
  'consumes opening overrides once after acceptance for %s, then restores newer snapshots',
  async (kind) => {
    const f = await fixture(
      new MockLanguageModelV4({
        doStream: async () => ({ stream: streamed(text('Done')) }),
      }),
    );
    f.service.configurer.registerOnlineAgentGlobalScope({
      systemPromptTemplate: 'Initial',
    });
    const provider = vi.fn(() => ({
      systemPromptTemplate: {
        template: (ctx: Context) => `${ctx.systemPrompt}:once`,
      },
    }));
    f.service.configurer.registerOnlineAgentScope('change', provider);
    const agent = await f.service[kind](context());
    const opened = await f.service[kind](context(), {
      sessionId: agent.sessionId,
      scope: ['change'],
    });
    const submit = () =>
      kind === 'realtime'
        ? opened.send([{ role: 'user', content: 'Next' }])
        : opened.run([{ role: 'user', content: 'Next' }]);
    const accept = vi
      .spyOn(f.sessions, 'accept')
      .mockRejectedValueOnce(new Error('Admission failed'));
    await expect(submit()).rejects.toThrow('Admission failed');
    expect(
      (await f.sessions.load('alice', agent.sessionId)).config.systemPrompt,
    ).toBe('Initial');
    await submit();
    await settle(opened);
    expect(
      (await f.sessions.load('alice', agent.sessionId)).config.systemPrompt,
    ).toBe('Initial:once');
    await submit();
    await settle(opened);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(
      (await f.sessions.load('alice', agent.sessionId)).config.systemPrompt,
    ).toBe('Initial:once');
    const newer = await f.service[kind](context(), {
      sessionId: agent.sessionId,
    });
    await newer.send([{ role: 'user', content: 'Update elsewhere' }], {
      overrides: { systemPromptTemplate: 'Newer' },
    });
    await settle(newer);
    await submit();
    await settle(opened);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(
      (await f.sessions.load('alice', agent.sessionId)).config.systemPrompt,
    ).toBe('Newer');
    accept.mockRestore();
  },
);

it.each(['success', 'error', 'stream'] as const)(
  'retains cancelled tool %s evidence through save retry without replay or public leakage',
  async (mode) => {
    const entered = deferred();
    const release = deferred();
    let signal!: AbortSignal;
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: streamed([
          {
            type: 'tool-call',
            toolCallId: 'effect',
            toolName: 'effect',
            input: '{"key":"private-input"}',
            providerMetadata: { fixture: { signature: 'private-provider' } },
          },
          finish('tool-calls'),
        ]),
      }),
    });
    const f = await fixture(model);
    const execute = vi.fn(async () => {
      entered.resolve();
      await release.promise;
      if (mode === 'error') throw new Error('private-failure');
      return { value: 'private-result' };
    });
    f.service.configurer.registerTool('effect', {
      version: '1',
      definition: {
        inputSchema: z.object({ key: z.string() }),
        execute: (_input, options) => {
          signal = options.context.signal;
          if (mode !== 'stream') return execute();
          return (async function* () {
            yield { value: 'preliminary' };
            yield await execute();
          })();
        },
      },
    });
    const agent = await f.service.realtime(context(), { tool: ['effect'] });
    const save = vi
      .spyOn(f.sessions, 'save')
      .mockRejectedValueOnce(new Error('Save unavailable'));
    await agent.send([{ role: 'user', content: 'Run' }]);
    await entered.promise;
    const stopped = agent.abort();
    await vi.waitFor(() => expect(signal.aborted).toBe(true));
    release.resolve();
    await stopped;
    expect(save).toHaveBeenCalledTimes(2);
    const rows = await h.database
      .connection()
      .repository('agConversationMessages')
      .findMany({ filter: { conversationId: agent.sessionId } });
    const evidence = rows.filter(
      (row) => row.content.original?.excludedFromHistory,
    );
    expect(evidence).toHaveLength(2);
    const messages = evidence.map(
      (row) => decode(row.content.original.message) as ModelMessage,
    );
    expect(JSON.stringify(messages)).toContain('private-input');
    expect(JSON.stringify(messages)).toContain('private-provider');
    expect(JSON.stringify(messages)).toContain(
      mode === 'error' ? 'private-failure' : 'private-result',
    );
    expect(
      JSON.stringify(messages.map((message) => project(message))),
    ).not.toContain('private');
    expect(await agent.history()).toEqual([{ role: 'user', content: 'Run' }]);
    expect(await agent.status()).toBe('idle');
    await agent.retryFinalization();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(model.doStreamCalls).toHaveLength(1);
    expect(await agent.receive()).toBeNull();
  },
);

it.each([false, true])(
  'persists converted business outputs with cancellation=%s and permits the next round',
  async (cancel) => {
    const entered = deferred();
    const release = deferred();
    let signal!: AbortSignal;
    let step = 0;
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: streamed(
          step++ === 0
            ? [
                {
                  type: 'tool-call',
                  toolCallId: 'dated',
                  toolName: 'dated',
                  input: '{"key":"private-input"}',
                },
                finish('tool-calls'),
              ]
            : text('Done'),
        ),
      }),
    });
    const f = await fixture(model);
    const execute = vi.fn(
      async (_input: { key: string }, options: { context: ToolContext }) => {
        signal = options.context.signal;
        entered.resolve();
        await release.promise;
        return { value: 'private-result', at: new Date(0) };
      },
    );
    const toModelOutput = vi.fn(
      async ({
        toolCallId,
        input,
        output,
      }: {
        toolCallId: string;
        input: { key: string };
        output: { value: string; at: Date };
      }) => ({
        type: 'json' as const,
        value: {
          call: toolCallId,
          key: input.key,
          value: output.value,
          at: output.at.toISOString(),
        },
      }),
    );
    f.service.configurer.registerTool('dated', {
      version: '1',
      definition: {
        inputSchema: z.object({ key: z.string() }),
        execute,
        toModelOutput,
      },
    });
    const agent = await f.service.realtime(context(), { tool: ['dated'] });
    const save = vi
      .spyOn(f.sessions, 'save')
      .mockRejectedValueOnce(new Error('Save unavailable'));
    await agent.send([{ role: 'user', content: 'Run' }]);
    await entered.promise;
    const stopping = cancel ? agent.abort() : undefined;
    if (cancel) await vi.waitFor(() => expect(signal.aborted).toBe(true));
    release.resolve();
    if (stopping) await stopping;
    else
      await vi.waitFor(() =>
        expect(
          f.errors.some(
            (error) =>
              error instanceof Error && error.message === 'Save unavailable',
          ),
        ).toBe(true),
      );
    await agent.retryFinalization();
    await settle(agent);
    expect(save).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(toModelOutput).toHaveBeenCalled();
    if (cancel) expect(toModelOutput).toHaveBeenCalledTimes(1);
    const rows = await h.database
      .connection()
      .repository('agConversationMessages')
      .findMany({ filter: { conversationId: agent.sessionId } });
    const messages = rows.flatMap((row) =>
      row.content.original?.message
        ? [decode(row.content.original.message) as ModelMessage]
        : [],
    );
    const result = messages.find((message) => message.role === 'tool');
    expect(result).toMatchObject({
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          output: {
            type: 'json',
            value: {
              call: 'dated',
              key: 'private-input',
              value: 'private-result',
              at: '1970-01-01T00:00:00.000Z',
            },
          },
        },
      ],
    });
    expect(
      JSON.stringify(messages.map((message) => project(message))),
    ).not.toContain('private');
    if (cancel)
      expect(await agent.history()).toEqual([{ role: 'user', content: 'Run' }]);
    expect(await agent.status()).toBe('idle');
    const conversions = toModelOutput.mock.calls.length;
    await agent.send([{ role: 'user', content: 'Continue' }]);
    await settle(agent);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(toModelOutput).toHaveBeenCalledTimes(conversions);
    expect(model.doStreamCalls).toHaveLength(cancel ? 2 : 3);
    if (cancel)
      expect(JSON.stringify(model.doStreamCalls[1].prompt)).not.toContain(
        'private',
      );
  },
);

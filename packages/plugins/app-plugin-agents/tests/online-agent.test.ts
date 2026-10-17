import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import {
  readUIMessageStream,
  isToolUIPart,
  type JSONSchema7,
  type ModelMessage,
} from 'ai';
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
  type OnlineAgentContext,
  type OnlineAgentToolContext,
} from '../server/online-agent/config.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { OnlineAgentMemoryStreamManager } from '../server/online-agent/streams.js';
import {
  content,
  decode,
  encode,
  project,
  restore,
} from '../server/online-agent/codec.js';
import { appUIMessageText, type AppUIMessage } from '../shared/online-agent.js';

const ref = { modelService: 'fixture', model: 'chat' };
const context = (id = 'alice'): OnlineAgentContext => ({
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
  streams = new OnlineAgentMemoryStreamManager(),
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
    files: h.services.chatAttachments,
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
  vi.spyOn(h.services.onlineAgent, 'isActive').mockImplementation((id) =>
    service.isActive(id),
  );
  return {
    service,
    sessions,
    resolver,
    errors,
    measurements,
    resolveModel,
    history: async (agent: { sessionId: string }, userId = 'alice') =>
      (await sessions.load(userId, agent.sessionId)).kind === 'background'
        ? sessions.history(userId, agent.sessionId)
        : (
            await sessions.native.executionHistory(
              userId,
              agent.sessionId,
              undefined,
              false,
            )
          ).model,
  };
}

async function settle(
  agent: Awaited<ReturnType<OnlineAgentService['realtime']>>,
) {
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
}

describe('OnlineAgent service slice', () => {
  it('delivers A then B before finish and saves the SDK answer exactly once', async () => {
    let output!: ReadableStreamDefaultController;
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: new ReadableStream({
          start(controller) {
            output = controller;
          },
        }),
      }),
    });
    const f = await fixture(model);
    const agent = await f.service.realtime(context());
    await agent.send([{ role: 'user', content: 'Stream' }]);
    const reader = (await agent.receive())!.getReader();
    expect((await reader.read()).value).toMatchObject({ type: 'start' });
    output.enqueue({ type: 'text-start', id: 'a' });
    expect((await reader.read()).value).toMatchObject({ type: 'start-step' });
    expect((await reader.read()).value).toMatchObject({
      type: 'text-start',
      id: 'a',
    });
    output.enqueue({ type: 'text-delta', id: 'a', delta: 'A' });
    expect((await reader.read()).value).toMatchObject({
      type: 'text-delta',
      delta: 'A',
    });
    output.enqueue({ type: 'text-delta', id: 'a', delta: 'B' });
    expect((await reader.read()).value).toMatchObject({
      type: 'text-delta',
      delta: 'B',
    });
    expect(await agent.status()).toBe('running');
    output.enqueue({ type: 'text-end', id: 'a' });
    output.enqueue(finish());
    output.close();
    await settle(agent);
    expect(
      ((await agent.history()) as AppUIMessage[]).map(appUIMessageText),
    ).toEqual(['Stream', 'AB']);
    expect(await f.history(agent)).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Stream' }] },
      expect.objectContaining({ role: 'assistant' }),
    ]);
    await reader.cancel();
  });
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
      read(value: number, actor: OnlineAgentToolContext): number;
    }>('fixture-business');
    const read = vi.fn((value: number, actor: OnlineAgentToolContext) => {
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
    ).toBe(2);
    const stored = await h.database
      .connection()
      .repository('agConversationMessages')
      .findMany({
        filter: { conversationId: agent.sessionId },
        sort: (sort) => [sort.field('seq').asc()],
      });
    expect(stored.map((row) => row.role)).toEqual(['user', 'assistant']);
    expect(stored.every((row) => row.id === row.content.original.id)).toBe(
      true,
    );
    const publicHistory = await h.services.conversations.messages(
      'alice',
      agent.sessionId,
      {},
    );
    expect(publicHistory.items.map((item) => item.role)).toEqual(
      stored.map((row) => row.role),
    );
    expect(JSON.stringify(publicHistory)).not.toContain('private-signature');
    expect(JSON.stringify(publicHistory)).not.toContain('toolCallId');
    expect(read).toHaveBeenCalledTimes(2);
    expect(step).toBe(3);
    expect(f.errors).toEqual([]);
    const history = await f.history(agent);
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
    const firstResponse = await agent.receive();
    let snapshot;
    for await (const current of readUIMessageStream({
      stream: firstResponse as ReadableStream<
        import('../server/online-agent/native.js').NativeUIChunk
      >,
    }))
      snapshot = current;
    expect(snapshot.id).toBe(stored[1].id);
    expect(JSON.stringify(snapshot)).not.toContain('private-signature');
    expect(await agent.receive()).toBeNull();
    const reloaded = await f.service.realtime(context(), {
      sessionId: agent.sessionId,
    });
    expect(await f.history(reloaded)).toEqual(history);
    expect(f.measurements.map((item) => item.phase)).toEqual([
      'native.accept',
      'native.save',
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
    expect(rows).toHaveLength(2);
    expect(rows[1].metadata.nativeEvidence.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'tool-wait',
          toolCallId: 'call',
          input: {},
          state: 'output-available',
          output: { type: 'text', value: 'stopped' },
        }),
      ]),
    );
    expect(JSON.stringify(rows[1].content.original)).not.toContain(
      'toolCallId',
    );
    expect(await f.history(agent)).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Wait' }] },
    ]);
    expect(model.doStreamCalls).toHaveLength(1);
    client.off('query', record);
    expect(f.measurements.map((item) => item.phase)).toEqual([
      'native.accept',
      'native.save',
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

  it('retries failed and commit-unknown UI saves without rerunning the SDK or duplicating messages', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Saved once')) }),
    });
    const streams = new OnlineAgentMemoryStreamManager();
    const f = await fixture(model, streams);
    const persist = f.sessions.native.save.bind(f.sessions.native);
    const save = vi
      .spyOn(f.sessions.native, 'save')
      .mockRejectedValueOnce(new Error('save failed'))
      .mockImplementationOnce(async (...args) => {
        await persist(...args);
        throw new Error('commit response lost');
      });
    const agent = await f.service.realtime(context());
    await agent.send([{ role: 'user', content: 'Save' }]);
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(await agent.status()).toBe('running');
    await expect(agent.retryFinalization()).rejects.toThrow(
      'commit response lost',
    );
    expect(await agent.status()).toBe('running');
    expect(
      (await h.services.conversations.get('alice', agent.sessionId)).execution
        ?.status,
    ).toBe('running');
    expect(
      (await h.services.conversations.list('alice', {})).items.find(
        (item) => item.id === agent.sessionId,
      )?.execution?.status,
    ).toBe('running');
    const http = await h.request(
      'GET',
      '/agents/conversations/' + agent.sessionId,
      { user: 'alice' },
    );
    expect(http.status).toBe(200);
    expect(http.body.data.execution.status).toBe('running');
    await expect(
      agent.send([{ role: 'user', content: 'Too soon' }]),
    ).rejects.toThrow('busy');
    expect(model.doStreamCalls).toHaveLength(1);
    await agent.retryFinalization();
    expect(
      (await h.services.conversations.get('alice', agent.sessionId)).execution
        ?.status,
    ).toBe('idle');
    expect(save).toHaveBeenCalledTimes(3);
    expect(await agent.status()).toBe('idle');
    expect(model.doStreamCalls).toHaveLength(1);
    expect(await f.history(agent)).toHaveLength(2);
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
    expect(JSON.stringify(await f.history(agent))).toContain(
      'Lookup unavailable',
    );
    await agent.send([{ role: 'user', content: 'Lookup' }]);
    await settle(agent);
    expect(
      (await f.history(agent)).filter((message) => message.role === 'user'),
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
  expect(() => restore({ content: 'Old notice' }, 'system')).toThrow(
    'background execution message',
  );
});

it('resolves scope order and explicit overrides, rejects unsupported requirements and changed tools', async () => {
  const configurer = new OnlineAgentConfigurer();
  configurer.registerOnlineAgentGlobalScope({
    agentId: 'global-agent',
    systemPromptTemplate: 'Global',
    model: ['fixture/chat'],
  });
  configurer.registerOnlineAgentScope('business', {
    agentId: 'business-agent',
    systemPromptTemplate: { template: (ctx) => `${ctx.systemPrompt}:business` },
    context: { variable: { value: 1 } },
  });
  const initial = await configurer.resolve(context(), { scope: ['business'] });
  expect(initial.agentId).toBe('business-agent');
  configurer.registerOnlineAgentScope('coding', { agentId: 'coding-agent' });
  expect(
    (await configurer.resolve(context(), { scope: ['business', 'coding'] }))
      .agentId,
  ).toBe('coding-agent');
  expect(
    (
      await configurer.resolve(context(), {
        scope: ['business', 'coding'],
        agentId: 'online',
      })
    ).agentId,
  ).toBe('online');
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
  ).toThrow('public projections');
});

it('replays the first cache before live events, disconnects without stopping execution and isolates old writers', async () => {
  const streams = new OnlineAgentMemoryStreamManager();
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
it('captures an immutable cumulative prefix, then delivers live increments once within cache limits', async () => {
  const streams = new OnlineAgentMemoryStreamManager(400);
  const writer = await streams.open('prefix', 1);
  await writer.append(0, 'A');
  await writer.append(0, 'B');
  const reader = (await streams.receive('prefix'))!.getReader();
  await writer.append(0, 'C');
  expect((await reader.read()).value).toMatchObject({
    type: 'part',
    item: { parts: [{ text: 'AB' }] },
  });
  expect((await reader.read()).value).toMatchObject({
    type: 'delta',
    text: 'C',
  });
  for (let index = 0; index < 100; index++) await writer.append(0, 'x');
  // One retained prefix fits; retaining every cumulative snapshot would exhaust the limit.
  await expect(writer.append(0, 'y'.repeat(400))).rejects.toThrow(
    'cache limit',
  );
  await reader.cancel();
  await writer.finish('completed', 2);
});

it('commits all inputs and attachment links atomically and rolls them back on a later failure', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Done')) }),
    }),
  );
  const first = await f.service.background(context());
  const second = await f.service.background(context());
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
  expect(await f.history(first)).toEqual([]);
  expect((await f.sessions.load('alice', first.sessionId)).call).toBeNull();
  expect(
    (
      await h.database
        .connection()
        .repository('agChatAttachments')
        .findOne({ filter: { id: attachment.id } })
    )?.conversationId,
  ).toBeNull();
  await expect(
    first.send([{ role: 'user', content: 'Duplicate upload' }], {
      attachmentIds: [[attachment.id, attachment.id]],
    }),
  ).rejects.toThrow('distinct attachments');
  expect(await f.history(first)).toEqual([]);
  await second.send([{ role: 'user', content: 'Use the upload' }], {
    attachmentIds: [[attachment.id]],
  });
  await settle(second);
  await expect(
    first.send([{ role: 'user', content: 'Reuse' }], {
      attachmentIds: [[attachment.id]],
    }),
  ).rejects.toThrow();
  expect(await f.history(first)).toEqual([]);
});

it('passes a frontend JSON Schema to the SDK and persists its validated result', async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({ stream: streamed(text('{"count":2}')) }),
  });
  const f = await fixture(model);
  const schema: JSONSchema7 = JSON.parse(
    JSON.stringify({
      type: 'object',
      properties: { count: { type: 'integer', minimum: 0 } },
      required: ['count'],
      additionalProperties: false,
    }),
  );
  const background = await f.service.background(context('bob'));
  await background.run([{ role: 'user', content: 'Count' }], schema);
  await settle(background);
  expect(model.doStreamCalls[0].responseFormat).toEqual({
    type: 'json',
    schema,
  });
  expect(await background.get()).toEqual({ count: 2 });
  expect(await background.receive()).toBeNull();
  const loaded = await f.service.background(context('bob'), {
    sessionId: background.sessionId,
  });
  expect(await loaded.get()).toEqual({ count: 2 });
  await expect(
    f.service.background(context('alice'), {
      sessionId: background.sessionId,
    }),
  ).rejects.toThrow();
});

it.each([
  'not JSON',
  '{"count":"2"}',
  '{"count":-1}',
  '{"count":1.5}',
  '{}',
  '{"count":2,"extra":true}',
])('does not persist an invalid structured output: %s', async (answer) => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({ stream: streamed(text(answer)) }),
  });
  const f = await fixture(model);
  const background = await f.service.background(context());
  const schema: JSONSchema7 = {
    type: 'object',
    properties: { count: { type: 'integer', minimum: 0, default: 3 } },
    required: ['count'],
    additionalProperties: false,
  };
  await background.run([{ role: 'user', content: 'Count' }], schema);
  await settle(background);
  await expect(background.get()).rejects.toThrow('No successful');
  const row = await f.sessions.load('alice', background.sessionId);
  expect(row.call).toMatchObject({ actorId: 'alice', outcome: 'failed' });
  expect(row.call?.result).toBeUndefined();
  expect((await background.history()).at(-1)).toMatchObject({
    role: 'assistant',
  });
  expect(f.errors).toHaveLength(1);
});

it('rejects invalid output schemas before accepting input or calling the model', async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({ stream: streamed(text('{"count":2}')) }),
  });
  const f = await fixture(model);
  const background = await f.service.background(context());
  const accept = vi.spyOn(f.sessions, 'accept');
  for (const schema of [
    { type: 'object', required: 'count' },
    { $ref: 'https://example.com/schema.json' },
    { $schema: 'https://json-schema.org/draft/2020-12/schema' },
    { $async: true, type: 'object' },
    { type: 'object', unknownKeyword: true },
    z.object({ count: z.number() }),
    undefined,
  ]) {
    await expect(
      background.run(
        [{ role: 'user', content: 'Count' }],
        schema as JSONSchema7,
      ),
    ).rejects.toThrow();
  }
  expect(accept).not.toHaveBeenCalled();
  expect(model.doStreamCalls).toHaveLength(0);
  expect(await background.status()).toBe('idle');
  expect(await background.history()).toEqual([]);
  await background.run([{ role: 'user', content: 'Count' }], {
    type: 'object',
    properties: { count: { type: 'integer' } },
    required: ['count'],
  });
  await settle(background);
  expect(await background.get()).toEqual({ count: 2 });
});

it('keeps the JSON Schema through business tool calls and validates the final SDK output', async () => {
  let step = 0;
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: streamed(
        step++ === 0
          ? [
              {
                type: 'tool-call',
                toolCallId: 'count',
                toolName: 'count',
                input: '{}',
              },
              finish('tool-calls'),
            ]
          : text('{"count":2}'),
      ),
    }),
  });
  const f = await fixture(model);
  const execute = vi.fn((_input, { context: actor }) => {
    expect(actor.user.id).toBe('bob');
    expect(actor.sessionId).toBe(background.sessionId);
    return { count: 2 };
  });
  f.service.configurer.registerTool('count', {
    version: '1',
    definition: { inputSchema: z.object({}), execute },
  });
  f.service.configurer.registerOnlineAgentGlobalScope({ tool: ['count'] });
  const background = await f.service.background(context('bob'));
  const schema: JSONSchema7 = {
    type: 'object',
    properties: { count: { type: 'integer' } },
    required: ['count'],
    additionalProperties: false,
  };
  await background.run([{ role: 'user', content: 'Count' }], schema);
  await settle(background);
  expect(await background.get()).toEqual({ count: 2 });
  expect(execute).toHaveBeenCalledTimes(1);
  expect(model.doStreamCalls).toHaveLength(2);
  for (const call of model.doStreamCalls)
    expect(call.responseFormat).toEqual({ type: 'json', schema });
  expect((await background.history()).map((message) => message.role)).toEqual([
    'user',
    'assistant',
    'tool',
    'assistant',
  ]);
  expect(f.errors).toEqual([]);
});

it.each([
  { type: 'unsupported', feature: 'responseFormat', failed: true },
  { type: 'unsupported', feature: 'responseFormat (JSON)', failed: true },
  { type: 'unsupported', feature: 'temperature', failed: false },
  {
    type: 'compatibility',
    feature: 'JSON Schema propertyNames',
    details: 'Validated locally.',
    failed: false,
  },
] as const)(
  'handles structured output warning $feature without accepting a downgrade',
  async ({ failed, ...warning }) => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: streamed([
          { type: 'stream-start' as const, warnings: [warning] },
          ...text('{"count":2}'),
        ]),
      }),
    });
    const f = await fixture(model);
    const background = await f.service.background(context());
    await background.run([{ role: 'user', content: 'Count' }], {
      type: 'object',
      properties: { count: { type: 'integer' } },
      required: ['count'],
    });
    await settle(background);
    if (failed) {
      await expect(background.get()).rejects.toThrow('No successful');
      expect(f.errors).toEqual([
        expect.objectContaining({
          message: 'The model does not support structured output.',
        }),
      ]);
    } else {
      expect(await background.get()).toEqual({ count: 2 });
    }
  },
);

it('retries structured result persistence without rerunning the model', async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({ stream: streamed(text('{"count":2}')) }),
  });
  const f = await fixture(model);
  const background = await f.service.background(context());
  const save = vi
    .spyOn(f.sessions, 'save')
    .mockRejectedValueOnce(new Error('Save unavailable'));
  const schema: JSONSchema7 = {
    type: 'object',
    properties: { count: { type: 'integer' } },
    required: ['count'],
  };
  await background.run([{ role: 'user', content: 'Count' }], schema);
  await vi.waitFor(() => expect(f.errors).toHaveLength(1));
  expect(await background.status()).toBe('running');
  await expect(background.get()).rejects.toThrow('No successful');
  await background.retryFinalization();
  expect(await background.status()).toBe('idle');
  expect(await background.get()).toEqual({ count: 2 });
  expect(save).toHaveBeenCalledTimes(2);
  expect(model.doStreamCalls).toHaveLength(1);
  expect(await background.history()).toHaveLength(2);
  await background.run([{ role: 'user', content: 'Expect a string instead' }], {
    type: 'object',
    properties: { count: { type: 'string' } },
    required: ['count'],
  });
  await settle(background);
  await expect(background.get()).rejects.toThrow('No successful');
});

it('cancels incomplete structured generation without saving a result', async () => {
  const entered = deferred();
  const model = new MockLanguageModelV4({
    doStream: async ({ abortSignal }) => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'text-start', id: 'partial' });
          controller.enqueue({
            type: 'text-delta',
            id: 'partial',
            delta: '{"count":',
          });
          abortSignal?.addEventListener(
            'abort',
            () => {
              controller.error(new DOMException('Aborted', 'AbortError'));
            },
            { once: true },
          );
          entered.resolve();
        },
      }),
    }),
  });
  const f = await fixture(model);
  const background = await f.service.background(context());
  await background.run([{ role: 'user', content: 'Count' }], {
    type: 'object',
    properties: { count: { type: 'integer' } },
    required: ['count'],
  });
  await entered.promise;
  await background.abort();
  expect(await background.status()).toBe('idle');
  await expect(background.get()).rejects.toThrow('No successful');
  expect(
    (await f.sessions.load('alice', background.sessionId)).call,
  ).toMatchObject({ outcome: 'cancelled' });
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
      }: {
        context: import('../server/online-agent/config.js').OnlineAgentToolContext;
      },
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
    expect(JSON.stringify(await f.history(agent, id))).toContain(id);
    expect(JSON.stringify(await f.history(agent, id))).not.toContain(
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
  expect(await f.history(agent)).toHaveLength(1);
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
        template: (ctx: OnlineAgentContext) => `${ctx.systemPrompt}:once`,
      },
    }));
    f.service.configurer.registerOnlineAgentScope('change', provider);
    const agent = await f.service[kind](context());
    const opened = await f.service[kind](context(), {
      sessionId: agent.sessionId,
      scope: ['change'],
    });
    const submit = () => opened.send([{ role: 'user', content: 'Next' }]);
    const accept = vi
      .spyOn(kind === 'realtime' ? f.sessions.native : f.sessions, 'accept')
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
      .spyOn(f.sessions.native, 'save')
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
    const evidence = rows.filter((row) => row.metadata.nativeEvidence);
    expect(evidence).toHaveLength(1);
    expect(JSON.stringify(evidence[0].metadata.nativeEvidence)).toContain(
      'private-input',
    );
    expect(JSON.stringify(evidence[0].metadata.nativeEvidence)).toContain(
      'private-provider',
    );
    expect(JSON.stringify(evidence[0].metadata.nativeEvidence)).toContain(
      mode === 'error' ? 'private-failure' : 'private-result',
    );
    expect(JSON.stringify(await agent.history())).not.toContain('private');
    expect(await f.history(agent)).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Run' }] },
    ]);
    expect(await agent.status()).toBe('idle');
    await agent.retryFinalization();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(model.doStreamCalls).toHaveLength(1);
    const initial = await agent.receive();
    expect(initial).not.toBeNull();
    await initial!.cancel();
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
      async (
        _input: { key: string },
        options: { context: OnlineAgentToolContext },
      ) => {
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
      .spyOn(f.sessions.native, 'save')
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
    const result = rows
      .flatMap((row) => row.metadata.nativeEvidence?.parts ?? [])
      .find((part) => isToolUIPart(part) && part.state === 'output-available');
    expect(result).toMatchObject({
      type: 'tool-dated',
      state: 'output-available',
      output: {
        type: 'json',
        value: {
          call: 'dated',
          key: 'private-input',
          value: 'private-result',
          at: '1970-01-01T00:00:00.000Z',
        },
      },
    });
    expect(JSON.stringify(await agent.history())).not.toContain('private');
    if (cancel)
      expect(await f.history(agent)).toEqual([
        { role: 'user', content: [{ type: 'text', text: 'Run' }] },
      ]);
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

it('keeps default and empty historical agent IDs readable without an OnlineAgent guard', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Done')) }),
    }),
  );
  const online = await f.service.realtime(context());
  const repository = h.database.connection().repository('agConversations');
  const row = await repository.findOne({ filter: { id: online.sessionId } });
  expect(row?.agentId).toBe('0');
  for (const agentId of ['', '0', 'missing-agent']) {
    await repository.updateMany({
      filter: { id: online.sessionId },
      values: { agentId, metadata: null },
    });
    const detail = await h.services.conversations.get(
      'alice',
      online.sessionId,
    );
    expect(detail.agent).toMatchObject({ id: agentId, name: null });
    await expect(
      f.service.realtime(context(), { sessionId: online.sessionId }),
    ).rejects.toThrow('historical conversation');
  }
});

it('warns on failed shutdown finalization, drains other executions and preserves explicit retry', async () => {
  const entered = deferred();
  const release = deferred();
  const model = new MockLanguageModelV4({
    doStream: async () => {
      entered.resolve();
      await release.promise;
      return { stream: streamed(text('Done')) };
    },
  });
  const f = await fixture(model);
  const first = await f.service.realtime(context());
  const second = await f.service.realtime(context());
  const original = f.sessions.native.save.bind(f.sessions.native);
  const failure = new Error('Shutdown persistence unavailable');
  const save = vi
    .spyOn(f.sessions.native, 'save')
    .mockImplementation((...args) => {
      if (args[1] === first.sessionId) return Promise.reject(failure);
      return original(...args);
    });
  // send acknowledges SDK creation; the fixture delays its model request instead of admission.
  const sends = Promise.all([
    first.send([{ role: 'user', content: 'First' }]),
    second.send([{ role: 'user', content: 'Second' }]),
  ]);
  await entered.promise;
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    let completed = false;
    const shutdown = f.service.shutdown().then(() => {
      completed = true;
    });
    await Promise.resolve();
    expect(completed).toBe(false);
    release.resolve();
    await sends;
    await expect(shutdown).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'OnlineAgent finalization failed during shutdown.',
      expect.objectContaining({ errors: [failure] }),
    );
    expect(await first.status()).toBe('running');
    expect(await second.status()).toBe('idle');
    await expect(first.abort()).rejects.toThrow(failure.message);
    save.mockRestore();
    await first.retryFinalization();
    expect(await first.status()).toBe('idle');
    expect(model.doStreamCalls).toHaveLength(2);
    await expect(f.service.realtime(context())).rejects.toThrow('stopping');
  } finally {
    release.resolve();
    warn.mockRestore();
  }
});

it('announces committed message revisions and permits stable ID rereads', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('Saved')) }),
    }),
  );
  const agent = await f.service.realtime(context());
  const events: { messageId?: string; revision?: number }[] = [];
  h.services.events.on('conversation.changed', (event) => {
    if (event.conversationId === agent.sessionId) events.push(event);
  });
  const save = vi
    .spyOn(f.sessions.native, 'save')
    .mockRejectedValueOnce(new Error('Save deferred'));
  await agent.send([{ role: 'user', content: 'Hello' }]);
  await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
  expect(events.filter((event) => event.messageId)).toHaveLength(1);
  await agent.retryFinalization();
  const changed = events.filter((event) => event.messageId);
  expect(changed.map((event) => event.revision)).toEqual([1, 1]);
  for (const event of changed) {
    const page = await f.sessions.native.page('alice', agent.sessionId, {
      ids: [event.messageId!],
      limit: 100,
    });
    expect(page.items[0]).toMatchObject({
      id: event.messageId,
      metadata: { revision: event.revision },
    });
  }
  const before = events.length;
  const session = await f.sessions.load('alice', agent.sessionId);
  await expect(
    f.sessions.native.accept(
      'alice',
      agent.sessionId,
      {
        id: changed[0]!.messageId!,
        parts: [{ type: 'text', text: 'Duplicate' }],
        attachments: [],
      },
      session.config,
      ref,
      'another-execution',
      'another-message',
      session,
    ),
  ).rejects.toThrow();
  expect(events).toHaveLength(before);
  expect(
    ((await agent.history()) as AppUIMessage[]).map(appUIMessageText),
  ).toEqual(['Hello', 'Saved']);
});

it('retries finalization without repeating a completed business tool or model step', async () => {
  let step = 0;
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: streamed(
        step++ === 0
          ? [
              {
                type: 'tool-call',
                toolCallId: 'once',
                toolName: 'business',
                input: '{}',
              },
              finish('tool-calls'),
            ]
          : text('Business saved'),
      ),
    }),
  });
  const f = await fixture(model);
  vi.spyOn(f.sessions.native, 'save').mockRejectedValueOnce(
    new Error('Finalization pending'),
  );
  const execute = vi.fn(() => ({ done: true }));
  f.service.configurer.registerTool('business', {
    version: '1',
    definition: { inputSchema: z.object({}), execute },
  });
  f.service.configurer.registerOnlineAgentGlobalScope({ tool: ['business'] });
  const agent = await f.service.realtime(context());
  await agent.send([{ role: 'user', content: 'Do business' }]);
  await vi.waitFor(() => expect(f.errors).toHaveLength(1));
  expect(await agent.status()).toBe('running');
  expect(
    (await h.services.conversations.get('alice', agent.sessionId)).execution
      ?.status,
  ).toBe('running');
  await expect(
    agent.send([{ role: 'user', content: 'Too early' }]),
  ).rejects.toThrow('busy');
  await agent.retryFinalization();
  expect(await agent.status()).toBe('idle');
  expect(model.doStreamCalls).toHaveLength(2);
  expect(execute).toHaveBeenCalledOnce();
  expect(
    appUIMessageText(
      ((await agent.history()) as AppUIMessage[])
        .filter((message) => message.role === 'assistant')
        .at(-1)!,
    ),
  ).toBe('Business saved');
});

it('marks accepted input read, retains read on empty or tool-only finalization, and marks only new visible output unread', async () => {
  const f = await fixture(
    new MockLanguageModelV4({
      doStream: async () => ({ stream: streamed(text('unused')) }),
    }),
  );
  const agent = await f.service.background(context());
  const id = agent.sessionId;
  const read = async () =>
    (await h.services.conversations.get('alice', id)).read;
  const session = await f.sessions.load('alice', id);
  const accept = (messageId: string) =>
    f.sessions.accept('alice', id, session.config, ref, [
      { id: messageId, message: { role: 'user', content: 'input' } },
    ]);
  await accept('input-one');
  expect(await read()).toBe(true);
  await f.sessions.save('alice', id, [], {
    state: 'idle',
    actorId: 'alice',
    outcome: 'cancelled',
  });
  expect(await read()).toBe(true);
  await f.sessions.finish('alice', id);
  await accept('empty-failure');
  await f.sessions.save('alice', id, [], {
    state: 'idle',
    actorId: 'alice',
    outcome: 'failed',
  });
  expect(await read()).toBe(true);
  await f.sessions.finish('alice', id);
  await accept('input-two');
  const items = [
    {
      id: 'output',
      message: { role: 'assistant' as const, content: 'visible' },
    },
  ];
  const call = {
    state: 'idle' as const,
    actorId: 'alice',
    outcome: 'completed' as const,
  };
  await f.sessions.save('alice', id, items, call);
  expect(await read()).toBe(false);
  await h.services.conversations.markRead('alice', id);
  await f.sessions.save('alice', id, items, call);
  expect(await read()).toBe(true);
  await f.sessions.finish('alice', id);
  await accept('input-three');
  await f.sessions.save(
    'alice',
    id,
    [
      {
        id: 'hidden-output',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 't',
              toolName: 'fixture',
              input: {},
            },
          ],
        },
      },
    ],
    call,
  );
  expect(await read()).toBe(true);
  await f.sessions.finish('alice', id);
});

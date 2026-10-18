import { measureUIReadCost } from './ui-read-cost.js';
import { createServer, connect, type Socket } from 'node:net';
import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import {
  OnlineAgentUIStreams,
  type OnlineAgentRecoveryConfig,
} from '../server/online-agent/ui-streams.js';
import { appendFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { Hono, type MiddlewareHandler } from 'hono';
import { z } from 'zod';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { createHarness, type Harness } from './harness.js';
import { OnlineAgentService } from '../server/online-agent/service.js';
import { createSessionManager } from '../server/online-agent/sessions.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { createChatRoutes } from '../server/routes/chat.js';
import { ProtocolError } from '../server/kernel/errors.js';
import { jsonSafe } from '../server/online-agent/codec.js';
import type { AdminEnv } from '../server/routes/admin.js';
import type { OnlineAgentContext } from '../server/online-agent/config.js';
import type { AppUIMessage } from '../shared/online-agent.js';

const ref = { modelService: 'fixture', model: 'chat' };
const actor = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { fixture: id },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const finish = (reason = 'stop') => ({
  type: 'finish',
  usage,
  finishReason: { unified: reason, raw: reason },
});
const text = (value = 'Done') => [
  { type: 'text-start', id: 'text' },
  { type: 'text-delta', id: 'text', delta: value },
  { type: 'text-end', id: 'text' },
  finish(),
];
const chunks = (items: unknown[]) =>
  new ReadableStream({
    start(controller) {
      for (const item of items) controller.enqueue(item);
      controller.close();
    },
  });
let h: Harness;
let services: OnlineAgentService[] = [];
afterEach(async () => {
  for (const service of services) await service.shutdown();
  services = [];
  await h?.close();
});

async function fixture(
  tool = false,
  needsApproval = false,
  toolCount = 1,
  recovery?: OnlineAgentRecoveryConfig,
) {
  h = await createHarness();
  let counter = 0,
    step = 0;
  const prompts: unknown[] = [];
  const measurements: { phase: string; durationMs: number }[] = [];
  const execute = vi.fn(
    async (_input: { value: string }, _options: { signal?: AbortSignal }) => ({
      display: 'Allowed',
      secret: 'model-only-value',
    }),
  );
  const model = new MockLanguageModelV4({
    doStream: async (options) => {
      prompts.push(options.prompt);
      return {
        stream: chunks(
          tool && step++ === 0
            ? [
                ...Array.from({ length: toolCount }, (_, index) => ({
                  type: 'tool-call',
                  toolCallId: `actual-call-${index}`,
                  toolName: 'business',
                  input: JSON.stringify({ value: `requested-${index}` }),
                })),
                finish('tool-calls'),
              ]
            : text(),
        ),
      };
    },
  });
  const attachments = createChatAttachments({
    tx: h.services.tx,
    basePath: () => '',
    storage: {
      store: async () => {
        throw new Error('Use a registered upload.');
      },
      bytes: async () => new Uint8Array(),
      stream: async () => new ReadableStream(),
      remove: async () => {},
    },
  });
  const ids = { next: () => `native-${++counter}` };
  const sessions = createSessionManager({
    tx: h.services.tx,
    ids,
    attachments: attachments.links,
    files: h.services.chatAttachments,
    measure: (phase, durationMs) => measurements.push({ phase, durationMs }),
    now: () => new Date().toISOString(),
  });
  const create = () => {
    const service = new OnlineAgentService({
      sessions,
      uiStreams: new OnlineAgentUIStreams({
        tx: h.services.tx,
        recovery,
        measure: (phase, durationMs) =>
          measurements.push({ phase, durationMs }),
        onError: () => {},
      }),
      ids,
      model: async () => model,
      defaultModel: async () => ref,
      onError: () => {},
    });
    service.configurer.registerTool('business', {
      version: '1',
      definition: {
        inputSchema: z.object({ value: z.string() }),
        needsApproval,
        public: {
          input: (value) => jsonSafe(value),
          output: (value) => ({ display: value.display }),
        },
        execute,
      },
    });
    services.push(service);
    return service;
  };
  const service = create();
  vi.spyOn(h.services.onlineAgent, 'isActive').mockImplementation((id) =>
    services.some((service) => service.isActive(id)),
  );
  const guard: MiddlewareHandler<AdminEnv> = async (c, next) => {
    const user = c.req.header('x-user');
    if (!user) throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
    c.set('caller', {
      userId: user,
      can: async () => false,
      opens: async () => true,
      scope: async () => 'none',
      onlineContext: actor(user),
    });
    await next();
  };
  const appFor = (service: OnlineAgentService) =>
    new Hono().route(
      '/agents',
      createChatRoutes({ ...h.services, onlineAgent: service }, guard),
    );
  let app = appFor(service);
  const request = (
    path: string,
    method = 'GET',
    body?: unknown,
    user = 'alice',
  ) =>
    app.request(`/agents${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'x-user': user },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const agent = await service.realtime(actor(), {
    tool: tool ? ['business'] : [],
  });
  const base = `/conversations/${agent.sessionId}`;
  const chatFor = (initial: AppUIMessage[] = [], approval?: unknown) =>
    new Chat<AppUIMessage>({
      id: agent.sessionId,
      messages: initial,
      transport: new DefaultChatTransport<AppUIMessage>({
        api: `http://fixture/agents${base}/messages`,
        headers: { 'x-user': 'alice' },
        fetch: async (input, init) => app.request(new Request(input, init)),
        prepareReconnectToStreamRequest: () => ({
          api: `http://fixture/agents${base}/events`,
        }),
        prepareSendMessagesRequest: ({ messages }) => ({
          api: `http://fixture/agents${base}/${approval ? 'approval' : 'messages'}`,
          body: approval ?? { message: messages.at(-1) },
        }),
      }),
    });
  return {
    service,
    sessions,
    agent,
    base,
    model,
    prompts,
    measurements,
    execute,
    request,
    chatFor,
    reopen: () => {
      const next = create();
      app = appFor(next);
      return next;
    },
  };
}

describe('native SDK transport, persistence and approval', () => {
  it('is consumed by the real SDK Chat and saves the same message and metadata', async () => {
    const f = await fixture();
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Hello' });
    expect(chat.error).toBeUndefined();
    const history = (await (await f.request(`${f.base}/messages`)).json()).data;
    expect(history.at(-1)).toEqual(jsonSafe(chat.messages.at(-1)));
    expect(history[0]).toMatchObject(jsonSafe(chat.messages[0]));
    await measureUIReadCost(h, 'native', {
      history: () => f.request(`${f.base}/messages`),
      forward: () => f.request(`${f.base}/messages?after=2`),
      revision: () =>
        f.request(`${f.base}/messages?ids=${String(history[1].id)}`),
      detail: () => f.request(f.base),
    });

    expect(history[1]).toMatchObject({
      role: 'assistant',
      metadata: { revision: 1, seq: 2 },
    });
    expect(history[1].parts).toEqual(
      expect.arrayContaining([
        { type: 'text', text: 'Done', state: 'done' },
        {
          type: 'data-notice',
          id: 'execution-status',
          data: { type: 'completed', title: 'Completed' },
        },
      ]),
    );
    const record = await h.services.tx
      .read()
      .repository('agConversationMessages')
      .findOne({ filter: { id: history[1].id } });
    expect(record.content.original).toEqual(history[1]);
    expect(record.id).toBe(record.content.original.id);
    expect(record.content.original.version).toBeUndefined();
    expect(
      (await f.request(`${f.base}/messages?ids=${history[1].id}`)).status,
    ).toBe(200);
    expect(
      (await f.request(`${f.base}/messages`, 'GET', undefined, 'bob')).status,
    ).toBe(404);
  });

  it('preserves multiple current user text parts through the public SDK transport', async () => {
    const f = await fixture();
    const chat = f.chatFor();
    const parts = [
      { type: 'text' as const, text: 'First' },
      { type: 'text' as const, text: 'Second' },
    ];
    await chat.sendMessage({ parts });
    expect(chat.error).toBeUndefined();
    expect(((await f.agent.history()) as AppUIMessage[])[0]!.parts).toEqual(
      parts,
    );
  });

  it('retains private reasoning evidence for trusted SDK conversion without publishing it', async () => {
    const f = await fixture();
    vi.spyOn(f.model, 'doStream').mockResolvedValueOnce({
      stream: chunks([
        { type: 'reasoning-start', id: 'private-thought' },
        {
          type: 'reasoning-delta',
          id: 'private-thought',
          delta: 'Private execution thought',
          providerMetadata: { fixture: { signature: 'private-signature' } },
        },
        { type: 'reasoning-end', id: 'private-thought' },
        ...text(),
      ]),
    });
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Think' });
    expect(chat.error).toBeUndefined();
    expect(JSON.stringify(chat.messages)).not.toContain(
      'Private execution thought',
    );
    expect(JSON.stringify(await f.agent.history())).not.toContain(
      'private-signature',
    );
    const trusted = await f.sessions.native.executionHistory(
      'alice',
      f.agent.sessionId,
      undefined,
      false,
    );
    expect(JSON.stringify(trusted.model)).toContain(
      'Private execution thought',
    );
    expect(JSON.stringify(trusted.model)).toContain('private-signature');
  });

  it('keeps invalid SDK tool inputs private and finishes without invoking a typed public formatter', async () => {
    const f = await fixture(true);
    const input = vi.fn((value: unknown) => ({
      value: (value as { value: string }).value.toUpperCase(),
    }));
    vi.spyOn(f.service.configurer, 'publicProjection').mockReturnValue({
      input,
      output: () => ({}),
    });
    vi.spyOn(f.model, 'doStream')
      .mockResolvedValueOnce({
        stream: chunks([
          {
            type: 'tool-call',
            toolCallId: 'invalid-input',
            toolName: 'business',
            input: '{"value":123}',
          },
          finish('tool-calls'),
        ]),
      })
      .mockResolvedValueOnce({ stream: chunks(text()) });
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Invalid tool input' });
    expect(chat.error).toBeUndefined();
    expect(input).not.toHaveBeenCalled();
    expect(f.execute).not.toHaveBeenCalled();
    expect(await f.agent.status()).toBe('idle');
    expect(
      ((await f.agent.history()) as AppUIMessage[])
        .at(-1)!
        .parts.some(isToolUIPart),
    ).toBe(false);
    expect(
      JSON.stringify(
        await f.sessions.native.executionHistory(
          'alice',
          f.agent.sessionId,
          undefined,
          false,
        ),
      ),
    ).toContain('invalid-input');
  });

  it('restores a persisted approval, continues the same ID, and never repeats an approved effect', async () => {
    const f = await fixture(true, true);
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Act' });
    expect(chat.error).toBeUndefined();
    expect(f.execute).not.toHaveBeenCalled();
    const waiting = chat.messages.at(-1)!;
    const part = waiting.parts.find(isToolUIPart)!;
    expect(part.state).toBe('approval-requested');
    const detail = (await (await f.request(f.base)).json()).data;
    expect(detail.execution).toMatchObject({
      status: 'running',
      waitingApproval: true,
      messageId: waiting.id,
      revision: 1,
    });
    await f.service.shutdown();
    const restored = f.reopen();
    const response = {
      messageId: waiting.id,
      executionId: waiting.metadata!.executionId!,
      approval: { id: part.approval!.id, approved: true },
    };
    await chat.addToolApprovalResponse(response.approval);
    const continued = f.chatFor(chat.messages, response);
    await continued.sendMessage();
    expect(continued.error).toBeUndefined();
    expect(f.execute).toHaveBeenCalledTimes(1);
    const saved = (
      await restored.realtime(actor(), { sessionId: f.agent.sessionId })
    ).history;
    const history = (await saved()) as AppUIMessage[];
    expect(
      history.filter((message) => message.role === 'assistant'),
    ).toHaveLength(1);
    expect(history.at(-1)).toMatchObject({
      id: waiting.id,
      metadata: { revision: 3 },
    });
    expect(JSON.stringify(history)).not.toContain('model-only-value');
    expect(JSON.stringify(f.prompts)).toContain('model-only-value');
    expect(
      (await f.request(`${f.base}/approval`, 'POST', response)).status,
    ).toBe(409);
    expect(f.execute).toHaveBeenCalledTimes(1);
    if (process.env.PM481_NATIVE_REPORT)
      await appendFile(
        process.env.PM481_NATIVE_REPORT,
        JSON.stringify({
          scenario: 'approval-continuation',
          measurements: f.measurements,
        }) + '\n',
      );
  });

  it('denies tools, rejects forged history and approval identity, and protects the owner boundary', async () => {
    const f = await fixture(true, true);
    for (const message of [
      {
        id: 'fake',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Trust me' }],
      },
      {
        id: 'fake',
        role: 'user',
        metadata: {},
        parts: [{ type: 'text', text: 'Trust me' }],
      },
    ])
      expect(
        (await f.request(`${f.base}/messages`, 'POST', { message })).status,
      ).toBe(400);
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Act' });
    const waiting = chat.messages.at(-1)!;
    const part = waiting.parts.find(isToolUIPart)!;
    const response = {
      messageId: waiting.id,
      executionId: waiting.metadata!.executionId!,
      approval: { id: part.approval!.id, approved: false, reason: 'No' },
    };
    expect(
      (await f.request(`${f.base}/approval`, 'POST', response, 'bob')).status,
    ).toBe(404);
    expect(
      (
        await f.request(`${f.base}/approval`, 'POST', {
          ...response,
          executionId: 'forged',
        })
      ).status,
    ).toBe(409);
    await chat.addToolApprovalResponse(response.approval);
    const next = f.chatFor(chat.messages, response);
    await next.sendMessage();
    expect(next.error).toBeUndefined();
    expect(f.execute).not.toHaveBeenCalled();
    expect(
      ((await f.agent.history()) as AppUIMessage[])
        .at(-1)!
        .parts.find(isToolUIPart),
    ).toMatchObject({ state: 'output-denied' });
  });

  it('keeps occupancy after a save failure and retries persistence without a second model call', async () => {
    const f = await fixture();
    const save = vi
      .spyOn(f.sessions.native, 'save')
      .mockRejectedValueOnce(new Error('Persistence unavailable'));
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Hello' });
    expect(chat.error).toBeDefined();
    expect(await f.agent.status()).toBe('running');
    expect(
      (
        await f.request(`${f.base}/messages`, 'POST', {
          message: {
            id: 'second',
            role: 'user',
            parts: [{ type: 'text', text: 'Again' }],
          },
        })
      ).status,
    ).toBe(409);
    expect((await f.request(`${f.base}/finalize`, 'POST', {})).status).toBe(
      200,
    );
    expect(await f.agent.status()).toBe('idle');
    expect(save).toHaveBeenCalledTimes(2);
    expect(f.prompts).toHaveLength(1);
    expect(await f.agent.history()).toHaveLength(2);
  });
  it('rejects concurrent, expired and effect-review approval responses without repeated effects', async () => {
    const f = await fixture(true, true);
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Act' });
    const waiting = chat.messages.at(-1)!;
    const part = waiting.parts.find(isToolUIPart)!;
    const input = {
      messageId: waiting.id,
      executionId: waiting.metadata!.executionId!,
      approval: { id: part.approval!.id, approved: true },
    };
    const other = f.reopen();
    const duplicate = await Promise.allSettled([
      f.agent.approve!(input),
      (await other.realtime(actor(), { sessionId: f.agent.sessionId }))
        .approve!(input),
    ]);
    expect(
      duplicate.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      duplicate.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    await vi.waitFor(() =>
      expect(
        services.every((service) => !service.isActive(f.agent.sessionId)),
      ).toBe(true),
    );
    expect(f.execute).toHaveBeenCalledTimes(1);
    expect((await f.request(`${f.base}/approval`, 'POST', input)).status).toBe(
      409,
    );
  });

  it.each(['expired', 'effect-review'])(
    'protects pending approvals with the %s gate',
    async (gate) => {
      const f = await fixture(true, true);
      const chat = f.chatFor();
      await chat.sendMessage({ text: 'Act' });
      const waiting = chat.messages.at(-1)!;
      const part = waiting.parts.find(isToolUIPart)!;
      const repo = h.services.tx.read().repository('agConversations');
      const row = await repo.findOne({ filter: { id: f.agent.sessionId } });
      const call = row.metadata.onlineAgent.call;
      if (gate === 'expired')
        call.approvalExpiresAt = '2000-01-01T00:00:00.000Z';
      else call.requiresEffectReview = true;
      await repo.updateMany({
        filter: { id: row.id },
        values: { metadata: row.metadata },
      });
      expect(
        (
          await f.request(`${f.base}/approval`, 'POST', {
            messageId: waiting.id,
            executionId: waiting.metadata!.executionId!,
            approval: { id: part.approval!.id, approved: true },
          })
        ).status,
      ).toBe(409);
      expect(f.execute).not.toHaveBeenCalled();
      expect(
        (await f.sessions.load('alice', row.id)).call?.requiresEffectReview,
      ).toBe(gate === 'effect-review' ? true : undefined);
    },
  );

  it('keeps producing after browser disconnect and confirms Stop only after the business tool ends', async () => {
    const f = await fixture(true);
    let release!: () => void;
    const done = new Promise<void>((resolve) => {
      release = resolve;
    });
    f.execute.mockImplementationOnce(async () => {
      await done;
      return { display: 'Finished effect', secret: 'model-only-value' };
    });
    const response = await f.request(`${f.base}/messages`, 'POST', {
      message: {
        id: 'disconnect',
        role: 'user',
        parts: [{ type: 'text', text: 'Act' }],
      },
    });
    const reader = response.body!.getReader();
    await reader.read();
    await reader.cancel();
    await vi.waitFor(() => expect(f.execute).toHaveBeenCalledOnce());
    expect(await f.agent.status()).toBe('running');
    let stopped = false;
    const stop = f.request(`${f.base}/stop`, 'POST').then((response) => {
      stopped = true;
      return response;
    });
    try {
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(stopped).toBe(false);
      expect(await f.agent.status()).toBe('running');
    } finally {
      release();
    }
    expect((await stop).status).toBe(200);
    expect(await f.agent.status()).toBe('idle');
    const history = (await f.agent.history()) as AppUIMessage[];
    expect(history).toHaveLength(2);
    expect(JSON.stringify(history)).not.toContain('model-only-value');
    expect(history[1]!.parts).toContainEqual({
      type: 'data-notice',
      id: 'execution-status',
      data: { type: 'cancelled', title: 'Stopped' },
    });
  });

  it('saves after disconnect without issuing Stop and refuses to confirm a lost producer as idle', async () => {
    const f = await fixture(true);
    let release!: () => void;
    const done = new Promise<void>((resolve) => {
      release = resolve;
    });
    f.execute.mockImplementationOnce(async () => {
      await done;
      return { display: 'Allowed', secret: 'model-only-value' };
    });
    const response = await f.request(`${f.base}/messages`, 'POST', {
      message: {
        id: 'detach',
        role: 'user',
        parts: [{ type: 'text', text: 'Act' }],
      },
    });
    await response.body!.cancel();
    await vi.waitFor(() => expect(f.execute).toHaveBeenCalledOnce());
    release();
    await vi.waitFor(async () => expect(await f.agent.status()).toBe('idle'));
    expect(await f.agent.history()).toHaveLength(2);
    expect(f.prompts).toHaveLength(2);
    const repo = h.services.tx.read().repository('agConversations');
    const row = await repo.findOne({ filter: { id: f.agent.sessionId } });
    row.metadata.onlineAgent.call.state = 'running';
    await repo.updateMany({
      filter: { id: row.id },
      values: { metadata: row.metadata },
    });
    const detail = (await (await f.request(f.base)).json()).data;
    expect(detail.execution).toMatchObject({
      status: 'running',
      interrupted: true,
    });
    expect((await f.request(`${f.base}/events`)).status).toBe(204);
    expect((await f.request(`${f.base}/stop`, 'POST')).status).toBe(409);
    expect(f.prompts).toHaveLength(2);
  });

  it('stops persisted approval without executing and exposes the revised message by ID', async () => {
    const f = await fixture(true, true);
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Act' });
    const waiting = chat.messages.at(-1)!;
    expect((await f.request(`${f.base}/stop`, 'POST')).status).toBe(200);
    const reread = (
      await (await f.request(`${f.base}/messages?ids=${waiting.id}`)).json()
    ).data;
    expect(reread).toHaveLength(1);
    expect(reread[0]).toMatchObject({
      id: waiting.id,
      metadata: { revision: 2, seq: 2 },
    });
    expect(reread[0].parts.find(isToolUIPart)).toMatchObject({
      state: 'output-denied',
    });
    expect(f.execute).not.toHaveBeenCalled();
  });
  it('binds file-only input atomically and reauthorizes files before each model turn', async () => {
    const f = await fixture();
    const own = await h.services.chatAttachments.upload(
      'alice',
      new File(['Owned content'], 'owned.txt', { type: 'text/plain' }),
    );
    const foreign = await h.services.chatAttachments.upload(
      'bob',
      new File(['Private content'], 'foreign.txt', { type: 'text/plain' }),
    );
    const body = {
      message: { id: 'file-message', role: 'user', parts: [] },
      attachmentIds: [own.id, foreign.id],
    };
    expect((await f.request(`${f.base}/messages`, 'POST', body)).status).toBe(
      400,
    );
    expect(await f.agent.history()).toHaveLength(0);
    expect(f.prompts).toHaveLength(0);
    const accepted = await f.request(`${f.base}/messages`, 'POST', {
      ...body,
      attachmentIds: [own.id],
    });
    expect(accepted.status).toBe(200);
    await accepted.text();
    await vi.waitFor(async () => expect(await f.agent.status()).toBe('idle'));
    const history = (await f.agent.history()) as AppUIMessage[];
    expect(history[0]).toMatchObject({
      id: 'file-message',
      parts: [{ type: 'file', filename: 'owned.txt' }],
    });
    expect(JSON.stringify(f.prompts)).not.toContain('Private content');
    const read = vi
      .spyOn(h.services.chatAttachments, 'content')
      .mockRejectedValueOnce(
        new ProtocolError('NOT_FOUND', 'Attachment not found.'),
      );
    const refused = await f.request(`${f.base}/messages`, 'POST', {
      message: {
        id: 'next',
        role: 'user',
        parts: [{ type: 'text', text: 'Continue' }],
      },
    });
    expect(refused.status).toBe(404);
    expect(read).toHaveBeenCalledWith({ userId: 'alice' }, own.id);
    expect(f.prompts).toHaveLength(1);
    expect(await f.agent.history()).toHaveLength(2);
  });
  it('does not overwrite a configuration changed by another service during admission', async () => {
    const f = await fixture();
    const original = await f.sessions.load('alice', f.agent.sessionId);
    const changed = { ...original.config, thinking: 'high' };
    await f.sessions.configure('alice', f.agent.sessionId, changed, ref);
    await expect(
      f.sessions.native.accept(
        'alice',
        f.agent.sessionId,
        {
          id: 'stale',
          parts: [{ type: 'text', text: 'Hello' }],
          attachments: [],
        },
        original.config,
        ref,
        'execution',
        'assistant',
        original,
      ),
    ).rejects.toThrow('configuration has changed');
    expect(await f.agent.history()).toHaveLength(0);
    expect(
      (await f.sessions.load('alice', f.agent.sessionId)).config.thinking,
    ).toBe('high');
    expect(f.prompts).toHaveLength(0);
  });
  it('retains earlier approved effects if a later continuation fails before model execution', async () => {
    const f = await fixture(true, true, 2);
    const chat = f.chatFor();
    await chat.sendMessage({ text: 'Act twice' });
    const waiting = chat.messages.at(-1)!;
    const parts = waiting.parts.filter(isToolUIPart);
    expect(parts).toHaveLength(2);
    const respond = async (current: Chat<AppUIMessage>, index: number) => {
      const part = current.messages.at(-1)!.parts.filter(isToolUIPart)[index]!;
      const input = {
        messageId: waiting.id,
        executionId: waiting.metadata!.executionId!,
        approval: { id: part.approval!.id, approved: true },
      };
      await current.addToolApprovalResponse(input.approval);
      const next = f.chatFor(current.messages, input);
      await next.sendMessage();
      return next;
    };
    const first = await respond(chat, 0);
    expect(first.error).toBeUndefined();
    expect(f.execute).toHaveBeenCalledTimes(1);
    expect(first.messages.at(-1)!.parts.filter(isToolUIPart)[1]).toMatchObject({
      state: 'approval-requested',
    });
    const read = vi
      .spyOn(f.sessions.native, 'executionHistory')
      .mockRejectedValueOnce(new Error('Temporary context failure'));
    await respond(first, 1);
    expect(f.execute).toHaveBeenCalledTimes(1);
    read.mockRestore();
    const trusted = await f.sessions.native.executionHistory(
      'alice',
      f.agent.sessionId,
      undefined,
      false,
    );
    expect(JSON.stringify(trusted.model)).toContain('model-only-value');
    expect(JSON.stringify(trusted.model)).toContain('actual-call-0');
    expect(JSON.stringify(trusted.model)).not.toContain('actual-call-1');
    expect(((await f.agent.history()) as AppUIMessage[]).at(-1)).toMatchObject({
      id: waiting.id,
      metadata: { revision: 5 },
    });
  });
});

describe('independent native business notifications', () => {
  it('persists after finish, rereads by ID, deduplicates and keeps business data out of model input', async () => {
    const f = await fixture();
    await f.chatFor().sendMessage({ text: 'First' });
    const input = {
      id: 'independent-notice',
      parts: [
        {
          type: 'data-notice' as const,
          id: 'notice-part',
          data: { type: 'fixture', title: 'Independent notice' },
        },
        {
          type: 'data-business' as const,
          id: 'business-part',
          data: {
            kind: 'fixture',
            id: 'record-1',
            payload: { privateToModel: 'Only public display' },
          },
        },
      ],
    };
    const saved = await f.service.notify(actor(), f.agent.sessionId, input);
    expect(await f.service.notify(actor(), f.agent.sessionId, input)).toEqual(
      saved,
    );
    await expect(
      f.service.notify(actor('bob'), f.agent.sessionId, input),
    ).rejects.toThrow('not found');
    await expect(
      f.service.notify(actor(), f.agent.sessionId, {
        ...input,
        parts: [{ type: 'text', text: 'Forged' }],
      }),
    ).rejects.toThrow();
    const page = await (
      await f.request(`${f.base}/messages?ids=independent-notice`)
    ).json();
    expect(page.data).toEqual([saved]);
    expect(await f.agent.receive()).toBeNull();
    await f.chatFor(await f.agent.history()).sendMessage({ text: 'Next' });
    expect(JSON.stringify(f.prompts.at(-1))).not.toContain(
      'Only public display',
    );
    expect(
      (await f.agent.history()).filter((message) => message.id === input.id),
    ).toHaveLength(1);
  });
});

const redisConfig = (): OnlineAgentRecoveryConfig => ({
  namespace: `pm481:${randomUUID()}`,
  redis: { host: '127.0.0.1', port: Number(process.env.PM481_REDIS_PORT) },
});
describe.skipIf(!process.env.PM481_REDIS_PORT)(
  'native shared recovery with real Redis and independent services',
  () => {
    it('replays prior chunks through SDK Chat on instance B and receives later chunks without another execution', async () => {
      const recovery = redisConfig();
      const f = await fixture(false, false, 1, recovery);
      let output!: ReadableStreamDefaultController<unknown>;
      const run = vi.fn(async (options: { abortSignal?: AbortSignal }) => ({
        stream: new ReadableStream({
          start(controller) {
            output = controller;
            options.abortSignal?.addEventListener(
              'abort',
              () => controller.close(),
              { once: true },
            );
            controller.enqueue({ type: 'text-start', id: 'part' });
            controller.enqueue({
              type: 'text-delta',
              id: 'part',
              delta: 'Before',
            });
          },
        }),
      }));
      f.model.doStream = run;
      const response = await f.request(`${f.base}/messages`, 'POST', {
        message: {
          id: 'shared-input',
          role: 'user',
          parts: [{ type: 'text', text: 'One execution' }],
        },
      });
      expect(response.status).toBe(200);
      await response.body!.cancel();
      const other = f.reopen();
      const chat = f.chatFor(await f.agent.history());
      const resuming = chat.resumeStream();
      await vi.waitFor(() =>
        expect(chat.messages.at(-1)?.parts).toContainEqual({
          type: 'text',
          text: 'Before',
          state: 'streaming',
        }),
      );
      expect(
        (await f.request(`${f.base}/events`, 'GET', undefined, 'bob')).status,
      ).toBe(404);
      expect(
        await (
          await other.realtime(actor(), { sessionId: f.agent.sessionId })
        ).status(),
      ).toBe('running');
      output.enqueue({ type: 'text-delta', id: 'part', delta: 'After' });
      output.enqueue({ type: 'text-end', id: 'part' });
      output.enqueue(finish());
      output.close();
      await resuming;
      expect(chat.error).toBeUndefined();
      expect(chat.messages.at(-1)).toEqual((await f.agent.history()).at(-1));
      expect(chat.messages.at(-1)?.parts).toContainEqual({
        type: 'text',
        text: 'BeforeAfter',
        state: 'done',
      });
      expect(run).toHaveBeenCalledTimes(1);
      if (process.env.PM481_C_REPORT)
        await appendFile(
          process.env.PM481_C_REPORT,
          JSON.stringify({
            kind: 'native-recovery',
            measurements: f.measurements,
          }) + '\n',
        );
      expect((await f.request(`${f.base}/events`)).status).toBe(204);
      const row = await h.services.tx
        .read()
        .repository('agConversations')
        .findOne({ filter: { id: f.agent.sessionId } });
      expect(row?.metadata).not.toHaveProperty('onlineUIStream');
    });
    it('saves accepted output when its Redis connection fails, with no retry of model or input', async () => {
      const sockets = new Set<Socket>();
      const proxy = createServer((socket) => {
        const upstream = connect({
          host: '127.0.0.1',
          port: Number(process.env.PM481_REDIS_PORT),
        });
        sockets.add(socket);
        sockets.add(upstream);
        socket.on('error', () => upstream.destroy());
        upstream.on('error', () => socket.destroy());
        socket.pipe(upstream).pipe(socket);
      });
      await new Promise<void>((resolve) =>
        proxy.listen(0, '127.0.0.1', resolve),
      );
      const address = proxy.address();
      if (!address || typeof address === 'string')
        throw new Error('TCP fixture did not listen.');
      const recovery = {
        ...redisConfig(),
        redis: { host: '127.0.0.1', port: address.port },
      };
      const f = await fixture(false, false, 1, recovery);
      let output!: ReadableStreamDefaultController<unknown>;
      const run = vi.fn(async (options: { abortSignal?: AbortSignal }) => ({
        stream: new ReadableStream({
          start(controller) {
            output = controller;
            options.abortSignal?.addEventListener(
              'abort',
              () => controller.close(),
              { once: true },
            );
          },
        }),
      }));
      f.model.doStream = run;
      try {
        const response = await f.request(`${f.base}/messages`, 'POST', {
          message: {
            id: 'outage-input',
            role: 'user',
            parts: [{ type: 'text', text: 'Accepted once' }],
          },
        });
        expect(response.status).toBe(200);
        await response.body!.cancel();
        for (const socket of sockets) socket.destroy();
        await new Promise<void>((resolve) => proxy.close(() => resolve()));
        output.enqueue({ type: 'text-start', id: 'late' });
        output.enqueue({
          type: 'text-delta',
          id: 'late',
          delta: 'Saved after outage',
        });
        output.enqueue({ type: 'text-end', id: 'late' });
        output.enqueue(finish());
        output.close();
        await vi.waitFor(() =>
          expect(f.service.isActive(f.agent.sessionId)).toBe(false),
        );
        expect((await f.agent.history()).at(-1)?.parts).toContainEqual({
          type: 'text',
          text: 'Saved after outage',
          state: 'done',
        });
        expect(run).toHaveBeenCalledTimes(1);
        expect(await f.agent.history()).toHaveLength(2);
      } finally {
        for (const socket of sockets) socket.destroy();
        if (proxy.listening)
          await new Promise<void>((resolve) => proxy.close(() => resolve()));
      }
    });
    it('routes an independently authorized Stop from instance B to the live native producer', async () => {
      const f = await fixture(false, false, 1, redisConfig());
      let stopped = false;
      f.model.doStream = async (options) => ({
        stream: new ReadableStream({
          start(controller) {
            options.abortSignal?.addEventListener(
              'abort',
              () => {
                stopped = true;
                controller.close();
              },
              { once: true },
            );
          },
        }),
      });
      const response = await f.request(`${f.base}/messages`, 'POST', {
        message: {
          id: 'stop-input',
          role: 'user',
          parts: [{ type: 'text', text: 'Stop across instances' }],
        },
      });
      await response.body!.cancel();
      const other = f.reopen();
      expect(
        (await f.request(`${f.base}/stop`, 'POST', undefined, 'bob')).status,
      ).toBe(404);
      const remote = await other.realtime(actor(), {
        sessionId: f.agent.sessionId,
      });
      await remote.abort();
      await vi.waitFor(() =>
        expect(f.service.isActive(f.agent.sessionId)).toBe(false),
      );
      expect(stopped).toBe(true);
      expect(await remote.status()).toBe('idle');
      expect((await f.agent.history()).at(-1)?.parts).toContainEqual(
        expect.objectContaining({
          type: 'data-notice',
          data: expect.objectContaining({ type: 'cancelled' }),
        }),
      );
    });
    it('clears each approval response association before the next SDK approval continuation', async () => {
      const f = await fixture(true, true, 1, redisConfig());
      const chat = f.chatFor();
      await chat.sendMessage({ text: 'Approve remotely' });
      const waiting = chat.messages.at(-1)!;
      const part = waiting.parts.find(isToolUIPart)!;
      const other = f.reopen();
      const remote = await other.realtime(actor(), {
        sessionId: f.agent.sessionId,
      });
      expect(await remote.status()).toBe('running');
      expect((await f.request(`${f.base}/events`)).status).toBe(204);
      const input = {
        messageId: waiting.id,
        executionId: waiting.metadata!.executionId!,
        approval: { id: part.approval!.id, approved: true },
      };
      const continued = f.chatFor(await remote.history(), input);
      await continued.sendMessage();
      expect(continued.error).toBeUndefined();
      expect(f.execute).toHaveBeenCalledTimes(1);
      expect((await remote.history()).at(-1)?.metadata?.revision).toBe(3);
    });
    it('ends an already resumed subscription when its producer lease is lost without ending business execution', async () => {
      const recovery = redisConfig();
      const f = await fixture(false, false, 1, recovery);
      f.model.doStream = async (options) => ({
        stream: new ReadableStream({
          start(controller) {
            options.abortSignal?.addEventListener(
              'abort',
              () => controller.close(),
              { once: true },
            );
          },
        }),
      });
      const response = await f.request(`${f.base}/messages`, 'POST', {
        message: {
          id: 'live-loss-input',
          role: 'user',
          parts: [{ type: 'text', text: 'Keep business occupied' }],
        },
      });
      await response.body!.cancel();
      f.reopen();
      const resumed = await f.request(`${f.base}/events`);
      expect(resumed.status).toBe(200);
      const chat = new Chat<AppUIMessage>({
        id: f.agent.sessionId,
        messages: await f.agent.history(),
        transport: new DefaultChatTransport<AppUIMessage>({
          api: 'http://fixture/events',
          fetch: async () => resumed,
        }),
      });
      const reading = chat.resumeStream();
      const client = new Redis(recovery.redis);
      try {
        await client.del(`${recovery.namespace}:producer:${f.agent.sessionId}`);
      } finally {
        client.disconnect();
      }
      await reading;
      expect(chat.error?.message).toMatch(/interrupted|lost/);
      expect(await f.agent.status()).toBe('running');
      await f.agent.abort();
      expect(await f.agent.status()).toBe('idle');
    });
    it('acknowledges a commit-unknown approval after another instance advanced its trusted revision without overwriting it', async () => {
      const f = await fixture(true, true, 1, redisConfig());
      const persist = f.sessions.native.save.bind(f.sessions.native);
      vi.spyOn(f.sessions.native, 'save').mockImplementationOnce(
        async (...args) => {
          await persist(...args);
          throw new Error('Commit acknowledgment lost');
        },
      );
      const first = f.chatFor();
      await first.sendMessage({ text: 'Commit once' });
      expect(first.error).toBeDefined();
      expect(f.service.isActive(f.agent.sessionId)).toBe(true);
      const waiting = (await f.agent.history()).at(-1)!;
      const part = waiting.parts.find(isToolUIPart)!;
      const other = f.reopen();
      const continued = f.chatFor(await f.agent.history(), {
        messageId: waiting.id,
        executionId: waiting.metadata!.executionId!,
        approval: { id: part.approval!.id, approved: true },
      });
      await continued.sendMessage();
      expect(continued.error).toBeUndefined();
      const current = await f.agent.history();
      expect(current.at(-1)?.metadata?.revision).toBe(3);
      await f.agent.retryFinalization();
      expect(f.service.isActive(f.agent.sessionId)).toBe(false);
      expect(await f.agent.history()).toEqual(current);
      expect(f.execute).toHaveBeenCalledTimes(1);
      expect(f.model.doStreamCalls).toHaveLength(2);
      expect(
        await (
          await other.realtime(actor(), { sessionId: f.agent.sessionId })
        ).status(),
      ).toBe('idle');
    });
    it('rejects unavailable configured recovery before admission', async () => {
      const f = await fixture(false, false, 1, {
        ...redisConfig(),
        redis: { host: '127.0.0.1', port: 1 },
      });
      const response = await f.request(`${f.base}/messages`, 'POST', {
        message: {
          id: 'not-accepted',
          role: 'user',
          parts: [{ type: 'text', text: 'No fallback' }],
        },
      });
      expect(response.status).toBe(409);
      expect(await f.agent.history()).toEqual([]);
      expect(f.prompts).toEqual([]);
    });
    it.each(['lease', 'cache'])(
      'reports %s expiry while keeping accepted work and independent Stop',
      async (failure) => {
        const recovery = redisConfig();
        const f = await fixture(false, false, 1, recovery);
        f.model.doStream = async (options) => ({
          stream: new ReadableStream({
            start(controller) {
              options.abortSignal?.addEventListener(
                'abort',
                () => controller.close(),
                { once: true },
              );
            },
          }),
        });
        const response = await f.request(`${f.base}/messages`, 'POST', {
          message: {
            id: 'expiry-input',
            role: 'user',
            parts: [{ type: 'text', text: 'Accepted' }],
          },
        });
        await response.body!.cancel();
        f.reopen();
        const row = await h.services.tx
          .read()
          .repository('agConversations')
          .findOne({ filter: { id: f.agent.sessionId } });
        const streamId = (
          row!.metadata as { onlineUIStream: { streamId: string } }
        ).onlineUIStream.streamId;
        const client = new Redis(recovery.redis);
        try {
          await client.del(
            failure === 'lease'
              ? `${recovery.namespace}:producer:${f.agent.sessionId}`
              : `${recovery.namespace}:rs:sentinel:${streamId}`,
          );
        } finally {
          client.disconnect();
        }
        expect((await f.request(`${f.base}/events`)).status).toBe(409);
        expect(await f.agent.status()).toBe('running');
        await f.agent.abort();
        expect(await f.agent.status()).toBe('idle');
        expect(await f.agent.history()).toHaveLength(2);
      },
    );
  },
);

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

async function fixture(tool = false, needsApproval = false, toolCount = 1) {
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

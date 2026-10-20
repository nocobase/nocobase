import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import type { ModelMessage } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { createHarness, type Harness } from './harness.js';
import { OnlineAgentService } from '../server/online/agent/service.js';
import { NativeOnlineAgentBackend } from '../server/online/agent/native/backend.js';
import {
  NativeBackgroundOnlineAgent,
  NativeRealtimeOnlineAgent,
} from '../server/online/agent/native/session.js';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { createSessionManager } from '../server/online/agent/persistence/manager.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import type {
  BackgroundOnlineAgent,
  RealtimeOnlineAgent,
} from '../server/online/agent/contracts.js';

const ref = { modelService: 'fixture', model: 'chat' };
const alternate = { modelService: 'fixture', model: 'alternate' };
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
const text = (value: string) => [
  { type: 'text-start' as const, id: 'text' },
  { type: 'text-delta' as const, id: 'text', delta: value },
  { type: 'text-end' as const, id: 'text' },
  {
    type: 'finish' as const,
    usage,
    finishReason: { unified: 'stop' as const, raw: 'stop' },
  },
];
const stream = <T>(chunks: T[]) =>
  new ReadableStream<T>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });
const model = () =>
  new MockLanguageModelV4({
    doStream: async () => ({ stream: stream(text('"Done"')) }),
  });

let h: Harness | undefined;
const owners: { shutdown(): Promise<void> }[] = [];
afterEach(async () => {
  for (const owner of owners.splice(0).reverse()) await owner.shutdown();
  await h?.close();
  h = undefined;
});

async function fixture(languageModel = model()) {
  h = await createHarness();
  let counter = 0;
  const ids = { next: () => `backend-${++counter}` };
  const attachments = createChatAttachments({
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
    files: h.services.chatAttachments,
    now: () => new Date().toISOString(),
  });
  const configurator = new OnlineAgentConfigurator();
  const errors: unknown[] = [];
  const resolveModel = vi.fn(async () => languageModel);
  const defaultModel = vi.fn(async () => ref);
  const deps = {
    sessions,
    ids,
    configurator,
    model: resolveModel,
    defaultModel,
    onError: (error: unknown) => errors.push(error),
  };
  const service = new OnlineAgentService(deps);
  owners.push(service);
  return {
    h,
    service,
    sessions,
    configurator,
    resolveModel,
    defaultModel,
    errors,
    backend: () => {
      const backend = new NativeOnlineAgentBackend({
        ...deps,
        uiStreams: service.uiStreams,
      });
      owners.push(backend);
      return backend;
    },
  };
}

async function settle(agent: { status(): Promise<'running' | 'idle'> }) {
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
}

async function submit(agent: RealtimeOnlineAgent | BackgroundOnlineAgent) {
  if ('send' in agent) await agent.send(messages);
  else await agent.run(messages, { type: 'string' });
  await settle(agent);
}

describe('Native backend ownership and facade regressions', () => {
  it('returns concrete Native facades on creation and restoration, with no background transport', async () => {
    const f = await fixture();
    const realtime = await f.service.realtime(actor);
    const background = await f.service.background(actor);
    expect(realtime).toBeInstanceOf(NativeRealtimeOnlineAgent);
    expect(background).toBeInstanceOf(NativeBackgroundOnlineAgent);
    expect(
      await f.service.realtime(actor, { sessionId: realtime.sessionId }),
    ).toBeInstanceOf(NativeRealtimeOnlineAgent);
    expect(
      await f.service.background(actor, { sessionId: background.sessionId }),
    ).toBeInstanceOf(NativeBackgroundOnlineAgent);
    for (const member of ['send', 'receive', 'approve', 'messages']) {
      expect(member in background).toBe(false);
    }
  });

  it('owns admission, occupancy, observation and finalization without Service execution helpers', async () => {
    let output!: ReadableStreamDefaultController;
    const f = await fixture(
      new MockLanguageModelV4({
        doStream: async () => ({
          stream: new ReadableStream({
            start(controller) {
              output = controller;
            },
          }),
        }),
      }),
    );
    const backend = f.backend();
    const initial = {
      config: {
        scope: [],
        systemPrompt: '',
        tool: [],
        toolVersions: {},
        model: ['fixture/chat'],
      },
      hasModel: true,
    };
    const job = await backend.createBackground(actor, initial, {});
    await job.run(messages, { type: 'string' });
    await vi.waitFor(() => expect(output).toBeDefined());
    expect(await job.status()).toBe('running');
    expect(await job.try()).toEqual({ ok: false, reason: 'pending' });
    const observed = job.get();
    text('"Backend result"').forEach((chunk) => output.enqueue(chunk));
    output.close();
    expect(await observed).toBe('Backend result');
    await settle(job);
    expect(await job.status()).toBe('idle');
    expect((await f.sessions.load('alice', job.sessionId)).call).toMatchObject({
      state: 'idle',
      outcome: 'completed',
      result: 'Backend result',
    });
    expect(f.errors).toEqual([]);
  });

  it.each(['realtime', 'background'] as const)(
    'resolves defaults and initial Providers once for new Native %s, never on restore',
    async (kind) => {
      const f = await fixture();
      await f.h.database
        .connection()
        .repository('agSettings')
        .createOne({
          values: {
            key: 'chat',
            value: { onlineAgent: { scope: ['system'], model: ref } },
            updatedAt: new Date().toISOString(),
          },
        });
      await f.h.database
        .connection()
        .repository('agChatPreferences')
        .createOne({
          values: {
            userId: 'alice',
            onlineAgent: { scope: ['personal'], model: alternate },
            updatedAt: new Date().toISOString(),
          },
        });
      const system = vi.fn(() => ({ systemPromptTemplate: 'System' }));
      const personal = vi.fn(() => ({ systemPromptTemplate: 'Personal' }));
      const global = vi.fn(() => ({ thinking: 'initial' }));
      f.configurator.registerOnlineAgentScope('system', system);
      f.configurator.registerOnlineAgentScope('personal', personal);
      f.configurator.registerOnlineAgentGlobalScope(global);
      const defaults = vi.spyOn(f.sessions, 'defaults');
      const agent = await f.service[kind](actor);
      expect(await f.sessions.load('alice', agent.sessionId)).toMatchObject({
        config: {
          scope: ['personal'],
          systemPrompt: 'Personal',
          thinking: 'initial',
          model: ['fixture/alternate'],
        },
        model: alternate,
      });
      expect(defaults).toHaveBeenCalledExactlyOnceWith('alice');
      expect(global).toHaveBeenCalledTimes(1);
      expect(personal).toHaveBeenCalledTimes(1);
      expect(system).not.toHaveBeenCalled();
      expect(f.defaultModel).not.toHaveBeenCalled();
      expect(f.resolveModel).toHaveBeenCalledTimes(1);
      await f.h.database
        .connection()
        .repository('agChatPreferences')
        .updateMany({
          filter: { userId: 'alice' },
          values: { onlineAgent: { scope: ['system'], model: ref } },
        });
      const restored = await f.service[kind](actor, {
        sessionId: agent.sessionId,
      });
      await restored.status();
      await restored.history();
      await f.service.configuration(actor, agent.sessionId);
      await submit(restored);
      expect(defaults).toHaveBeenCalledTimes(1);
      expect(global).toHaveBeenCalledTimes(1);
      expect(personal).toHaveBeenCalledTimes(1);
      expect(system).not.toHaveBeenCalled();
      expect((await f.sessions.load('alice', agent.sessionId)).model).toEqual(
        alternate,
      );
    },
  );

  it.each(['realtime', 'background'] as const)(
    'retains rejected pending configuration and applies it to the latest Native %s snapshot only once',
    async (kind) => {
      const f = await fixture();
      const pending = vi.fn(() => ({
        systemPromptTemplate: {
          template: (context: OnlineAgentContext) =>
            `${context.systemPrompt}:pending`,
        },
        thinking: 'pending',
      }));
      f.configurator.registerOnlineAgentScope('pending', pending);
      const original = await f.service[kind](actor, {
        model: ['fixture/chat', 'fixture/alternate'],
      });
      const opened = await f.service[kind](actor, {
        sessionId: original.sessionId,
        scope: ['pending'],
        selectedModel: alternate,
      });
      await f.service.configure(actor, original.sessionId, {
        systemPromptTemplate: 'Latest',
        thinking: 'latest',
      });
      const accepted = vi
        .spyOn(f.sessions.native, 'accept')
        .mockRejectedValueOnce(new Error('Admission rejected'));
      await expect(submit(opened)).rejects.toThrow('Admission rejected');
      expect(await f.sessions.load('alice', original.sessionId)).toMatchObject({
        config: { systemPrompt: 'Latest', thinking: 'latest' },
        model: ref,
        lastSeq: 0,
      });
      expect(await original.status()).toBe('idle');
      await submit(opened);
      expect(await f.sessions.load('alice', original.sessionId)).toMatchObject({
        config: { systemPrompt: 'Latest:pending', thinking: 'pending' },
        model: alternate,
      });
      expect(pending).toHaveBeenCalledTimes(2);
      await f.service.configure(
        actor,
        original.sessionId,
        { systemPromptTemplate: 'Newest', thinking: 'newest' },
        ref,
      );
      await submit(opened);
      expect(await f.sessions.load('alice', original.sessionId)).toMatchObject({
        config: { systemPrompt: 'Newest', thinking: 'newest' },
        model: ref,
      });
      expect(pending).toHaveBeenCalledTimes(2);
      expect(accepted).toHaveBeenCalledTimes(3);
    },
  );

  it.each(['realtime', 'background'] as const)(
    'retains the HTTP boundary and rejected opening overrides on Native %s',
    async (kind) => {
      const f = await fixture();
      const original = await f.service[kind](actor, {
        systemPromptTemplate: 'Trusted',
      });
      const opened = await f.service[kind](
        actor,
        {
          sessionId: original.sessionId,
          systemPromptTemplate: 'Untrusted',
        },
        'http',
      );
      for (let attempt = 0; attempt < 2; attempt++) {
        await expect(submit(opened)).rejects.toThrow(
          'HTTP configuration cannot override',
        );
        expect(await original.status()).toBe('idle');
        expect(
          await f.sessions.load('alice', original.sessionId),
        ).toMatchObject({
          config: { systemPrompt: 'Trusted' },
          lastSeq: 0,
          call: null,
        });
      }
      if ('send' in opened)
        await opened.send(messages, { overrides: { thinking: 'allowed' } });
      else
        await opened.run(
          messages,
          { type: 'string' },
          { overrides: { thinking: 'allowed' } },
        );
      await settle(opened);
      await submit(opened);
      expect(
        (await f.sessions.load('alice', original.sessionId)).config,
      ).toMatchObject({
        systemPrompt: 'Trusted',
        thinking: 'allowed',
      });
    },
  );

  it('preserves the prior accepted Native response when the same facade rejects another send', async () => {
    const f = await fixture();
    const agent = await f.service.realtime(actor);
    await agent.send(messages);
    await settle(agent);
    const accepted = await f.sessions.load('alice', agent.sessionId);
    vi.spyOn(f.sessions.native, 'accept').mockRejectedValueOnce(
      new Error('Admission rejected'),
    );
    await expect(
      agent.send([{ role: 'user', content: 'Rejected' }], {
        overrides: { systemPromptTemplate: 'Must not persist' },
      }),
    ).rejects.toThrow('Admission rejected');
    expect(await f.sessions.load('alice', agent.sessionId)).toEqual(accepted);
    const response = await agent.receive();
    expect(response).not.toBeNull();
    const chunks = [];
    for await (const chunk of response!) chunks.push(chunk);
    expect(chunks).toContainEqual(
      expect.objectContaining({
        type: 'start',
        messageId: accepted.call!.messageId,
      }),
    );
    expect(chunks).toContainEqual(
      expect.objectContaining({ type: 'text-delta', delta: '"Done"' }),
    );
    expect(chunks.at(-1)).toMatchObject({ type: 'finish' });
  });
});

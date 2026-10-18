import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { createHarness, type Harness } from './harness.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { conversationsRepo } from '../server/core/conversations/conversation.store.js';
import {
  OnlineAgentConfigurator,
  type OnlineAgentConfig,
  type OnlineAgentContext,
} from '../server/online-agent/config.js';
import { createSessionManager } from '../server/online-agent/sessions.js';
import { OnlineAgentService } from '../server/online-agent/service.js';
import { RunnerOnlineAgentAdapter } from '../server/online-agent/runner.js';
import { OnlineAgentUIStreams } from '../server/online-agent/ui-streams.js';
import { asJson } from '../server/kernel/values.js';

const model = { modelService: 'fixture', model: 'chat' };
const nativeConfig: OnlineAgentConfig = {
  scope: [],
  systemPrompt: '',
  tool: [],
  toolVersions: {},
  model: ['fixture/chat'],
};
const nativeBinding = {
  version: 1,
  kind: 'realtime',
  config: nativeConfig,
  call: null,
};
const runnerBinding = (agentId: string) => ({
  version: 1,
  config: { ...nativeConfig, agentId, model: [] },
});
const context = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { kind: 'fixture', userId: id },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});

let h: Harness | undefined;
const services: OnlineAgentService[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const service of services.splice(0).reverse()) await service.shutdown();
  await h?.close();
  h = undefined;
});

async function fixture() {
  const harness = await createHarness();
  h = harness;
  await harness.registerRunner();
  const agentId = await harness.createAgent({ source: 'runner' });
  const ids = { next: () => randomUUID() };
  const attachments = createChatAttachments({
    tx: harness.services.tx,
    basePath: () => '',
    storage: {
      store: async () => {
        throw new Error('No uploads in the identity fixture.');
      },
      bytes: async () => new Uint8Array(),
      stream: async () => new ReadableStream(),
      remove: async () => {},
    },
  });
  const sessions = createSessionManager({
    tx: harness.services.tx,
    ids,
    attachments: attachments.links,
    files: harness.services.chatAttachments,
    now: () => harness.clock.now().toISOString(),
  });
  const configurator = new OnlineAgentConfigurator();
  const streams = new OnlineAgentUIStreams({ onError: () => {} });
  const runner = new RunnerOnlineAgentAdapter({
    tx: harness.services.tx,
    conversations: harness.services.conversations,
    configurator,
    streams,
    now: () => harness.clock.now().toISOString(),
    basePath: () => '',
    onError: () => {},
  });
  const resolveModel = vi.fn(async () => new MockLanguageModelV4());
  const deps = {
    sessions,
    ids,
    configurator,
    runner,
    uiStreams: streams,
    model: resolveModel,
    defaultModel: async () => model,
    onError: () => {},
  };
  const service = new OnlineAgentService(deps);
  services.push(service);
  return {
    harness,
    sessions,
    runner,
    streams,
    service,
    resolveModel,
    deps,
    agentId,
    native: (kind: 'realtime' | 'background' = 'realtime') =>
      sessions.create('alice', kind, nativeConfig, model),
    runnerSession: () =>
      runner.createRealtime(
        context(),
        { config: runnerBinding(agentId).config, hasModel: false },
        {},
      ),
  };
}

describe('persisted OnlineAgent backend identity', () => {
  it('distinguishes backend ownership from realtime/background kind without model or configuration probing', async () => {
    const f = await fixture();
    const realtimeId = await f.native();
    const backgroundId = await f.native('background');
    const remote = await f.runnerSession();
    const configuration = vi.spyOn(f.runner, 'configuration');
    const scope = vi.fn(() => ({}));
    f.service.configurator.registerOnlineAgentGlobalScope(scope);
    await expect(f.sessions.identify('alice', realtimeId)).resolves.toEqual({
      backend: 'native',
      kind: 'realtime',
    });
    await expect(f.sessions.identify('alice', backgroundId)).resolves.toEqual({
      backend: 'native',
      kind: 'background',
    });
    await expect(
      f.sessions.identify('alice', remote.sessionId),
    ).resolves.toEqual({ backend: 'runner', kind: 'realtime' });
    const restricted = {
      ...context(),
      credentials: { credential: 'restricted-fixture' },
    };
    expect(
      (await f.service.realtime(restricted, { sessionId: realtimeId })).backend,
    ).toBe('native');
    expect(
      (await f.service.background(context(), { sessionId: backgroundId }))
        .sessionId,
    ).toBe(backgroundId);
    await expect(
      f.service.configuration(restricted, realtimeId),
    ).resolves.toMatchObject({ selectedModel: model });
    expect(
      (await f.service.realtime(context(), { sessionId: remote.sessionId }))
        .backend,
    ).toBe('runner');
    expect(configuration).not.toHaveBeenCalled();
    expect(scope).not.toHaveBeenCalled();
    expect(f.resolveModel).not.toHaveBeenCalled();
    await expect(
      f.service.configuration(context(), remote.sessionId),
    ).resolves.toMatchObject({ agentId: f.agentId, selectedModel: null });
    expect(configuration).toHaveBeenCalledTimes(1);
    await expect(
      f.service.realtime(context(), { sessionId: backgroundId }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(
      f.service.background(context(), { sessionId: remote.sessionId }),
    ).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
      details: {
        reason: 'UNSUPPORTED_CAPABILITY',
        backend: 'runner',
        capability: 'background',
      },
    });
  });

  const invalidBindings: {
    name: string;
    mode: 'online' | 'runner';
    metadata: (agentId: string) => unknown;
  }[] = [
    { name: 'unbound Native', mode: 'online', metadata: () => ({}) },
    { name: 'ordinary unbound Runner', mode: 'runner', metadata: () => ({}) },
    { name: 'null metadata', mode: 'online', metadata: () => null },
    {
      name: 'null Native binding',
      mode: 'online',
      metadata: () => ({ onlineAgent: null }),
    },
    {
      name: 'unknown Native binding version',
      mode: 'online',
      metadata: () => ({ onlineAgent: { ...nativeBinding, version: 2 } }),
    },
    {
      name: 'invalid Native execution kind',
      mode: 'online',
      metadata: () => ({ onlineAgent: { ...nativeBinding, kind: 'runner' } }),
    },
    {
      name: 'missing Native configuration',
      mode: 'online',
      metadata: () => ({ onlineAgent: { version: 1, kind: 'realtime' } }),
    },
    {
      name: 'null Native configuration',
      mode: 'online',
      metadata: () => ({ onlineAgent: { ...nativeBinding, config: null } }),
    },
    {
      name: 'Runner agent in Native binding',
      mode: 'online',
      metadata: (agentId) => ({
        onlineAgent: { ...nativeBinding, config: { ...nativeConfig, agentId } },
      }),
    },
    {
      name: 'Native binding in Runner mode',
      mode: 'runner',
      metadata: () => ({ onlineAgent: nativeBinding }),
    },
    {
      name: 'Runner binding in Native mode',
      mode: 'online',
      metadata: (agentId) => ({ runnerOnlineAgent: runnerBinding(agentId) }),
    },
    {
      name: 'conflicting bindings',
      mode: 'online',
      metadata: (agentId) => ({
        onlineAgent: nativeBinding,
        runnerOnlineAgent: runnerBinding(agentId),
      }),
    },
    {
      name: 'valid Runner plus damaged Native marker',
      mode: 'runner',
      metadata: (agentId) => ({
        onlineAgent: null,
        runnerOnlineAgent: runnerBinding(agentId),
      }),
    },
    {
      name: 'unknown Runner binding version',
      mode: 'runner',
      metadata: (agentId) => ({
        runnerOnlineAgent: { ...runnerBinding(agentId), version: 2 },
      }),
    },
    {
      name: 'null Runner configuration',
      mode: 'runner',
      metadata: () => ({ runnerOnlineAgent: { version: 1, config: null } }),
    },
    {
      name: 'array Runner configuration',
      mode: 'runner',
      metadata: () => ({ runnerOnlineAgent: { version: 1, config: [] } }),
    },
    {
      name: 'Runner binding without agent',
      mode: 'runner',
      metadata: () => ({
        runnerOnlineAgent: { version: 1, config: nativeConfig },
      }),
    },
    {
      name: 'Runner binding for a different agent',
      mode: 'runner',
      metadata: () => ({ runnerOnlineAgent: runnerBinding('different-agent') }),
    },
    {
      name: 'Native agent in Runner binding',
      mode: 'runner',
      metadata: () => ({ runnerOnlineAgent: runnerBinding('online') }),
    },
  ];
  it.each(invalidBindings)(
    'rejects $name before backend configuration or restoration',
    async ({ mode, metadata }) => {
      const f = await fixture();
      const agent = await f.runnerSession();
      await conversationsRepo(f.harness.services.tx.read()).updateMany({
        filter: { id: agent.sessionId },
        values: { mode, metadata: asJson(metadata(f.agentId)) },
      });
      const load = vi.spyOn(f.sessions, 'load');
      const restore = vi.spyOn(f.runner, 'restoreRealtime');
      const configuration = vi.spyOn(f.runner, 'configuration');
      await expect(
        f.sessions.identify('alice', agent.sessionId),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      await expect(
        f.service.realtime(context(), { sessionId: agent.sessionId }),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      await expect(
        f.service.configuration(context(), agent.sessionId),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      await expect(
        f.service.configure(context(), agent.sessionId, {}),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      await expect(
        f.service.background(context(), { sessionId: agent.sessionId }),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      expect(load).not.toHaveBeenCalled();
      expect(restore).not.toHaveBeenCalled();
      expect(configuration).not.toHaveBeenCalled();
    },
  );

  it('checks ownership before inspecting valid or damaged bindings and hides nonexistent sessions', async () => {
    const f = await fixture();
    const nativeId = await f.native();
    const remote = await f.runnerSession();
    await conversationsRepo(f.harness.services.tx.read()).updateMany({
      filter: { id: remote.sessionId },
      values: {
        metadata: asJson({ onlineAgent: null, runnerOnlineAgent: null }),
      },
    });
    const configuration = vi.spyOn(f.runner, 'configuration');
    for (const id of [nativeId, remote.sessionId, randomUUID()]) {
      await expect(f.sessions.identify('bob', id)).rejects.toMatchObject({
        code: 'CONVERSATION_NOT_FOUND',
      });
      await expect(
        f.service.realtime(context('bob'), { sessionId: id }),
      ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
      await expect(
        f.service.configuration(context('bob'), id),
      ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
      await expect(
        f.service.configure(context('bob'), id, {}),
      ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
      await expect(
        f.service.background(context('bob'), { sessionId: id }),
      ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
    }
    expect(configuration).not.toHaveBeenCalled();
  });

  it('rejects an unavailable persisted Runner backend without falling back to Native', async () => {
    const f = await fixture();
    const agent = await f.runnerSession();
    const service = new OnlineAgentService({
      ...f.deps,
      runner: undefined,
      uiStreams: undefined,
    });
    services.push(service);
    const load = vi.spyOn(f.sessions, 'load');
    const unavailable = {
      code: 'INVALID_REQUEST',
      message: 'Runner execution is unavailable.',
    };
    await expect(
      service.realtime(context(), { sessionId: agent.sessionId }),
    ).rejects.toMatchObject(unavailable);
    await expect(
      service.background(context(), { sessionId: agent.sessionId }),
    ).rejects.toMatchObject(unavailable);
    await expect(
      service.configuration(context(), agent.sessionId),
    ).rejects.toMatchObject(unavailable);
    await expect(
      service.configure(context(), agent.sessionId, {}),
    ).rejects.toMatchObject(unavailable);
    expect(load).not.toHaveBeenCalled();
    expect(f.resolveModel).not.toHaveBeenCalled();
  });

  it('owns one shared producer probe and invokes persistence recovery directly', async () => {
    const f = await fixture();
    const producer = vi
      .spyOn(f.streams, 'producerAvailable')
      .mockResolvedValue(true);
    await expect(
      f.service.producerAvailable('missing-local-producer', false),
    ).resolves.toBe(false);
    expect(producer).not.toHaveBeenCalled();
    await expect(
      f.service.producerAvailable('remote-producer', true),
    ).resolves.toBe(true);
    expect(producer).toHaveBeenCalledExactlyOnceWith('remote-producer');
    producer.mockResolvedValue(false);
    await expect(
      f.service.producerAvailable('lost-producer', true),
    ).resolves.toBe(false);
    expect(producer).toHaveBeenCalledTimes(2);
    const recover = vi.spyOn(f.sessions, 'recoverAtStartup');
    await f.service.recoverAtStartup();
    expect(recover).toHaveBeenCalledOnce();
  });
});

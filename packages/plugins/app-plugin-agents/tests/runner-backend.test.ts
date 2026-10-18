import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import type {
  OnlineAgentContext,
  OnlineAgentConfig,
  NativeUIChunk,
} from '../server/online/agent/types.js';
import type { OnlineAgentBackend } from '../server/online/agent/contracts.js';
import {
  RunnerOnlineAgentAdapter,
  RunnerRealtimeOnlineAgent,
} from '../server/online/agent/runner/backend.js';
import { OnlineAgentUIStreams } from '../server/online/agent/transport/streams.js';
import { appUIMessageText } from '../shared/online-agent.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
let backend: RunnerOnlineAgentAdapter;
let streams: OnlineAgentUIStreams;
afterEach(async () => {
  vi.restoreAllMocks();
  await backend?.shutdown();
  await streams?.shutdown();
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});
const context = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { kind: 'test-session', userId: id },
  business: { reference: 'trusted-fixture' },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});
async function fixture() {
  // The harness provisions only an isolated migrated database and in-process services/routes.
  // No application lifecycle, listener, Redis, Docker or external execution process is started.
  h = await createHarness();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner' });
  const configurator = new OnlineAgentConfigurator();
  streams = new OnlineAgentUIStreams({ onError: () => {} });
  backend = new RunnerOnlineAgentAdapter({
    tx: h.services.tx,
    conversations: h.services.conversations,
    streams,
    configurator,
    now: () => h.clock.now().toISOString(),
    basePath: () => '/fixture',
    onError: () => {},
  });
  const config: OnlineAgentConfig = {
    agentId,
    scope: [],
    systemPrompt: '',
    tool: [],
    toolVersions: {},
    model: [],
  };
  const create = () =>
    backend.createRealtime(context(), { config, hasModel: false }, {});
  const report = (runId: string, action: string, body: unknown) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: runner.key,
      body,
    });
  const finish = async (agent: RunnerRealtimeOnlineAgent, text?: string) => {
    const [payload] = await claim(h, runner);
    const runId = payload.run.id;
    expect(
      (
        await report(runId, 'start', {
          workDir: '/fixture',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        })
      ).status,
    ).toBe(200);
    if (text)
      expect(
        (
          await report(runId, 'events', {
            events: [
              {
                seq: 1,
                at: h.clock.now().toISOString(),
                type: 'text',
                content: text,
              },
            ],
          })
        ).status,
      ).toBe(200);
    expect(
      (
        await report(runId, 'complete', {
          summary: 'Done',
          handledInputIds: (await h.services.runs.detail(runId)).inputs.map(
            (item) => item.id,
          ),
          sessionId: 'fixture-session',
        })
      ).status,
    ).toBe(200);
    await agent.retryFinalization();
    expect(await agent.status()).toBe('idle');
    return runId;
  };
  return { runner, agentId, configurator, config, create, finish };
}
async function chunks(
  stream: ReadableStream<NativeUIChunk> | null,
): Promise<NativeUIChunk[]> {
  expect(stream).not.toBeNull();
  const reader = stream!.getReader();
  const result: NativeUIChunk[] = [];
  for (;;) {
    const next = await reader.read();
    if (next.done) return result;
    result.push(next.value);
  }
}
const userMessage = [{ role: 'user' as const, content: 'Fixture request' }];
const unsupported = (capability: string) => ({
  code: 'INVALID_REQUEST',
  details: { reason: 'UNSUPPORTED_CAPABILITY', backend: 'runner', capability },
});

it('rejects unbound configuration and restricted restoration of a Runner conversation', async () => {
  const f = await fixture();
  const unbound = await h.services.conversations.create('alice', {
    agentId: f.agentId,
  });
  const restricted = {
    ...context(),
    credentials: { credential: 'restricted-fixture' },
  };
  await expect(
    backend.configuration(restricted, unbound.id),
  ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  const runner = await f.create();
  await expect(
    backend.restoreRealtime(restricted, { sessionId: runner.sessionId }),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
});

it('returns the committed admission without a fallible post-commit detail projection', async () => {
  const f = await fixture();
  const agent = await f.create();
  const run = h.services.tx.run.bind(h.services.tx);
  let committed = false;
  const transaction = vi
    .spyOn(h.services.tx, 'run')
    .mockImplementation(async (work, outer) => {
      const result = await run(work, outer);
      if (!outer) committed = true;
      return result;
    });
  const list = h.services.runners.list.bind(h.services.runners);
  const projection = vi
    .spyOn(h.services.runners, 'list')
    .mockImplementation((...args) => {
      if (committed)
        return Promise.reject(
          new Error('Post-commit detail projection failed.'),
        );
      return list(...args);
    });
  try {
    await expect(agent.send(userMessage)).resolves.toBeGreaterThan(0);
    expect(committed).toBe(true);
    await expect(
      h.services.conversations.get('alice', agent.sessionId),
    ).rejects.toThrow('Post-commit detail projection failed.');
    expect(await agent.status()).toBe('running');
    expect(await agent.history()).toHaveLength(1);
    expect(
      await h.database
        .connection()
        .repository('agRuns')
        .count({
          filter: { subjectKind: 'conversation', subjectId: agent.sessionId },
        }),
    ).toBe(1);
  } finally {
    transaction.mockRestore();
    projection.mockRestore();
  }
  await f.finish(agent, 'Accepted despite unavailable detail projection');
});

it('implements the full backend contract and rejects unsupported capabilities before persistence', async () => {
  const f = await fixture();
  const contract: OnlineAgentBackend = backend;
  expect(contract.kind).toBe('runner');
  const before = await h.database
    .connection()
    .repository('agConversations')
    .count();
  await expect(
    contract.createBackground(
      context(),
      { config: f.config, hasModel: false },
      {},
    ),
  ).rejects.toMatchObject(unsupported('background'));
  await expect(
    contract.restoreBackground(context(), { sessionId: 'missing' }),
  ).rejects.toMatchObject(unsupported('background'));
  await expect(
    contract.createRealtime(
      context(),
      { config: { ...f.config, thinking: 'high' }, hasModel: false },
      {},
    ),
  ).rejects.toMatchObject({
    details: { reason: 'UNSUPPORTED_CAPABILITY', backend: 'runner' },
  });
  expect(
    await h.database.connection().repository('agConversations').count(),
  ).toBe(before);
  const agent = await f.create();
  expect(agent).toBeInstanceOf(RunnerRealtimeOnlineAgent);
  await expect(
    agent.approve({} as Parameters<typeof agent.approve>[0]),
  ).rejects.toMatchObject(unsupported('approval'));
  await expect(
    contract.configure(
      context(),
      agent.sessionId,
      {},
      { modelService: 'native', model: 'fixture' },
    ),
  ).rejects.toMatchObject(unsupported('native models'));
  expect(await agent.history()).toEqual([]);
  expect(await contract.configuration(context(), agent.sessionId)).toEqual({
    ...f.config,
    selectedModel: null,
  });
  expect(await agent.status()).toBe('idle');
});

it('uses the initial provider once, restores without providers, and resolves pending scopes against the latest config', async () => {
  const f = await fixture();
  const actor = context();
  const initial = vi.fn(() => ({ agentId: f.agentId }));
  const pending = vi.fn((entry: OnlineAgentContext) => {
    expect(entry.credentials).toBe(actor.credentials);
    expect(entry.business).toBe(actor.business);
    return {
      systemPromptTemplate: `Pending ${JSON.stringify(entry.variable)}`,
    };
  });
  f.configurator.registerOnlineAgentScope('initial', initial);
  f.configurator.registerOnlineAgentScope('pending', pending);
  const selection = await f.configurator.resolveSelection(actor, {
    scope: ['initial'],
  });
  const agent = await backend.createRealtime(actor, selection, {});
  const restored = await backend.restoreRealtime(actor, {
    sessionId: agent.sessionId,
    scope: ['pending'],
  });
  expect(initial).toHaveBeenCalledTimes(1);
  expect(pending).not.toHaveBeenCalled();
  await backend.configure(actor, agent.sessionId, {
    context: { variable: { latest: 'retained' } },
  });
  await expect(
    restored.send(userMessage, { attachmentIds: [['missing-upload']] }),
  ).rejects.toThrow();
  expect(pending).toHaveBeenCalledTimes(1);
  expect(await restored.history()).toEqual([]);
  expect(await backend.configuration(actor, agent.sessionId)).toMatchObject({
    scope: ['initial'],
  });
  await backend.configure(actor, agent.sessionId, {
    context: { variable: { latest: 'newer' } },
  });
  await restored.send(userMessage);
  expect(pending).toHaveBeenCalledTimes(2);
  expect(await backend.configuration(actor, agent.sessionId)).toMatchObject({
    scope: ['pending'],
    variable: { latest: 'newer' },
    systemPrompt: 'Pending {"latest":"newer"}',
  });
  await expect(
    restored.send(userMessage, { overrides: { scope: ['pending'] } }),
  ).rejects.toThrow('busy');
  expect(pending).toHaveBeenCalledTimes(2);
  await f.finish(restored);
  await restored.send(userMessage);
  expect(pending).toHaveBeenCalledTimes(2);
});

it('preserves HTTP restrictions and validates pending variables with the selected scope on send', async () => {
  const f = await fixture();
  const agent = await f.create();
  const provider = vi.fn(() => ({
    systemPromptTemplate: {
      variableSchema: z.object({ ticket: z.string() }),
      template: (entry: OnlineAgentContext) => JSON.stringify(entry.variable),
    },
  }));
  f.configurator.registerOnlineAgentScope('ticket', provider);
  const http = await backend.restoreRealtime(
    context(),
    {
      sessionId: agent.sessionId,
      scope: ['ticket'],
      context: { variable: { ticket: 'fixture-123' } },
    },
    'http',
  );
  expect(provider).not.toHaveBeenCalled();
  await backend.configure(context(), agent.sessionId, {
    context: { variable: { retained: 'latest saved value' } },
  });
  await http.send(userMessage);
  expect(provider).toHaveBeenCalledTimes(1);
  expect(await backend.configuration(context(), agent.sessionId)).toMatchObject(
    {
      scope: ['ticket'],
      variable: { ticket: 'fixture-123', retained: 'latest saved value' },
    },
  );
  await f.finish(http);
  const forbidden = await backend.restoreRealtime(
    context(),
    {
      sessionId: agent.sessionId,
      context: { systemPrompt: 'Untrusted HTTP prompt' },
    },
    'http',
  );
  await expect(forbidden.send(userMessage)).rejects.toThrow(
    'HTTP configuration',
  );
  await expect(forbidden.send(userMessage)).rejects.toThrow(
    'HTTP configuration',
  );
  const unknown = await backend.restoreRealtime(
    context(),
    {
      sessionId: agent.sessionId,
      context: { variable: { undeclared: true } },
    },
    'http',
  );
  await expect(unknown.send(userMessage)).rejects.toThrow('declared');
  expect((await agent.history()).map(appUIMessageText)).toEqual([
    'Fixture request',
  ]);
});

it('keeps accepted response pinned through concurrent failed submissions and a later caller admission', async () => {
  const f = await fixture();
  const agent = await f.create();
  await agent.send(userMessage);
  const runId = await f.finish(agent, 'Accepted answer');
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  f.configurator.registerOnlineAgentScope('slow', async () => {
    entered.resolve();
    await release.promise;
    return { context: { variable: { unsuccessful: true } } };
  });
  const failed = agent.send(userMessage, {
    overrides: { scope: ['slow'] },
    attachmentIds: [['missing-upload']],
  });
  await entered.promise;
  try {
    await expect(
      agent.send(userMessage, { overrides: { scope: ['slow'] } }),
    ).rejects.toThrow('busy');
  } finally {
    release.resolve();
  }
  await expect(failed).rejects.toThrow();
  const other = await backend.restoreRealtime(context(), {
    sessionId: agent.sessionId,
  });
  await other.send([{ role: 'user', content: 'Later caller' }]);
  const first = await chunks(await agent.receive());
  expect(first.find((item) => item.type === 'start')).toMatchObject({
    messageId: `runner:${runId}`,
  });
  expect(first.filter((item) => item.type === 'text-delta')).toEqual([
    expect.objectContaining({ delta: 'Accepted answer' }),
  ]);
  expect(first.at(-1)).toMatchObject({ type: 'finish' });
  expect(await agent.receive()).toBeNull();
  expect(await other.status()).toBe('running');
  expect(
    await backend.configuration(context(), agent.sessionId),
  ).not.toHaveProperty('variable');
});

it('does not commit a provider-resolved config when another configure wins the persisted race', async () => {
  const f = await fixture();
  const agent = await f.create();
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  f.configurator.registerOnlineAgentScope('slow', async () => {
    entered.resolve();
    await release.promise;
    return { context: { variable: { stale: true } } };
  });
  const stale = backend.configure(context(), agent.sessionId, {
    scope: ['slow'],
  });
  await entered.promise;
  try {
    await backend.configure(context(), agent.sessionId, {
      context: { variable: { winner: true } },
    });
  } finally {
    release.resolve();
  }
  await expect(stale).rejects.toThrow('configuration changed');
  expect(await backend.configuration(context(), agent.sessionId)).toMatchObject(
    { scope: [], variable: { winner: true } },
  );
});

it('keeps resolved and expected configuration separate when a pending provider races a saved edit', async () => {
  const f = await fixture();
  const agent = await f.create();
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const provider = vi.fn(async () => {
    entered.resolve();
    await release.promise;
    return { systemPromptTemplate: 'Pending fixture prompt' };
  });
  f.configurator.registerOnlineAgentScope('slow', provider);
  const pending = await backend.restoreRealtime(context(), {
    sessionId: agent.sessionId,
    scope: ['slow'],
  });
  // A second process has its own in-memory admission reservations but the same durable lock.
  const other = new RunnerOnlineAgentAdapter({
    tx: h.services.tx,
    conversations: h.services.conversations,
    streams,
    configurator: f.configurator,
    now: () => h.clock.now().toISOString(),
    basePath: () => '/',
    onError: () => {},
  });
  const sending = pending.send(userMessage);
  await entered.promise;
  try {
    await other.configure(context(), agent.sessionId, {
      context: { variable: { winner: true } },
    });
  } finally {
    release.resolve();
    await other.shutdown();
  }
  await expect(sending).rejects.toThrow('configuration changed');
  expect(await pending.history()).toEqual([]);
  await pending.send(userMessage);
  expect(provider).toHaveBeenCalledTimes(2);
  expect(await backend.configuration(context(), agent.sessionId)).toMatchObject(
    {
      variable: { winner: true },
      systemPrompt: 'Pending fixture prompt',
      scope: ['slow'],
    },
  );
});

it.each(['provider', 'stream', 'commit'] as const)(
  'drains the entire %s admission before shutdown detaches only its own producers',
  async (phase) => {
    const f = await fixture();
    const agent = await f.create();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    f.configurator.registerOnlineAgentScope('slow', async () => {
      if (phase === 'provider') {
        entered.resolve();
        await release.promise;
      }
      return { systemPromptTemplate: 'Shutdown fixture' };
    });
    const native = await streams.open(
      'alice',
      'unrelated-native-fixture',
      'native-fixture',
      'native',
    );
    const open = streams.open.bind(streams);
    vi.spyOn(streams, 'open').mockImplementation(async (...args) => {
      const writer = await open(...args);
      if (phase === 'stream') {
        entered.resolve();
        await release.promise;
      }
      return writer;
    });
    const send = h.services.conversations.sendRealtime.bind(
      h.services.conversations,
    );
    vi.spyOn(h.services.conversations, 'sendRealtime').mockImplementation(
      async (...args) => {
        const accepted = await send(...args);
        if (phase === 'commit') {
          entered.resolve();
          await release.promise;
        }
        return accepted;
      },
    );
    const stop = vi.spyOn(h.services.conversations, 'stop');
    const sending = agent.send(userMessage, { overrides: { scope: ['slow'] } });
    await entered.promise;
    expect(await streams.producerAvailable(agent.sessionId)).toBe(
      phase !== 'provider',
    );
    expect(
      await h.database
        .connection()
        .repository('agRuns')
        .count({ filter: { subjectId: agent.sessionId } }),
    ).toBe(phase === 'commit' ? 1 : 0);
    let stopped = false;
    const stopping = backend.shutdown().then(() => {
      stopped = true;
    });
    try {
      await expect(agent.send(userMessage)).rejects.toThrow('stopping');
      await Promise.resolve();
      expect(stopped).toBe(false);
    } finally {
      release.resolve();
    }
    expect(await sending).toBe(1);
    await stopping;
    await backend.shutdown();
    expect(stop).not.toHaveBeenCalled();
    expect(await streams.producerAvailable(agent.sessionId)).toBe(false);
    expect(await streams.producerAvailable('unrelated-native-fixture')).toBe(
      true,
    );
    expect(await agent.status()).toBe('running');
    expect(
      await h.database
        .connection()
        .repository('agRuns')
        .count({ filter: { subjectId: agent.sessionId } }),
    ).toBe(1);
    const [payload] = await claim(h, f.runner);
    expect(
      (await h.services.runs.get(payload.run.id)).cancelRequestedAt,
    ).toBeNull();
    native.write({ type: 'finish', finishReason: 'stop' });
    native.close();
    expect(
      (
        await chunks(
          await streams.receive('alice', 'unrelated-native-fixture', native),
        )
      ).at(-1),
    ).toMatchObject({ type: 'finish' });
  },
);

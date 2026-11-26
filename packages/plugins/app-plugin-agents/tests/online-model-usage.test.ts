import type { ModelMessage } from 'ai';
import { MockLanguageModelV4, simulateReadableStream } from 'ai/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { NativeFileInputs } from '../server/online/files/service.js';
import { ModelError } from '../server/online/gateway.js';
import { createHarness, type Harness } from './harness.js';

const modelRef = { modelService: 'fixture', model: 'chat' };
const storedCounts = {
  inputTokens: '20',
  outputTokens: '8',
  cacheReadTokens: '5',
  cacheWriteTokens: '3',
  reasoningTokens: '2',
};
const finish = (reason: 'stop' | 'tool-calls', multiplier: number) => ({
  type: 'finish' as const,
  finishReason: { unified: reason, raw: reason },
  usage: {
    inputTokens: {
      total: 20 * multiplier,
      noCache: 12 * multiplier,
      cacheRead: 5 * multiplier,
      cacheWrite: 3 * multiplier,
    },
    outputTokens: {
      total: 8 * multiplier,
      text: 6 * multiplier,
      reasoning: 2 * multiplier,
    },
  },
});

const toolCall = (step: number) => ({
  type: 'tool-call' as const,
  toolCallId: `lookup-${step}`,
  toolName: 'lookup',
  input: '{}',
});
const answer = (multiplier: number) => [
  { type: 'response-metadata' as const, modelId: 'chat-version' },
  { type: 'text-start' as const, id: 'answer' },
  { type: 'text-delta' as const, id: 'answer', delta: 'Hello.' },
  { type: 'text-end' as const, id: 'answer' },
  finish('stop', multiplier),
];
const streamed = <T>(chunks: T[]) => ({
  stream: simulateReadableStream({
    chunks,
    initialDelayInMs: null,
    chunkDelayInMs: null,
  }),
});

describe('native online model usage', () => {
  let h: Harness;
  const lookup = vi.fn<(signal: AbortSignal) => Promise<string>>();

  beforeEach(async () => {
    h = await createHarness();
    await h.services.models.services.create({
      title: 'Fixture',
      provider: 'openai',
      apiKey: 'fixture-key',
      models: [{ value: modelRef.model }],
    });
    lookup.mockReset().mockResolvedValue('Result');
    h.services.onlineAgent.configurator.registerTool('lookup', {
      version: '1',
      definition: {
        inputSchema: z.object({ note: z.string().optional() }),
        execute: (_input, { context }) => lookup(context.signal),
      },
    });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await h?.close();
  });

  const entries = () =>
    h.services.tx.read().repository('agModelUsage').findMany({});

  async function createConversation(scope?: string, webSearch = false) {
    if (scope)
      h.services.onlineAgent.configurator.registerOnlineAgentScope(scope, {
        tool: ['lookup'],
      });
    const created = await h.request('POST', '/agents/conversations', {
      user: 'alice',
      body: {
        config: { ...(scope ? { scope: [scope] } : {}), webSearch },
        selectedModel: modelRef,
      },
    });
    expect(created.status).toBe(201);
    return created.body.data.id as string;
  }

  function send(id: string) {
    return h.request('POST', `/agents/conversations/${id}/messages`, {
      user: 'alice',
      body: {
        message: {
          id: `question-${id}`,
          role: 'user',
          parts: [{ type: 'text', text: 'What is the result?' }],
        },
      },
    });
  }

  it.each(['new conversation', 'model change'] as const)(
    'uses the authorized backup after a connection failure during %s',
    async (entry) => {
      await h.services.models.services.update('fixture', {
        models: [
          { value: 'chat' },
          { value: 'new-primary' },
          { value: 'backup' },
        ],
      });
      const primaryRef =
        entry === 'new conversation'
          ? modelRef
          : { ...modelRef, model: 'new-primary' };
      const primaryError = new ModelError(
        'network',
        'Primary connection offline.',
      );
      const backup = new MockLanguageModelV4({
        doStream: [streamed(answer(1))],
      });
      const modelFactory = vi
        .spyOn(NativeFileInputs.prototype, 'model')
        .mockImplementation(async ({ model }) => {
          if (model === primaryRef.model) throw primaryError;
          return backup;
        });
      const fallback = vi.fn(async () => 'network');
      const usage = vi.fn(async () => {});
      const prepare = vi.fn(async () => ({
        models: [`fixture/${primaryRef.model}`, 'fixture/backup'] as const,
        messages: (messages: ModelMessage[]) =>
          messages.map((message) =>
            message.role === 'user'
              ? { ...message, content: '[masked]' }
              : message,
          ),
        fallback,
        usage,
      }));
      h.services.onlineAgent.configurator.provideNativeTurn(prepare);
      const id = await createConversation();
      if (entry === 'model change') {
        const changed = await h.request(
          'PATCH',
          `/agents/conversations/${id}/config`,
          {
            user: 'alice',
            body: { config: {}, selectedModel: primaryRef },
          },
        );
        expect(changed.status).toBe(200);
        expect(changed.body.data.selectedModel).toEqual(primaryRef);
      }
      expect(prepare).not.toHaveBeenCalled();
      expect(backup.doStreamCalls).toHaveLength(0);
      modelFactory.mockClear();

      const sent = await send(id);
      expect(sent.status).toBe(200);
      expect(sent.body).toContain('Hello.');
      expect(sent.body).toContain('"fallbackReason":"network"');
      expect(prepare).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          context: expect.objectContaining({
            user: expect.objectContaining({ id: 'alice' }),
          }),
          sessionId: id,
          model: primaryRef,
        }),
      );
      expect(fallback).toHaveBeenCalledExactlyOnceWith(
        primaryError,
        primaryRef,
      );
      const backupRef = { ...modelRef, model: 'backup' };
      expect(modelFactory.mock.calls).toEqual([
        [primaryRef, id],
        [backupRef, id],
      ]);
      expect(backup.doStreamCalls).toHaveLength(1);
      expect(JSON.stringify(backup.doStreamCalls[0].prompt)).toContain(
        '[masked]',
      );
      expect(JSON.stringify(backup.doStreamCalls[0].prompt)).not.toContain(
        'What is the result?',
      );
      expect(usage).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ inputTokens: 20, outputTokens: 8 }),
        backupRef,
      );
      expect(await entries()).toEqual([
        expect.objectContaining({ model: 'backup', ...storedCounts }),
      ]);
    },
  );

  it('returns safe details on the first send if both new conversation candidates fail to connect', async () => {
    const primaryError = new ModelError('network', 'Primary endpoint offline.');
    const backupError = new ModelError(
      'auth',
      'Backup credentials cannot be read.',
    );
    const backupRef = { ...modelRef, model: 'backup' };
    vi.spyOn(NativeFileInputs.prototype, 'model').mockImplementation(
      async ({ model }) => {
        throw model === modelRef.model ? primaryError : backupError;
      },
    );
    const fallback = vi.fn(async () => 'network');
    const failure = vi.fn(async () => ({
      unavailableReason: 'invalidKey',
      settingsPath: '/settings/ai',
    }));
    h.services.onlineAgent.configurator.provideNativeTurn(async () => ({
      models: ['fixture/chat', 'fixture/backup'],
      fallback,
      failure,
    }));
    const id = await createConversation();
    const sent = await send(id);
    expect(sent.status).toBe(400);
    expect(sent.body).toMatchObject({
      error: {
        reason: 'MODEL_UNAVAILABLE',
        metadata: {
          unavailableReason: 'invalidKey',
          settingsPath: '/settings/ai',
        },
      },
    });
    expect(JSON.stringify(sent.body)).not.toContain(backupError.message);
    expect(fallback).toHaveBeenCalledExactlyOnceWith(primaryError, modelRef);
    expect(failure).toHaveBeenCalledExactlyOnceWith(backupError, backupRef);
    expect(await entries()).toEqual([]);
  });

  it('continues to validate connections when no native turn policy is registered', async () => {
    const model = new MockLanguageModelV4();
    const factory = vi
      .spyOn(NativeFileInputs.prototype, 'model')
      .mockResolvedValue(model);
    const id = await createConversation();
    const error = new ModelError('network', 'The connection is unavailable.');
    factory.mockRejectedValue(error);
    const configured = await h.request(
      'PATCH',
      `/agents/conversations/${id}/config`,
      {
        user: 'alice',
        body: { config: {}, selectedModel: { ...modelRef, model: 'other' } },
      },
    );
    expect(configured.status).toBe(500);
    const created = await h.request('POST', '/agents/conversations', {
      user: 'alice',
      body: { selectedModel: modelRef },
    });
    expect(created.status).toBe(500);
    const saved = await h.request('GET', `/agents/conversations/${id}/config`, {
      user: 'alice',
    });
    expect(saved.body.data.selectedModel).toEqual(modelRef);
  });

  it('runs the host policy before a native call while keeping original history', async () => {
    const model = new MockLanguageModelV4({ doStream: [streamed(answer(1))] });
    const modelFactory = vi
      .spyOn(NativeFileInputs.prototype, 'model')
      .mockResolvedValue(model);
    const recorded = vi.fn(async () => {});
    await h.services.models.services.update('fixture', {
      models: [{ value: 'chat' }, { value: 'routine' }],
    });
    const release = h.services.onlineAgent.configurator.provideNativeTurn(
      async ({ context, sessionId }) => {
        expect(context.user.id).toBe('alice');
        expect(sessionId).toBeTruthy();
        return {
          models: ['fixture/routine'],
          messages: (messages) =>
            messages.map((message) =>
              message.role === 'user'
                ? { ...message, content: '[masked]' }
                : message,
            ),
          usage: recorded,
        };
      },
    );
    const id = await createConversation();
    expect((await send(id)).status).toBe(200);
    expect(modelFactory).toHaveBeenCalledWith(
      { modelService: 'fixture', model: 'routine' },
      id,
    );
    expect(JSON.stringify(model.doStreamCalls[0]?.prompt)).toContain(
      '[masked]',
    );
    expect(JSON.stringify(model.doStreamCalls[0]?.prompt)).not.toContain(
      'What is the result?',
    );
    expect(recorded).toHaveBeenCalledExactlyOnceWith(
      {
        inputTokens: 20,
        outputTokens: 8,
        cacheReadTokens: 5,
        cacheWriteTokens: 3,
        reasoningTokens: 2,
      },
      { modelService: 'fixture', model: 'routine' },
    );
    const messages = await h.request(
      'GET',
      `/agents/conversations/${id}/messages`,
      { user: 'alice' },
    );
    expect(JSON.stringify(messages.body)).toContain('What is the result?');
    release();
  });

  it('transforms the system message, tool input and fresh tool result before each provider call', async () => {
    const configurator = h.services.onlineAgent.configurator;
    configurator.registerOnlineAgentGlobalScope({
      systemPromptTemplate: 'The system contains private-system.',
    });
    lookup.mockResolvedValue('Tool returned private-result.');
    const model = new MockLanguageModelV4({
      doStream: [
        streamed([
          { ...toolCall(1), input: '{"note":"private-argument"}' },
          finish('tool-calls', 1),
        ]),
        streamed(answer(1)),
      ],
    });
    vi.spyOn(NativeFileInputs.prototype, 'model').mockResolvedValue(model);
    const transform = vi.fn((messages: ModelMessage[]) =>
      messages.map((message) =>
        Object.assign(
          message,
          JSON.parse(JSON.stringify(message).replaceAll('private-', 'masked-')),
        ),
      ),
    );
    configurator.provideNativeTurn(async () => ({ messages: transform }));
    const id = await createConversation('ticket-helper');
    expect((await send(id)).status).toBe(200);
    expect(transform).toHaveBeenCalledTimes(2);
    expect(model.doStreamCalls).toHaveLength(2);
    const second = JSON.stringify(model.doStreamCalls[1].prompt);
    expect(second).toContain('masked-system');
    expect(second).toContain('masked-argument');
    expect(second).toContain('masked-result');
    expect(second).toContain('lookup-1');
    expect(second).not.toContain('private-');
    const messages = await h.services.tx
      .read()
      .repository('agConversationMessages')
      .findMany({ filter: { conversationId: id } });
    const stored = JSON.stringify(messages);
    expect(stored).toContain('private-result');
    expect(stored).toContain('private-argument');
  });

  it.each([
    'error chunk',
    'closed stream',
    'rejected read',
    'connection setup',
  ])(
    'falls back before output after %s and charges usage to the backup',
    async (failureMode) => {
      await h.services.models.services.update('fixture', {
        models: [{ value: 'chat' }, { value: 'backup' }],
      });
      const failure = new ModelError('network', 'The model is not reachable.');
      const prelude = [
        { type: 'stream-start' as const, warnings: [] },
        { type: 'response-metadata' as const, modelId: 'failed-primary' },
        { type: 'reasoning-start' as const, id: 'thinking' },
        { type: 'reasoning-end' as const, id: 'thinking' },
        { type: 'text-start' as const, id: 'failed-start' },
        { type: 'text-delta' as const, id: 'failed-start', delta: '' },
      ];
      const primary = new MockLanguageModelV4({
        doStream: [
          failureMode === 'rejected read'
            ? {
                stream: new ReadableStream({
                  start(controller) {
                    controller.enqueue(prelude[0]);
                  },
                  pull(controller) {
                    controller.error(failure);
                  },
                }),
              }
            : streamed([
                ...prelude,
                ...(failureMode === 'error chunk'
                  ? [{ type: 'error' as const, error: failure }]
                  : []),
              ]),
        ],
      });
      const backup = new MockLanguageModelV4({
        doStream: [streamed(answer(1))],
      });
      const resolveModel = vi
        .spyOn(NativeFileInputs.prototype, 'model')
        .mockImplementation(async ({ model }) => {
          if (model === 'backup') return backup;
          return primary;
        });
      const id = await createConversation();
      if (failureMode === 'connection setup')
        resolveModel.mockRejectedValueOnce(failure);
      const recorded = vi.fn(async () => {});
      const fallback = vi.fn(async () => 'network');
      h.services.onlineAgent.configurator.provideNativeTurn(async () => ({
        models: ['fixture/chat', 'fixture/backup'],
        fallback,
        usage: recorded,
      }));
      const sent = await send(id);
      expect(sent.status).toBe(200);
      expect(sent.body).toContain('"fallbackReason":"network"');
      expect(sent.body).not.toContain('failed-start');
      expect(fallback).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ code: 'network' }),
        modelRef,
      );
      expect(backup.doStreamCalls).toHaveLength(1);
      expect(recorded).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ inputTokens: 20, outputTokens: 8 }),
        { modelService: 'fixture', model: 'backup' },
      );
      const history = await h.request(
        'GET',
        `/agents/conversations/${id}/messages`,
        { user: 'alice' },
      );
      expect(JSON.stringify(history.body)).toContain('Hello.');
      expect(JSON.stringify(history.body)).toContain(
        '"fallbackReason":"network"',
      );
      expect(await entries()).toEqual([
        expect.objectContaining({ model: 'backup', ...storedCounts }),
      ]);
    },
  );

  it.each([true, false])(
    'classifies backup resolution failures against the backup (initial connection failure: %s)',
    async (initialConnectionFailure) => {
      const primaryError = new ModelError('network', 'Primary offline.');
      const backupError = new ModelError('config', 'Backup secret is missing.');
      const primary = new MockLanguageModelV4({
        doStream: [streamed([{ type: 'error', error: primaryError }])],
      });
      const resolveModel = vi
        .spyOn(NativeFileInputs.prototype, 'model')
        .mockResolvedValue(primary);
      const id = await createConversation();
      resolveModel.mockImplementation(async ({ model }) => {
        if (model === 'backup') throw backupError;
        if (initialConnectionFailure) throw primaryError;
        return primary;
      });
      const failure = vi.fn(async () => ({ unavailableReason: 'missing' }));
      const fallback = vi.fn(async () => 'network');
      h.services.onlineAgent.configurator.provideNativeTurn(async () => ({
        models: ['fixture/chat', 'fixture/backup'],
        fallback,
        failure,
      }));
      const sent = await send(id);
      expect(sent.status).toBe(initialConnectionFailure ? 400 : 200);
      expect(JSON.stringify(sent.body)).toContain('unavailableReason');
      expect(JSON.stringify(sent.body)).not.toContain(backupError.message);
      expect(fallback).toHaveBeenCalledExactlyOnceWith(primaryError, modelRef);
      expect(failure).toHaveBeenCalledExactlyOnceWith(backupError, {
        modelService: 'fixture',
        model: 'backup',
      });
      expect(await entries()).toEqual([]);
    },
  );

  it('checks the backup can run the search tool before sending it a prompt', async () => {
    const service = await h.services.models.services.create({
      title: 'Backup proxy',
      provider: 'openai',
      baseUrl: 'https://proxy.example/v1',
      apiKey: 'fixture-key',
      models: [{ value: 'chat' }],
    });
    const primary = new MockLanguageModelV4({
      doStream: [
        streamed([
          { type: 'error', error: new ModelError('network', 'Offline.') },
        ]),
      ],
    });
    const backup = new MockLanguageModelV4({ doStream: [streamed(answer(1))] });
    vi.spyOn(NativeFileInputs.prototype, 'model').mockImplementation(
      async ({ modelService }) =>
        modelService === service.name ? backup : primary,
    );
    const id = await createConversation(undefined, true);
    const failure = vi.fn(async () => ({ unavailableReason: 'modelFailed' }));
    h.services.onlineAgent.configurator.provideNativeTurn(async () => ({
      models: ['fixture/chat', `${service.name}/chat`],
      fallback: async () => 'network',
      failure,
    }));
    const sent = await send(id);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain('"unavailableReason":"modelFailed"');
    expect(failure).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message: expect.stringContaining('Web search is unavailable'),
      }),
      { modelService: service.name, model: 'chat' },
    );
    expect(backup.doStreamCalls).toHaveLength(0);
  });

  it('keeps the connection error when a search-enabled primary is disabled', async () => {
    const service = await h.services.models.services.create({
      title: 'Backup service',
      provider: 'openai',
      apiKey: 'fixture-key',
      models: [{ value: 'chat' }],
    });
    const backup = new MockLanguageModelV4({ doStream: [streamed(answer(1))] });
    const originalModel = NativeFileInputs.prototype.model;
    vi.spyOn(NativeFileInputs.prototype, 'model').mockImplementation(
      async function (this: NativeFileInputs, ref, sessionId) {
        return ref.modelService === service.name
          ? backup
          : originalModel.call(this, ref, sessionId);
      },
    );
    const id = await createConversation(undefined, true);
    await h.services.models.services.update('fixture', { enabled: false });
    const fallback = vi.fn(async () => 'serviceDisabled');
    h.services.onlineAgent.configurator.provideNativeTurn(async () => ({
      models: ['fixture/chat', `${service.name}/chat`],
      fallback,
    }));
    const sent = await send(id);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain('"fallbackReason":"serviceDisabled"');
    expect(fallback).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ code: 'config' }),
      modelRef,
    );
    expect(backup.doStreamCalls).toHaveLength(1);
  });

  it.each([
    { type: 'text-start' as const, id: 'answer' },
    { type: 'tool-input-start' as const, id: 'lookup-1', toolName: 'lookup' },
  ])('keeps the primary after committing $type', async (part) => {
    const failure = new ModelError('quota', 'Provider quota exhausted.');
    const primary = new MockLanguageModelV4({
      doStream: [
        streamed([
          part,
          ...(part.type === 'text-start'
            ? [{ type: 'text-delta' as const, id: part.id, delta: 'Partial' }]
            : []),
          { type: 'error' as const, error: failure },
        ]),
      ],
    });
    const resolveModel = vi
      .spyOn(NativeFileInputs.prototype, 'model')
      .mockResolvedValue(primary);
    const id = await createConversation('ticket-helper');
    const fallback = vi.fn(async () => 'quotaExceeded');
    const classify = vi.fn(async () => ({
      unavailableReason: 'quotaExceeded',
    }));
    h.services.onlineAgent.configurator.provideNativeTurn(async () => ({
      models: ['fixture/chat', 'fixture/backup'],
      fallback,
      failure: classify,
    }));
    const sent = await send(id);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain('"unavailableReason":"quotaExceeded"');
    if (part.type === 'text-start') expect(sent.body).toContain('Partial');
    expect(fallback).not.toHaveBeenCalled();
    expect(classify).toHaveBeenCalledExactlyOnceWith(failure, modelRef);
    expect(resolveModel).not.toHaveBeenCalledWith(
      { modelService: 'fixture', model: 'backup' },
      id,
    );
  });

  it('retains the original provider failure when host usage recording fails', async () => {
    const failure = new ModelError('auth', 'Raw provider credentials error.');
    const model = new MockLanguageModelV4({
      doStream: [
        streamed([toolCall(1), finish('tool-calls', 1)]),
        streamed([{ type: 'error', error: failure }]),
      ],
    });
    vi.spyOn(NativeFileInputs.prototype, 'model').mockResolvedValue(model);
    const classify = vi.fn(async () => ({
      unavailableReason: 'invalidKey',
      settingsPath: '/settings/ai',
    }));
    const usage = vi.fn(async () => {
      throw new Error('Host usage store unreachable.');
    });
    h.services.onlineAgent.configurator.provideNativeTurn(async () => ({
      failure: classify,
      usage,
    }));
    const id = await createConversation('ticket-helper');
    const sent = await send(id);
    expect(sent.status).toBe(200);
    const notice =
      '"params":{"unavailableReason":"invalidKey","settingsPath":"/settings/ai"}';
    expect(sent.body).toContain(notice);
    expect(sent.body).not.toContain(failure.message);
    expect(classify).toHaveBeenCalledExactlyOnceWith(failure, modelRef);
    expect(usage).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ inputTokens: 20, outputTokens: 8 }),
      modelRef,
    );
    const history = await h.request(
      'GET',
      `/agents/conversations/${id}/messages`,
      { user: 'alice' },
    );
    expect(JSON.stringify(history.body)).toContain(notice);
    expect(await entries()).toEqual([expect.objectContaining(storedCounts)]);
  });

  it('stores one row per turn and prices all steps under their agent source', async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        streamed([toolCall(1), finish('tool-calls', 1)]),
        streamed([toolCall(2), finish('tool-calls', 2)]),
        streamed(answer(3)),
        streamed(answer(1)),
        streamed(answer(1)),
      ],
    });
    vi.spyOn(NativeFileInputs.prototype, 'model').mockResolvedValue(model);
    const ticket = await createConversation('ticket-helper');
    const scopedOnline = await createConversation('online');
    const defaultOnline = await createConversation();
    expect((await send(ticket)).status).toBe(200);
    expect((await send(scopedOnline)).status).toBe(200);
    expect((await send(defaultOnline)).status).toBe(200);
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(model.doStreamCalls).toHaveLength(5);
    expect(await entries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'agents.online:ticket-helper',
          purpose: 'text',
          ...modelRef,
          units: 1,
          inputTokens: '120',
          outputTokens: '48',
          cacheReadTokens: '30',
          cacheWriteTokens: '18',
          reasoningTokens: '12',
        }),
        expect.objectContaining({
          source: 'agents.online:online',
          ...storedCounts,
        }),
        expect.objectContaining({
          source: 'agents.online',
          ...storedCounts,
        }),
      ]),
    );
    expect(await entries()).toHaveLength(3);

    await h.services.prices.replace({
      prices: [
        {
          tool: 'online',
          ...modelRef,
          inputPerM: 1_000_000,
          outputPerM: 750_000,
          cacheReadPerM: 100_000,
          cacheWritePerM: 500_000,
        },
      ],
      subscriptions: [],
    });
    const report = await h.request('GET', '/agents/usage/models', {
      user: 'reader',
      can: ['agents.prices/read'],
    });
    expect(report.status).toBe(200);
    expect(report.body.data.rows).toEqual([
      expect.objectContaining({
        source: 'agents.online',
        calls: 1,
        cost: { USD: 20 },
      }),
      expect.objectContaining({
        source: 'agents.online:online',
        calls: 1,
        cost: { USD: 20 },
      }),
      expect.objectContaining({
        source: 'agents.online:ticket-helper',
        calls: 1,
        inputTokens: 120,
        outputTokens: 48,
        cost: { USD: 120 },
      }),
    ]);
  });

  it('records returned usage when a turn is stopped while its tool is running', async () => {
    const started = Promise.withResolvers<void>();
    lookup.mockImplementation((signal) => {
      started.resolve();
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), {
          once: true,
        });
      });
    });
    vi.spyOn(NativeFileInputs.prototype, 'model').mockResolvedValue(
      new MockLanguageModelV4({
        doStream: [streamed([toolCall(1), finish('tool-calls', 1)])],
      }),
    );
    const id = await createConversation('ticket-helper');
    const sent = send(id);
    await started.promise;
    expect(
      (
        await h.request('POST', `/agents/conversations/${id}/stop`, {
          user: 'alice',
        })
      ).status,
    ).toBe(200);
    expect((await sent).status).toBe(200);
    const history = await h.request(
      'GET',
      `/agents/conversations/${id}/messages`,
      {
        user: 'alice',
      },
    );
    expect(JSON.stringify(history.body.data)).toContain('cancelled');
    expect(await entries()).toEqual([expect.objectContaining(storedCounts)]);
  });

  it.each([true, false])(
    'records only the usage returned before a provider failure (previous response: %s)',
    async (previousResponse) => {
      const model = new MockLanguageModelV4({
        doStream: [
          ...(previousResponse
            ? [streamed([toolCall(1), finish('tool-calls', 1)])]
            : []),
          streamed([{ type: 'error', error: new Error('Provider failed') }]),
        ],
      });
      vi.spyOn(NativeFileInputs.prototype, 'model').mockResolvedValue(model);
      const id = await createConversation('ticket-helper');
      expect((await send(id)).status).toBe(200);
      const history = await h.request(
        'GET',
        `/agents/conversations/${id}/messages`,
        {
          user: 'alice',
        },
      );
      expect(JSON.stringify(history.body.data)).toContain('failed');
      expect(await entries()).toEqual(
        previousResponse ? [expect.objectContaining(storedCounts)] : [],
      );
    },
  );
});

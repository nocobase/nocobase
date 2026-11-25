import { MockLanguageModelV4, simulateReadableStream } from 'ai/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createModelUsageRecorder } from '../server/core/reports/model-usage.js';
import { NativeFileInputs } from '../server/online/files/service.js';
import { createHarness, type Harness } from './harness.js';

const modelRef = { modelService: 'fixture', model: 'chat' };
const tokenCounts = {
  inputTokens: 20,
  outputTokens: 8,
  cacheReadTokens: 5,
  cacheWriteTokens: 3,
  reasoningTokens: 2,
};
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
        inputSchema: z.object({}),
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

  async function createConversation(scope: string) {
    h.services.onlineAgent.configurator.registerOnlineAgentScope(scope, {
      tool: ['lookup'],
    });
    const created = await h.request('POST', '/agents/conversations', {
      user: 'alice',
      body: { config: { scope: [scope] }, selectedModel: modelRef },
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
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

  it('stores one row per turn and prices all steps under their agent source', async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        streamed([toolCall(1), finish('tool-calls', 1)]),
        streamed([toolCall(2), finish('tool-calls', 2)]),
        streamed(answer(3)),
        streamed(answer(1)),
      ],
    });
    vi.spyOn(NativeFileInputs.prototype, 'model').mockResolvedValue(model);
    const ticket = await createConversation('ticket-helper');
    const docs = await createConversation('docs-helper');
    expect((await send(ticket)).status).toBe(200);
    expect((await send(docs)).status).toBe(200);
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(model.doStreamCalls).toHaveLength(4);
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
          source: 'agents.online:docs-helper',
          ...storedCounts,
        }),
      ]),
    );
    expect(await entries()).toHaveLength(2);

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
        source: 'agents.online:docs-helper',
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

  it('preserves simultaneous writes from separate recorders sharing a database', async () => {
    const deps = { tx: h.services.tx, clock: h.clock };
    const recorders = [
      createModelUsageRecorder(deps),
      createModelUsageRecorder(deps),
    ];
    await Promise.all(
      recorders.map((recorder, index) =>
        recorder.record({
          purpose: 'text',
          source: `caller-${index}`,
          ...modelRef,
          ...tokenCounts,
          units: 1,
        }),
      ),
    );
    const rows = await entries();
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
    expect(rows.map((row) => row.source).sort()).toEqual([
      'caller-0',
      'caller-1',
    ]);
  });
});

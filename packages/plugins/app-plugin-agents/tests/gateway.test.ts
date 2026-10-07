/**
 * The model gateway on AI SDK Core over a saved service, with a local OpenAI-compatible server standing in for the
 * provider: streamed text, tool calls and usage, the messages and tools it sends, and how failures are classified.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  classify,
  createModelGateway,
  ModelError,
  type ModelEvent,
  type ModelGateway,
} from '../server/online/index.js';
import { reasoningOf } from '../server/online/gateway.js';
import { createHarness, type Harness } from './harness.js';
import { startMockOpenAI, type MockOpenAI } from './mock-openai.js';

async function collect(
  events: AsyncIterable<ModelEvent>,
): Promise<ModelEvent[]> {
  const list: ModelEvent[] = [];
  for await (const event of events) list.push(event);
  return list;
}

describe('the model gateway', () => {
  let h: Harness;
  let mock: MockOpenAI;
  let gateway: ModelGateway;

  beforeEach(async () => {
    mock = await startMockOpenAI();
    h = await createHarness();
    const services = h.services.online.services;
    await services.create({
      title: 'Local',
      provider: 'openai-compatible',
      baseUrl: mock.url,
      apiKey: 'test-key',
      models: [{ value: 'mock-model', label: 'Mock model' }],
    });
    await services.create({
      title: 'Off',
      provider: 'openai-compatible',
      baseUrl: mock.url,
      models: [{ value: 'mock-model' }],
      enabled: false,
    });
    await services.create({
      title: 'Keyless',
      provider: 'openai',
      models: [{ value: 'gpt-x' }],
    });
    // No retries, so a refusal is classified at once.
    gateway = createModelGateway(services, { maxRetries: 0 });
  });
  afterEach(async () => {
    await h.close();
    await mock.close();
  });

  const model = { modelService: 'local', model: 'mock-model' };

  it('lists the enabled services that offer models', async () => {
    expect(await gateway.catalog()).toEqual({
      services: [
        {
          name: 'local',
          title: 'Local',
          provider: 'openai-compatible',
          models: [
            {
              value: 'mock-model',
              label: 'Mock model',
              kind: 'chat',
              dimensions: null,
            },
          ],
        },
        {
          name: 'keyless',
          title: 'Keyless',
          provider: 'openai',
          models: [
            { value: 'gpt-x', label: 'gpt-x', kind: 'chat', dimensions: null },
          ],
        },
      ],
      defaultModel: { modelService: 'local', model: 'mock-model' },
    });
  });

  it('streams text, tool calls and usage, and sends tools and tool results', async () => {
    mock.answer({
      text: ['Let me ', 'look.'],
      toolCalls: [
        { id: 'call_1', name: 'issue_search', arguments: '{"query":"login"}' },
      ],
      usage: { prompt: 120, completion: 30, cached: 20 },
    });
    const events = await collect(
      gateway.stream({
        model: { ...model, reasoning: 'high' },
        messages: [
          { role: 'system', content: 'Be brief.' },
          { role: 'user', content: 'What about login?' },
          {
            role: 'assistant',
            content: '',
            toolCalls: [
              { id: 'call_0', name: 'issue_get', args: { id: 'PM-1' } },
            ],
          },
          { role: 'tool', toolCallId: 'call_0', content: '{"data":{}}' },
        ],
        tools: [
          {
            name: 'issue_search',
            description: 'Search issues.',
            inputSchema: {
              type: 'object',
              properties: { query: { type: 'string' } },
            },
          },
        ],
      }),
    );
    expect(events).toEqual([
      { type: 'text', delta: 'Let me ' },
      { type: 'text', delta: 'look.' },
      {
        type: 'toolCall',
        call: { id: 'call_1', name: 'issue_search', args: { query: 'login' } },
      },
      {
        type: 'finish',
        reason: 'toolCalls',
        model: 'mock-model',
        usage: { inputTokens: 100, outputTokens: 30, cacheReadTokens: 20 },
      },
    ]);
    const [request] = mock.requests;
    expect(request?.authorization).toBe('Bearer test-key');
    expect(request?.stream).toBe(true);
    expect(request?.tools).toEqual([
      expect.objectContaining({
        type: 'function',
        function: expect.objectContaining({ name: 'issue_search' }),
      }),
    ]);
    expect(request?.messages.map((message) => message.role)).toEqual([
      'system',
      'user',
      'assistant',
      'tool',
    ]);
    expect(request?.messages[2]).toMatchObject({
      tool_calls: [
        {
          id: 'call_0',
          type: 'function',
          function: { name: 'issue_get', arguments: '{"id":"PM-1"}' },
        },
      ],
    });
    expect(request?.messages[3]).toMatchObject({ tool_call_id: 'call_0' });
  });

  it.each([
    [401, { message: 'Incorrect API key', code: 'invalid_api_key' }, 'auth'],
    [
      429,
      { message: 'You exceeded your quota', code: 'insufficient_quota' },
      'quota',
    ],
    [
      429,
      { message: 'Rate limit reached', code: 'rate_limit_exceeded' },
      'rateLimit',
    ],
    [
      400,
      {
        message: "This model's maximum context length is 8192 tokens",
        code: 'context_length_exceeded',
      },
      'contextOverflow',
    ],
    [
      404,
      { message: 'The model does not exist', code: 'model_not_found' },
      'config',
    ],
    [400, { message: 'Bad request' }, 'badResponse'],
    [503, { message: 'Overloaded' }, 'network'],
  ] as const)(
    'classifies a %s answer (%s) as %s',
    async (status, error, code) => {
      mock.answer({ status, error });
      await expect(
        collect(
          gateway.stream({
            model,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        ),
      ).rejects.toMatchObject({ name: 'ModelError', code });
    },
  );

  it('refuses a model or service that is not offered as config, a service without a key as auth, and an unreachable one as network', async () => {
    const hi = [{ role: 'user' as const, content: 'Hi' }];
    await expect(
      collect(
        gateway.stream({
          model: { modelService: 'local', model: 'other' },
          messages: hi,
        }),
      ),
    ).rejects.toMatchObject({ code: 'config' });
    await expect(
      collect(
        gateway.stream({
          model: { modelService: 'off', model: 'mock-model' },
          messages: hi,
        }),
      ),
    ).rejects.toMatchObject({ code: 'config' });
    await expect(
      collect(
        gateway.stream({
          model: { modelService: 'keyless', model: 'gpt-x' },
          messages: hi,
        }),
      ),
    ).rejects.toMatchObject({ code: 'auth' });
    await mock.close();
    await expect(
      collect(gateway.stream({ model, messages: hi })),
    ).rejects.toMatchObject({ code: 'network' });
    mock = await startMockOpenAI();
  });

  it('stops a call when its signal aborts', async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(
      collect(
        gateway.stream({
          model,
          messages: [{ role: 'user', content: 'Hi' }],
          signal: abort.signal,
        }),
      ),
    ).rejects.toMatchObject({ code: 'aborted' });
  });

  it('tests a model', async () => {
    mock.answer({ text: ['Hello.'] });
    expect(await gateway.check(model)).toEqual({ ok: true, message: null });
    mock.answer({ status: 401, error: { message: 'Incorrect API key' } });
    expect(await gateway.check(model)).toEqual({
      ok: false,
      message: 'Incorrect API key',
    });
    expect(
      await gateway.check({ modelService: 'local', model: 'missing' }),
    ).toMatchObject({ ok: false });
  });

  it('keeps ModelErrors as they are, and names an entry’s reasoning effort as the SDK does', () => {
    const error = new ModelError('rateLimit', 'Slow down.');
    expect(classify(error)).toBe(error);
    expect(classify(new Error('boom')).code).toBe('unknown');
    expect(reasoningOf('xhigh')).toBe('xhigh');
    expect(reasoningOf('low')).toBe('low');
    expect(reasoningOf('max')).toBe('provider-default');
    expect(reasoningOf(null)).toBe('provider-default');
  });
});

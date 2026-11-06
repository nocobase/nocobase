import { embedMany, generateText } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  embeddingModel,
  languageModel,
  MODEL_USER_AGENT,
} from '../server/online/providers.js';

// Exercise the installed SDKs without contacting any provider or using real credentials.
describe('Alibaba provider transports', () => {
  let requests: Request[];

  beforeEach(() => {
    requests = [];
    vi.stubEnv('ALIBABA_API_KEY', 'environment-must-not-override-fixture-key');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (new URL(request.url).pathname.endsWith('/embeddings')) {
        const body: { input: string[] } = await request.clone().json();
        return Response.json({
          data: body.input.map((_, index) => ({
            object: 'embedding',
            index,
            embedding: index === 0 ? [1, 0, 0] : [0, 1, 0],
          })),
          usage: { prompt_tokens: 2, total_tokens: 2 },
        });
      }
      if (new URL(request.url).pathname.endsWith('/chat/completions')) {
        return Response.json({
          id: 'fixture-chat',
          object: 'chat.completion',
          created: 1,
          model: 'fixture-chat',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Chat unchanged.' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        });
      }
      return Response.json(
        { error: { message: 'Unexpected path.' } },
        { status: 404 },
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    {
      baseUrl: 'https://alibaba.invalid/compatible-mode/v1',
      expected: 'https://alibaba.invalid/compatible-mode/v1/embeddings',
      dimensions: 3,
    },
    {
      baseUrl: 'https://alibaba.invalid/custom/v1/',
      expected: 'https://alibaba.invalid/custom/v1/embeddings',
      dimensions: null,
    },
    {
      baseUrl: null,
      expected: 'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings',
      dimensions: 3,
    },
  ])(
    'embeds through the compatible API at $expected',
    async ({ baseUrl, expected, dimensions }) => {
      const call = embeddingModel(
        { provider: 'alibaba', baseUrl, apiKey: 'fixture-key' },
        'fixture-embedding',
        dimensions,
      );
      const result = await embedMany({
        ...call,
        values: ['one', 'two'],
        maxRetries: 0,
      });
      expect(result.embeddings).toEqual([
        [1, 0, 0],
        [0, 1, 0],
      ]);
      expect(requests).toHaveLength(1);
      const request = requests[0]!;
      expect(request.url).toBe(expected);
      expect(request.method).toBe('POST');
      expect(request.headers.get('authorization')).toBe('Bearer fixture-key');
      expect(request.headers.get('user-agent')).toContain(MODEL_USER_AGENT);
      const body = await request.json();
      expect(body).toMatchObject({
        model: 'fixture-embedding',
        input: ['one', 'two'],
      });
      if (dimensions === null) expect(body).not.toHaveProperty('dimensions');
      else expect(body).toHaveProperty('dimensions', dimensions);
      expect(body).not.toHaveProperty('parameters');
      expect(body).toHaveProperty('encoding_format', 'float');
    },
  );

  it('retains Alibaba batch limits and serial dispatch for callers with many texts', async () => {
    const call = embeddingModel(
      {
        provider: 'alibaba',
        baseUrl: 'https://alibaba.invalid/compatible-mode/v1',
        apiKey: 'fixture-key',
      },
      'fixture-embedding',
      3,
    );
    const values = Array.from({ length: 25 }, (_, i) => `text-${i}`);
    const result = await embedMany({ ...call, values, maxRetries: 0 });
    expect(result.embeddings).toHaveLength(25);
    const bodies: { input: string[] }[] = await Promise.all(
      requests.map((request) => request.json()),
    );
    expect(bodies.map((body) => body.input.length)).toEqual([10, 10, 5]);
    expect(bodies.flatMap((body) => body.input)).toEqual(values);
    expect(call.model).toMatchObject({
      maxEmbeddingsPerCall: 10,
      supportsParallelCalls: false,
    });
  });

  it('keeps Alibaba chat on the existing SDK and configured chat path', async () => {
    const model = languageModel(
      {
        provider: 'alibaba',
        baseUrl: 'https://alibaba.invalid/compatible-mode/v1',
        apiKey: 'fixture-key',
      },
      'fixture-chat',
    );
    expect(model).toMatchObject({ provider: 'alibaba.chat' });
    const result = await generateText({
      model,
      prompt: 'Hello.',
      maxRetries: 0,
    });
    expect(result.text).toBe('Chat unchanged.');
    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toBe(
      'https://alibaba.invalid/compatible-mode/v1/chat/completions',
    );
    expect(requests[0]!.headers.get('authorization')).toBe(
      'Bearer fixture-key',
    );
  });

  it('preserves the Alibaba SDK environment-key fallback', async () => {
    vi.stubEnv('ALIBABA_API_KEY', 'environment-fixture-key');
    const call = embeddingModel(
      {
        provider: 'alibaba',
        baseUrl: 'https://alibaba.invalid/compatible-mode/v1',
        apiKey: null,
      },
      'fixture-embedding',
      3,
    );
    await embedMany({ ...call, values: ['one', 'two'], maxRetries: 0 });
    expect(requests[0]!.headers.get('authorization')).toBe(
      'Bearer environment-fixture-key',
    );
  });

  it('fails before sending a request when neither a saved nor an environment key exists', () => {
    vi.stubEnv('ALIBABA_API_KEY', undefined);
    expect(() =>
      embeddingModel(
        { provider: 'alibaba', baseUrl: null, apiKey: null },
        'fixture-embedding',
        3,
      ),
    ).toThrow();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects a native response rather than silently changing protocol or relaxing validation', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      Response.json({
        output: { embeddings: [{ text_index: 0, embedding: [1, 0, 0] }] },
        usage: { total_tokens: 1 },
      }),
    );
    const call = embeddingModel(
      {
        provider: 'alibaba',
        baseUrl: 'https://alibaba.invalid/compatible-mode/v1',
        apiKey: 'fixture-key',
      },
      'fixture-embedding',
      3,
    );
    await expect(
      embedMany({ ...call, values: ['one'], maxRetries: 0 }),
    ).rejects.toThrow();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

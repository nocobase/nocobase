import { afterEach, expect, it, vi } from 'vitest';
import { convertToModelMessages, generateText } from 'ai';
import { resolveModelCapabilities } from '../server/online/search/capabilities.js';
import { NativeFileInputs } from '../server/online/files/service.js';
import { ModelCatalogServiceSchema } from '../server/routes/schemas.js';
import type { NativeMessage } from '../server/online/agent/types.js';
import { createHarness } from './harness.js';

const formats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const connection = { provider: 'deepseek' as const, baseUrl: null };
const modelId = 'deepseek-flash';
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
afterEach(() => vi.unstubAllGlobals());

it.each([null, 'https://api.deepseek.com', 'https://api.deepseek.com/'])(
  'declares exact DeepSeek Flash image formats on official endpoint %s without enabling search',
  (baseUrl) => {
    expect(
      resolveModelCapabilities({ ...connection, baseUrl }, modelId),
    ).toEqual({
      webSearch: false,
      imageMediaTypes: formats,
    });
  },
);

it.each([
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'deepseek-chat',
  'deepseek-reasoner',
  'DeepSeek-Flash',
  'deepseek-flash-preview',
  'unknown',
  '__proto__',
  'constructor',
])('does not infer image capability from the model name %s', (model) => {
  expect(resolveModelCapabilities(connection, model)).toEqual({
    webSearch: false,
  });
});

it.each([
  'https://gateway.example.invalid/v1',
  'http://api.deepseek.com',
  'https://api.deepseek.com/v1',
  'https://api.deepseek.com:8443',
  'https://api.deepseek.com.attacker.invalid',
  'https://user@api.deepseek.com',
  'https://api.deepseek.com?proxy=1',
  'https://api.deepseek.com#fragment',
  'not a URL',
])('does not grant images to an unverified endpoint %s', (baseUrl) => {
  expect(resolveModelCapabilities({ ...connection, baseUrl }, modelId)).toEqual(
    { webSearch: false },
  );
});

it.each(['embedding', 'rerank'] as const)(
  'does not grant image inputs to %s models',
  (kind) => {
    expect(resolveModelCapabilities(connection, modelId, kind)).toEqual({
      webSearch: false,
    });
  },
);

it('keeps the provider identity boundary and returns detached image format lists', () => {
  expect(
    resolveModelCapabilities(
      { provider: 'openai-compatible', baseUrl: 'https://api.deepseek.com' },
      modelId,
    ),
  ).toEqual({ webSearch: false });
  const first = resolveModelCapabilities(connection, modelId);
  const second = resolveModelCapabilities(connection, modelId);
  expect(first).toEqual(second);
  expect(first.imageMediaTypes).not.toBe(second.imageMediaTypes);
});

it('includes derived image capabilities in the model catalog response schema', async () => {
  const h = await createHarness();
  try {
    const service = await h.services.models.services.create({
      title: 'Renamed DeepSeek',
      provider: 'deepseek',
      apiKey: 'offline-fixture-key',
      models: [{ value: modelId }],
    });
    const catalog = await h.services.models.gateway.catalog();
    const found = catalog.services.find((item) => item.name === service.name)!;
    expect(
      ModelCatalogServiceSchema.parse(found).models[0].capabilities,
    ).toEqual({
      webSearch: false,
      imageMediaTypes: formats,
    });
  } finally {
    await h.close();
  }
});

it('uses shared capabilities for a renamed service and serializes PNG with the real DeepSeek SDK', async () => {
  const mediaType = 'image/png';
  const fetch = vi.fn<typeof globalThis.fetch>(async (url, init) => {
    expect(String(url)).toBe('https://api.deepseek.com/chat/completions');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${png}` },
            },
          ],
        },
      ],
    });
    return Response.json(
      { error: { message: 'Offline serialization fixture.' } },
      { status: 400 },
    );
  });
  vi.stubGlobal('fetch', fetch);
  const inputs = new NativeFileInputs({
    connectionFor: async () => ({
      ...connection,
      apiKey: 'offline-fixture-key',
    }),
  });
  const model = await inputs.model(
    { modelService: 'renamed-service', model: modelId },
    'fixture-session',
  );
  const original: NativeMessage[] = [
    {
      id: 'user',
      role: 'user',
      parts: [
        {
          type: 'file',
          filename: 'image',
          mediaType,
          url: `data:${mediaType};base64,${png}`,
        },
      ],
    },
  ];
  const replay = await inputs.prepare({
    model,
    snapshot: {
      original,
      replay: structuredClone(original),
      files: [{ messageId: 'user', partIndex: 0 }],
    },
    userId: 'alice',
    sessionId: 'fixture-session',
    signal: new AbortController().signal,
  });
  expect(replay[0].parts[0].type).toBe('file');
  await expect(
    generateText({
      model,
      messages: await convertToModelMessages(replay),
      maxRetries: 0,
    }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(fetch).toHaveBeenCalledOnce();
  expect(original[0].parts[0].type).toBe('file');
});

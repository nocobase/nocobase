import { readFileSync } from 'node:fs';
import type { FileInputsConfig } from '../server/online/files/types.js';
import { afterEach, expect, it, vi } from 'vitest';
import { convertToModelMessages, generateText } from 'ai';
import { NativeFileInputs } from '../server/online/files/service.js';
import type { NativeMessage } from '../server/online/agent/types.js';
import type { ModelConnection } from '../server/online/providers.js';

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const pdf = readFileSync(
  new URL('./fixtures/document-inputs/sample.pdf', import.meta.url),
).toString('base64');
const ref = { modelService: 'fixture', model: 'fixture-model' };

afterEach(() => vi.unstubAllGlobals());

async function prepare(
  provider: ModelConnection['provider'],
  mediaType: string,
  config?: FileInputsConfig,
  useWorker = false,
) {
  const extract = vi.fn(async () => ({
    status: 'ready' as const,
    markdown: 'local fixture text',
    hasText: true,
  }));
  const inputs = new NativeFileInputs({
    connectionFor: async () => ({
      provider,
      baseUrl: 'https://fixture.invalid/v1',
      apiKey: 'offline-fixture-key',
    }),
    config,
    extract: useWorker ? undefined : extract,
  });
  const model = await inputs.model(ref, 'fixture-session');
  const encoded = mediaType === 'application/pdf' ? pdf : png;
  const original: NativeMessage[] = [
    {
      id: 'fixture-user',
      role: 'user',
      parts: [
        { type: 'text', text: 'Read this fixture.' },
        {
          type: 'file',
          mediaType,
          filename:
            mediaType === 'application/pdf' ? 'fixture.pdf' : 'fixture.png',
          url: `data:${mediaType};base64,${encoded}`,
        },
      ],
    },
  ];
  const before = structuredClone(original);
  const replay = await inputs.prepare({
    model,
    snapshot: {
      original,
      replay: structuredClone(original),
      files: [{ messageId: 'fixture-user', partIndex: 1 }],
    },
    userId: 'alice',
    sessionId: 'fixture-session',
    signal: new AbortController().signal,
  });
  expect(original).toEqual(before);
  return { model, replay, extract, encoded };
}

function capture() {
  const requests: { url: string; body: unknown }[] = [];
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    // Deliberately stop after serialization; this does not simulate model acceptance.
    return Response.json(
      { error: { message: 'Offline serialization fixture.' } },
      { status: 400 },
    );
  });
  vi.stubGlobal('fetch', fetch);
  return { requests, fetch };
}

it.each([
  'openai',
  'anthropic',
  'google',
  'openai-compatible',
  'alibaba',
  'moonshotai',
  'ollama',
] as const)(
  '%s forwards PNG bytes through the real SDK without a profile or extraction request',
  async (provider) => {
    const { requests, fetch } = capture();
    const { model, replay, extract } = await prepare(provider, 'image/png');
    expect(replay[0]!.parts[1]?.type).toBe('file');
    expect(extract).not.toHaveBeenCalled();
    await expect(
      generateText({
        model,
        messages: await convertToModelMessages(replay),
        maxRetries: 0,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(fetch).toHaveBeenCalledOnce();
    expect(requests[0]!.url).toMatch(/^https:\/\/fixture\.invalid\//);
    expect(requests[0]!.url).not.toContain('/files');
    expect(JSON.stringify(requests[0]!.body)).toContain(png);
    expect(JSON.stringify(requests[0]!.body)).not.toContain('file-extract');
  },
);

it.each(['openai', 'anthropic', 'google', 'openai-compatible'] as const)(
  '%s serializes a PDF original through the real SDK rather than extracting text',
  async (provider) => {
    const { requests, fetch } = capture();
    const { model, replay, extract } = await prepare(
      provider,
      'application/pdf',
    );
    expect(replay[0]!.parts[1]?.type).toBe('file');
    expect(extract).not.toHaveBeenCalled();
    await expect(
      generateText({
        model,
        messages: await convertToModelMessages(replay),
        maxRetries: 0,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.stringify(requests[0]!.body)).toContain(pdf);
    expect(JSON.stringify(requests[0]!.body)).not.toContain(
      'local fixture text',
    );
  },
);

it('extracts Ollama PDF locally and sends its text through the real SDK', async () => {
  const { fetch, requests } = capture();
  const { model, replay, extract } = await prepare('ollama', 'application/pdf');
  expect(extract).toHaveBeenCalledOnce();
  expect(replay[0]!.parts[1]).toMatchObject({
    type: 'text',
    text: expect.stringContaining('local fixture text'),
  });
  await expect(
    generateText({
      model,
      messages: await convertToModelMessages(replay),
      maxRetries: 0,
    }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(fetch).toHaveBeenCalledOnce();
  expect(requests[0]!.body).toMatchObject({
    messages: [
      { role: 'user', content: expect.stringContaining('local fixture text') },
    ],
  });
  expect(JSON.stringify(requests[0]!.body)).not.toContain(pdf);
});

it.each(['alibaba', 'deepseek', 'cohere'] as const)(
  '%s still extracts PDF text locally',
  async (provider) => {
    const { fetch } = capture();
    const { replay, extract } = await prepare(provider, 'application/pdf');
    expect(replay[0]!.parts[1]).toMatchObject({
      type: 'text',
      text: expect.stringContaining('local fixture text'),
    });
    expect(extract).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  },
);

it('uses the real shared Worker for Ollama PDF and sends only extracted user text', async () => {
  const { fetch, requests } = capture();
  const { model, replay, extract } = await prepare(
    'ollama',
    'application/pdf',
    undefined,
    true,
  );
  expect(extract).not.toHaveBeenCalled();
  expect(replay[0]!.parts[1]).toMatchObject({
    type: 'text',
    text: expect.stringContaining('quokka pdf marker'),
  });
  await expect(
    generateText({
      model,
      messages: await convertToModelMessages(replay),
      maxRetries: 0,
    }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(fetch).toHaveBeenCalledOnce();
  expect(requests[0]!.body).toMatchObject({
    messages: [
      { role: 'user', content: expect.stringContaining('quokka pdf marker') },
    ],
  });
  expect(JSON.stringify(requests[0]!.body)).not.toContain(pdf);
});
it('describes an explicit Ollama PDF-original override instead of silently omitting it or extracting by fallback', async () => {
  const { fetch, requests } = capture();
  const { model, replay, extract } = await prepare(
    'ollama',
    'application/pdf',
    {
      profiles: [
        {
          ...ref,
          provider: 'ollama',
          protocol: 'ollama-chat',
          baseUrl: 'https://fixture.invalid/v1',
          nativeMediaTypes: ['application/pdf'],
          extraction: 'local',
        },
      ],
    },
  );
  expect(extract).not.toHaveBeenCalled();
  expect(replay[0]!.parts[1]).toMatchObject({
    type: 'text',
    text: expect.stringContaining('Attachment not parsed'),
  });
  await expect(
    generateText({
      model,
      messages: await convertToModelMessages(replay),
      maxRetries: 0,
    }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(fetch).toHaveBeenCalledOnce();
  expect(JSON.stringify(requests[0]!.body)).toContain('Attachment not parsed');
  expect(JSON.stringify(requests[0]!.body)).not.toContain(pdf);
});

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NativeFileInputs } from '@nocobase/app-plugin-agents/server';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';
import type { AppUIMessage } from '@nocobase/app-plugin-agents/shared/online-agent';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { convertToModelMessages, generateText } from 'ai';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import appRuntime from '../../server/runtime.ts';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const ref = { modelService: 'deepseek', model: 'deepseek-flash' };
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
let directory: string;
let config: AgentsConfig;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'examples-file-inputs-'));
  const configPath = path.join(directory, 'config.yml');
  await writeFile(configPath, '{}');
  const runtime = await resolveStandaloneAppRuntime(appRuntime, {
    rootDir,
    configPath,
    env: { AUTH_SECRET: 'fixture-auth-secret-at-least-32-characters' },
  });
  config = runtime.config.get<AgentsConfig>('agents')!;
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

const createInputs = (baseUrl: string | null = null) =>
  new NativeFileInputs({
    config: config.fileInputs,
    connectionFor: async () => ({
      provider: 'deepseek',
      baseUrl,
      apiKey: 'offline-fixture-key',
    }),
  });

async function prepare(
  files: NativeFileInputs,
  selected = ref,
  mediaType = 'image/png',
) {
  const model = await files.model(selected, 'fixture-session');
  const original: AppUIMessage[] = [
    {
      id: 'fixture-user',
      role: 'user',
      parts: [
        { type: 'text', text: 'Describe the fixture image.' },
        {
          type: 'file',
          mediaType,
          filename: 'fixture.png',
          url: `data:${mediaType};base64,${png}`,
        },
      ],
    },
  ];
  const prepared = await files.prepare({
    model,
    snapshot: {
      original,
      replay: structuredClone(original),
      files: [{ messageId: 'fixture-user', partIndex: 1 }],
    },
    userId: 'fixture-user',
    sessionId: 'fixture-session',
    signal: new AbortController().signal,
  });
  expect(original[0]!.parts[1]).toEqual({
    type: 'file',
    mediaType,
    filename: 'fixture.png',
    url: `data:${mediaType};base64,${png}`,
  });
  return { model, prepared };
}

it('inherits shared Provider capabilities without declaring an application image profile', () => {
  expect(config.fileInputs).toBeUndefined();
});

it('serializes the prepared PNG with the real DeepSeek SDK without any external request', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    expect(String(input)).toBe('https://api.deepseek.com/chat/completions');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: 'deepseek-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe the fixture image.' },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${png}` },
            },
          ],
        },
      ],
    });
    return Response.json({
      id: 'fixture-response',
      object: 'chat.completion',
      created: 1,
      model: 'deepseek-flash',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Fixture received.' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });
  });
  vi.stubGlobal('fetch', fetch);
  const { model, prepared } = await prepare(createInputs());
  const result = await generateText({
    model,
    messages: await convertToModelMessages(prepared),
    maxRetries: 0,
  });
  expect(result.text).toBe('Fixture received.');
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('inherits DeepSeek Flash images independently of the service name', async () => {
  const { prepared } = await prepare(createInputs(), {
    ...ref,
    modelService: 'renamed-service',
  });
  expect(prepared[0]!.parts[1].type).toBe('file');
});

it.each([
  { modelService: 'deepseek', model: 'deepseek-v4-pro' },
  { modelService: 'deepseek', model: 'deepseek-v4-flash' },
])(
  'does not grant images to an unconfigured identity $modelService/$model',
  async (selected) => {
    const { prepared } = await prepare(createInputs(), selected);
    expect(prepared[0]!.parts[1]).toMatchObject({
      type: 'text',
      text: expect.stringContaining('Image input is not configured'),
    });
    expect(JSON.stringify(prepared)).toContain('Attachment not parsed');
    expect(JSON.stringify(prepared)).not.toContain(png);
  },
);

it('does not grant image types outside the documented allowlist', async () => {
  const { prepared } = await prepare(createInputs(), ref, 'image/tiff');
  expect(prepared[0]!.parts[1]).toMatchObject({
    type: 'text',
    text: expect.stringContaining('Image input is not configured'),
  });
  expect(JSON.stringify(prepared)).toContain('Attachment not parsed');
  expect(JSON.stringify(prepared)).not.toContain(png);
});

it('does not reuse official image capabilities on a custom endpoint', async () => {
  const { prepared } = await prepare(
    createInputs('https://gateway.example.invalid/v1'),
  );
  expect(prepared[0]!.parts[1]).toMatchObject({
    type: 'text',
    text: expect.stringContaining('Attachment not parsed'),
  });
  expect(JSON.stringify(prepared)).not.toContain(png);
});

it('lets deployment policy explicitly disable shared image forwarding', async () => {
  const configPath = path.join(directory, 'disabled.yml');
  await writeFile(
    configPath,
    [
      'agents:',
      '  fileInputs:',
      '    profiles:',
      '      - modelService: deepseek',
      '        model: deepseek-flash',
      '        provider: deepseek',
      '        protocol: chat-completions',
      '        baseUrl: https://api.deepseek.com',
      '        nativeMediaTypes: []',
      '        extraction: local',
      '        maxNativeFiles: 0',
      '',
    ].join('\n'),
  );
  const runtime = await resolveStandaloneAppRuntime(appRuntime, {
    rootDir,
    configPath,
    env: { AUTH_SECRET: 'fixture-auth-secret-at-least-32-characters' },
  });
  const inputs = new NativeFileInputs({
    config: runtime.config.get<AgentsConfig>('agents')?.fileInputs,
    connectionFor: async () => ({
      provider: 'deepseek',
      baseUrl: null,
      apiKey: 'offline-fixture-key',
    }),
  });
  const { prepared } = await prepare(inputs);
  expect(prepared[0]!.parts[1]).toMatchObject({
    type: 'text',
    text: expect.stringContaining('Attachment not parsed'),
  });
  expect(JSON.stringify(prepared)).not.toContain(png);
});

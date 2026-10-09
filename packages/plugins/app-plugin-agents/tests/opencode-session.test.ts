/**
 * The session header OpenCode Zen and Go require (`x-opencode-session`): a call to an OpenCode base URL carries it
 * automatically — the conversation's session id, or a new one for a call outside any — and a call to any other base
 * URL carries none. A local OpenAI-compatible server stands in for the provider, with requests to OpenCode's hosts
 * redirected to it, and refuses a call without the header the way OpenCode Go does.
 */
import { generateText } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import packageMetadata from '../package.json' with { type: 'json' };
import {
  isOpenCodeUrl,
  type CreateModelServiceRequest,
} from '../shared/models.js';
import { createModelGateway } from '../server/online/index.js';
import { headersOf } from '../server/online/providers.js';
import { createHarness, type Harness } from './harness.js';
import { startMockOpenAI, type MockOpenAI } from './mock-openai.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

const USER_AGENT = new RegExp(
  `^nocobase-agents/${packageMetadata.version.replaceAll('.', '\\.')}`,
  'u',
);

/**
 * Sends every request to an OpenCode host to the local mock instead, the way an application pointed at
 * `https://opencode.ai/zen/go/v1` reaches it; returns a function that stops redirecting.
 */
function redirectOpenCode(mock: MockOpenAI): () => void {
  const real = globalThis.fetch;
  const target = new URL(mock.url);
  const spy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation((input, init) => {
      const url = new URL(
        input instanceof Request
          ? input.url
          : input instanceof URL
            ? input.href
            : input,
      );
      if (
        url.hostname !== 'opencode.ai' &&
        !url.hostname.endsWith('.opencode.ai')
      )
        return real(input as RequestInfo, init);
      const rewritten = `${target.origin}${url.pathname}${url.search}`;
      if (input instanceof Request) {
        const copy = input.clone();
        return real(
          new Request(rewritten, {
            method: copy.method,
            headers: copy.headers,
            body: copy.body,
            signal: copy.signal,
            duplex: 'half',
          } as RequestInit),
        );
      }
      return real(rewritten, init);
    });
  return () => spy.mockRestore();
}

describe('the OpenCode session header', () => {
  let h: Harness;
  let mock: MockOpenAI;

  beforeEach(async () => {
    mock = await startMockOpenAI();
    h = await createHarness();
  });
  afterEach(async () => {
    await h.close();
    await mock.close();
  });

  const service = (
    extra: Partial<CreateModelServiceRequest> = {},
  ): CreateModelServiceRequest => ({
    title: 'Team',
    provider: 'openai-compatible',
    baseUrl: mock.url,
    apiKey: 'test-key',
    models: [{ value: 'mock-model' }],
    ...extra,
  });

  const last = () => mock.seen.at(-1)?.headers ?? {};

  it('adds the session header for an OpenCode base URL alone', () => {
    const connection = {
      provider: 'openai-compatible' as const,
      baseUrl: 'https://opencode.ai/zen/go/v1',
      apiKey: null,
    };
    expect(headersOf(connection, 'conversation-session')).toEqual({
      'x-opencode-session': 'conversation-session',
    });
    expect(headersOf(connection)).toMatchObject({
      'x-opencode-session': expect.stringMatching(UUID),
    });
    expect(headersOf({ ...connection, baseUrl: mock.url })).toEqual({});
  });

  it('sends a conversation’s session id to an OpenCode base URL, and a new one to each call outside any', async () => {
    const services = h.services.online.services;
    await services.create(service());
    const gateway = createModelGateway(services, { maxRetries: 0 });
    mock.answer({ text: ['ok'] });

    // Any other base URL sends no session header, and every request names the plugin.
    await services.check({ service: 'team', model: 'mock-model' });
    expect(last()).not.toHaveProperty('x-opencode-session');
    expect(last()['user-agent']).toMatch(USER_AGENT);

    await services.update('team', {
      baseUrl: 'https://opencode.ai/zen/go/v1',
    });
    const stop = redirectOpenCode(mock);
    try {
      const model = await gateway.languageModel(
        { modelService: 'team', model: 'mock-model' },
        { session: 'conversation-session' },
      );
      await generateText({ model, prompt: 'One', maxRetries: 0 });
      await generateText({ model, prompt: 'Two', maxRetries: 0 });
      const sessions = mock.seen
        .slice(-2)
        .map((request) => request.headers['x-opencode-session']);
      expect(sessions).toEqual([
        'conversation-session',
        'conversation-session',
      ]);
      expect(last()['user-agent']).toMatch(USER_AGENT);

      // Outside any conversation, every call gets a new session id.
      await services.check({ service: 'team', model: 'mock-model' });
      const first = last()['x-opencode-session'];
      await services.check({ service: 'team', model: 'mock-model' });
      expect(first).toMatch(UUID);
      expect(last()['x-opencode-session']).toMatch(UUID);
      expect(last()['x-opencode-session']).not.toBe(first);
    } finally {
      stop();
    }
  });

  it('satisfies OpenCode by itself, and shows the provider’s reason verbatim when it cannot', async () => {
    const services = h.services.online.services;
    mock.requireHeader('x-opencode-session');
    await services.create(service());
    // A plain base URL gets no header: the provider's own words reach the caller unchanged.
    expect(
      await services.check({ service: 'team', model: 'mock-model' }),
    ).toEqual({
      ok: false,
      message:
        'Request is missing x-opencode-session and cannot be routed efficiently.',
    });

    // An OpenCode base URL needs no setting: the server sends a session id.
    const stop = redirectOpenCode(mock);
    try {
      await services.update('team', {
        baseUrl: 'https://opencode.ai/zen/go/v1',
      });
      mock.answer({ text: ['ok'] });
      expect(
        await services.check({ service: 'team', model: 'mock-model' }),
      ).toEqual({ ok: true, message: null });
      expect(last()['x-opencode-session']).toMatch(UUID);
    } finally {
      stop();
    }
  });

  it('knows OpenCode’s base URLs', () => {
    expect(isOpenCodeUrl('https://opencode.ai/zen/go/v1')).toBe(true);
    expect(isOpenCodeUrl('https://api.opencode.ai/v1')).toBe(true);
    expect(isOpenCodeUrl('https://notopencode.ai/v1')).toBe(false);
    expect(isOpenCodeUrl('not a url')).toBe(false);
    expect(isOpenCodeUrl(null)).toBe(false);
  });
});

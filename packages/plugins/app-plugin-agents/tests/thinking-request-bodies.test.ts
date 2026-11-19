import { afterEach, expect, it, vi } from 'vitest';
import { streamText } from 'ai';
import { languageModel } from '../server/online/providers.js';
import { thinkingWarnings } from '../server/online/agent/thinking.js';
import {
  REASONING_LEVELS,
  type ModelProviderName,
  type ReasoningLevel,
} from '../shared/models.js';

afterEach(() => vi.unstubAllGlobals());

/** The JSON body the provider package sends for one call at `level`; the stubbed provider answers 400. */
async function bodyFor(
  provider: ModelProviderName,
  model: string,
  level: ReasoningLevel,
  baseUrl: string | null = null,
): Promise<Record<string, unknown>> {
  const bodies: Record<string, unknown>[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: unknown, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(
        JSON.stringify({ error: { message: 'stub', type: 'invalid' } }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }),
  );
  const result = streamText({
    model: languageModel({ provider, baseUrl, apiKey: 'offline-key' }, model),
    prompt: 'Hi',
    reasoning: level,
    maxRetries: 0,
    onError: () => undefined,
  });
  await result.consumeStream();
  expect(bodies).toHaveLength(1);
  return bodies[0]!;
}

const cases: {
  provider: ModelProviderName;
  model: string;
  off: Record<string, unknown>;
  on: { level: ReasoningLevel; body: Record<string, unknown> };
  absent: readonly string[];
}[] = [
  {
    provider: 'openai',
    model: 'gpt-5.6-terra',
    off: { reasoning: expect.objectContaining({ effort: 'none' }) },
    on: {
      level: 'xhigh',
      body: { reasoning: expect.objectContaining({ effort: 'xhigh' }) },
    },
    absent: ['reasoning'],
  },
  {
    provider: 'anthropic',
    model: 'claude-opus-4-7',
    off: { thinking: { type: 'disabled' } },
    on: {
      level: 'xhigh',
      body: {
        thinking: expect.objectContaining({ type: 'adaptive' }),
        output_config: expect.objectContaining({ effort: 'xhigh' }),
      },
    },
    absent: ['thinking', 'output_config'],
  },
  {
    provider: 'deepseek',
    model: 'deepseek-flash',
    off: { thinking: { type: 'disabled' } },
    on: {
      level: 'xhigh',
      body: { thinking: { type: 'enabled' }, reasoning_effort: 'max' },
    },
    absent: ['thinking', 'reasoning_effort'],
  },
  {
    provider: 'alibaba',
    model: 'qwen3.8-flash',
    off: { enable_thinking: false },
    on: { level: 'provider-default', body: {} },
    absent: ['enable_thinking', 'thinking_budget'],
  },
  {
    provider: 'google',
    model: 'gemini-2.5-flash',
    off: {
      generationConfig: expect.objectContaining({
        thinkingConfig: expect.objectContaining({ thinkingBudget: 0 }),
      }),
    },
    on: {
      level: 'provider-default',
      body: {},
    },
    absent: [],
  },
  {
    provider: 'google',
    model: 'gemini-4-carbon',
    off: {},
    on: {
      level: 'high',
      body: {
        generationConfig: expect.objectContaining({
          thinkingConfig: expect.objectContaining({ thinkingLevel: 'high' }),
        }),
      },
    },
    absent: [],
  },
];

it.each(cases)(
  'sends $provider $model the level it was given, turned into the provider’s parameter',
  async ({ provider, model, off, on, absent }) => {
    if (Object.keys(off).length)
      expect(await bodyFor(provider, model, 'none')).toMatchObject(off);
    if (on.level !== 'provider-default')
      expect(await bodyFor(provider, model, on.level)).toMatchObject(on.body);
    const defaults = await bodyFor(provider, model, 'provider-default');
    for (const key of absent) expect(defaults).not.toHaveProperty(key);
    expect(
      (defaults.generationConfig as Record<string, unknown> | undefined)
        ?.thinkingConfig,
    ).toBeUndefined();
  },
);

it('passes every level on for a model id no list names, over an OpenAI-compatible endpoint too', async () => {
  for (const level of REASONING_LEVELS.slice(2))
    expect(
      await bodyFor('openai', 'gpt-5.6-terra-2026-11-01', level),
    ).toMatchObject({ reasoning: expect.objectContaining({ effort: level }) });
  expect(
    await bodyFor(
      'openai-compatible',
      'my-alias',
      'high',
      'https://example.test/v1',
    ),
  ).toMatchObject({ reasoning_effort: 'high' });
});

const completion = {
  id: 'stub',
  object: 'chat.completion',
  created: 1,
  model: 'stub',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: 'ok' },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

/** One call at `level` the stubbed provider answers; the JSON body it was sent and the SDK's warnings. */
async function answeredCall(
  provider: ModelProviderName,
  model: string,
  level: ReasoningLevel,
) {
  const bodies: Record<string, unknown>[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: unknown, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(JSON.stringify(completion), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
  const result = streamText({
    model: languageModel(
      { provider, baseUrl: null, apiKey: 'offline-key' },
      model,
    ),
    prompt: 'Hi',
    reasoning: level,
    maxRetries: 0,
  });
  await result.consumeStream();
  expect(bodies).toHaveLength(1);
  return { body: bodies[0]!, warnings: await result.warnings };
}

it.each([
  { level: 'xhigh', effort: 'max' },
  { level: 'medium', effort: 'high' },
] as const)(
  'sends DeepSeek $level as its own $effort and reports no thinking warning for the SDK’s compatibility warning',
  async ({ level, effort }) => {
    const { body, warnings } = await answeredCall(
      'deepseek',
      'deepseek-flash',
      level,
    );
    expect(body).toMatchObject({
      thinking: { type: 'enabled' },
      reasoning_effort: effort,
    });
    expect(warnings).toEqual([
      expect.objectContaining({ type: 'compatibility', feature: 'reasoning' }),
    ]);
    expect(thinkingWarnings(warnings)).toBeUndefined();
  },
);

it('reports Moonshot’s unsupported warning about a level as the notice’s details', async () => {
  const { warnings } = await answeredCall(
    'moonshotai',
    'moonshot-v1-8k',
    'high',
  );
  const found = warnings.find(
    (warning) =>
      warning.type === 'unsupported' && warning.feature === 'reasoning',
  );
  expect(found).toBeDefined();
  expect(thinkingWarnings(warnings)).toBe(
    (found as { details: string }).details,
  );
});

it('reports Moonshot’s warning that a model it does not know cannot turn thinking off', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(completion), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );
  const result = streamText({
    model: languageModel(
      { provider: 'moonshotai', baseUrl: null, apiKey: 'offline-key' },
      'custom-kimi',
    ),
    prompt: 'Hi',
    reasoning: 'none',
    maxRetries: 0,
  });
  await result.consumeStream();
  const warnings = await result.warnings;
  const found = warnings.find(
    (warning) =>
      warning.type === 'unsupported' && warning.feature === 'reasoning "none"',
  );
  expect(found).toBeDefined();
  expect(thinkingWarnings(warnings)).toContain(
    (found as { details: string }).details,
  );
});

it('leaves out a warning about another feature even when the model ID names thinking', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(completion), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );
  // streamText refuses system messages, so call the provider package's model directly with a dynamic-tool one.
  const { warnings } = await languageModel(
    { provider: 'moonshotai', baseUrl: null, apiKey: 'offline-key' },
    'moonshot-v1-thinking',
  ).doGenerate({
    prompt: [
      {
        role: 'system',
        content: '',
        providerOptions: {
          moonshotai: {
            tools: [
              {
                type: 'function',
                name: 'lookup',
                inputSchema: { type: 'object', properties: {} },
              },
            ],
          },
        },
      },
      { role: 'user', content: [{ type: 'text', text: 'Hi' }] },
    ],
    reasoning: 'provider-default',
  });
  expect(warnings).toEqual([
    expect.objectContaining({
      type: 'unsupported',
      feature: 'dynamic tool loading for model "moonshot-v1-thinking"',
    }),
  ]);
  expect(thinkingWarnings(warnings)).toBeUndefined();
});

// Features the locked provider packages report; an unsupported warning about a thinking one is counted, the others are
// not, and a compatibility warning never is.
it.each([
  ['reasoning', true],
  ['reasoning "none"', true],
  ['reasoningEffort', true],
  ['reasoningHistory \'preserved\' is not supported by model "kimi-k2"', true],
  ['thinking', true],
  ['thinking.type "disabled"', true],
  ['extended thinking', true],
  ['providerOptions.anthropic.thinking', true],
  ['provider-defined tool custom.thinking_search', false],
  ['dynamic tool loading for model "moonshot-v1-thinking"', false],
  ['providerOptions.anthropic.effort', false],
  ['temperature', false],
] as const)(
  'counts a warning about %s as a thinking warning: %s',
  (feature, counted) => {
    expect(
      thinkingWarnings([{ type: 'unsupported', feature, details: 'why' }]),
    ).toBe(counted ? 'why' : undefined);
    expect(
      thinkingWarnings([{ type: 'compatibility', feature, details: 'why' }]),
    ).toBeUndefined();
  },
);

it('uses only the unsupported warning about thinking when a compatibility one comes with it', () => {
  expect(
    thinkingWarnings([
      {
        type: 'compatibility',
        feature: 'reasoning',
        details: 'mapped to effort "max".',
      },
      {
        type: 'unsupported',
        feature: 'provider-defined tool custom.thinking_search',
        details: 'tool left out.',
      },
      {
        type: 'unsupported',
        feature: 'reasoning "none"',
        details: 'cannot turn thinking off.',
      },
    ]),
  ).toBe('cannot turn thinking off.');
});

it('fails the call as usual when the provider refuses the level, without trying another', async () => {
  const fetch = vi.fn(
    async () =>
      new Response(
        JSON.stringify({ error: { message: 'stub', type: 'invalid' } }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
  );
  vi.stubGlobal('fetch', fetch);
  const errors: unknown[] = [];
  const result = streamText({
    model: languageModel(
      { provider: 'openai', baseUrl: null, apiKey: 'offline-key' },
      'gpt-6-astra',
    ),
    prompt: 'Hi',
    reasoning: 'none',
    maxRetries: 0,
    onError: ({ error }) => void errors.push(error),
  });
  await result.consumeStream();
  expect(errors).toHaveLength(1);
  expect(fetch).toHaveBeenCalledTimes(1);
});

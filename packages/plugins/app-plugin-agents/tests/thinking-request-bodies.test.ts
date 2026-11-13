import { afterEach, expect, it, vi } from 'vitest';
import { streamText } from 'ai';
import { reasoningOf } from '../server/online/gateway.js';
import { languageModel } from '../server/online/providers.js';
import { builtinReasoning } from '../server/online/capabilities.js';
import type { ModelProviderName } from '../shared/models.js';

afterEach(() => vi.unstubAllGlobals());

/** The JSON body the provider package sends for one call at `level`; the stubbed provider answers 400. */
async function bodyFor(
  provider: ModelProviderName,
  model: string,
  level: string,
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
    model: languageModel(
      { provider, baseUrl: null, apiKey: 'offline-key' },
      model,
    ),
    prompt: 'Hi',
    reasoning: reasoningOf(level),
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
  on: { level: string; body: Record<string, unknown> };
  absent: readonly string[];
}[] = [
  {
    provider: 'openai',
    model: 'gpt-5.6-terra',
    off: { reasoning: expect.objectContaining({ effort: 'none' }) },
    on: {
      level: 'max',
      body: { reasoning: expect.objectContaining({ effort: 'max' }) },
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
    on: { level: 'default', body: {} },
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
      level: 'default',
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
  'sends $provider $model the levels its built-in list declares',
  async ({ provider, model, off, on, absent }) => {
    const levels = builtinReasoning(provider, model)?.levels ?? [];
    if (levels.includes('off'))
      expect(await bodyFor(provider, model, 'off')).toMatchObject(off);
    else expect(Object.keys(off)).toEqual([]);
    if (on.level !== 'default') {
      expect(levels).toContain(on.level);
      expect(await bodyFor(provider, model, on.level)).toMatchObject(on.body);
    }
    const defaults = await bodyFor(provider, model, 'default');
    for (const key of absent) expect(defaults).not.toHaveProperty(key);
    expect(
      (defaults.generationConfig as Record<string, unknown> | undefined)
        ?.thinkingConfig,
    ).toBeUndefined();
  },
);

it('declares only default for a model id it does not know exactly', () => {
  expect(
    builtinReasoning('openai', 'gpt-5.6-terra-2026-11-01'),
  ).toBeUndefined();
  expect(builtinReasoning('anthropic', 'Claude-Opus-4-7')).toBeUndefined();
  expect(
    builtinReasoning('openai-compatible', 'gpt-5.6-terra'),
  ).toBeUndefined();
  expect(builtinReasoning('google', '__proto__')).toBeUndefined();
});

import { describe, expect, it } from 'vitest';

import {
  agentNameOf,
  catalogEntry,
  modelLabel,
  normalizeModel,
  sameModel,
  agentModelOf,
  agentNameFor,
  shownAgentNames,
} from '../shared/model-catalog.js';

describe('the model catalog', () => {
  it('normalizes what runners report into the id an agent keeps', () => {
    expect(normalizeModel('claude', 'claude-haiku-4-5-20251001')).toBe(
      'claude-haiku-4-5',
    );
    expect(normalizeModel('claude', 'opus')).toBe('claude-opus-5-5');
    expect(normalizeModel('claude', ' Sonnet ')).toBe('claude-sonnet-5');
    expect(normalizeModel('codex', 'gpt-6-sol')).toBe('gpt-6-sol');
    // Versions are never folded together.
    expect(sameModel('codex', 'gpt-6-sol', 'gpt-6.1-sol')).toBe(false);
    // OpenCode and Pi keep the provider and the case they list a model under.
    expect(normalizeModel('opencode', 'anthropic/opus')).toBe(
      'anthropic/claude-opus-5-5',
    );
    expect(normalizeModel('pi', 'minimax/MiniMax-M2.7')).toBe(
      'minimax/MiniMax-M2.7',
    );
    expect(normalizeModel('opencode', 'alibaba-cn/kimi/kimi-k2.5')).toBe(
      'alibaba-cn/kimi/kimi-k2.5',
    );
    expect(normalizeModel('codex', 'gpt-6-luna-latest')).toBe('gpt-6-luna');
  });

  it('names an agent after its tool and model, known or not', () => {
    expect(agentNameOf('claude', 'claude-opus-5-5')).toBe('Claude · Opus 5.5');
    expect(agentNameOf('codex', 'gpt-6.1-sol')).toBe('Codex · GPT-6.1 Sol');
    // The design's examples: a model the catalog does not know gets a readable name, for every tool.
    expect(agentNameOf('opencode', 'my-lan-gateway/qwen3.8-flash')).toBe(
      'OpenCode · Qwen3.8 Flash',
    );
    expect(agentNameOf('opencode', 'opencode/deepseek-v4.1-flash-free')).toBe(
      'OpenCode · DeepSeek V4.1 Flash Free',
    );
    expect(agentNameOf('codex', 'gpt-6.2-astra')).toBe('Codex · GPT-6.2 Astra');
    expect(agentNameOf('pi', 'qwen/qwen3-coder')).toBe('Pi · Qwen3 Coder');
    expect(modelLabel('opencode', 'moonshotai/kimi-k2')).toBe('Kimi K2');
    // A catalog model reached through a provider keeps the catalog's label.
    expect(agentNameOf('opencode', 'openai/gpt-6-astra')).toBe(
      'OpenCode · GPT-6 Astra',
    );
    expect(modelLabel('pi', 'anthropic/claude-opus-5-5-20261001')).toBe(
      'Opus 5.5',
    );
  });

  it('writes abbreviations, brands and versions the way the catalog does', () => {
    expect(modelLabel('opencode', 'zai/glm-5.1')).toBe('GLM-5.1');
    expect(modelLabel('opencode', 'openai/gpt-oss-120b')).toBe('GPT-OSS-120B');
    expect(modelLabel('opencode', 'qwen/qwen3-vl-plus')).toBe('Qwen3 VL Plus');
    expect(modelLabel('codex', 'o3-mini')).toBe('o3 Mini');
    expect(modelLabel('claude', 'claude-opus-4-7')).toBe('Opus 4.7');
    // A word written with capitals keeps them, and an underscore splits like a hyphen.
    expect(modelLabel('pi', 'minimax/MiniMax-M2.7')).toBe('MiniMax M2.7');
    expect(modelLabel('codex', 'my_custom_model')).toBe('My Custom Model');
    expect(modelLabel('codex', 'my-org/custom-model')).toBe('Custom Model');
    expect(modelLabel('codex', 'gemini-9-pro')).toBe('Gemini 9 Pro');
    expect(agentNameOf('codex', 'gpt-x', 'GPT X')).toBe('Codex · GPT X');
  });

  it('keeps the names of catalog models', () => {
    expect(modelLabel('claude', 'claude-opus-5-5')).toBe('Opus 5.5');
    expect(modelLabel('claude', 'opus')).toBe('Opus 5.5');
    expect(modelLabel('codex', 'gpt-6-astra')).toBe('GPT-6 Astra');
    expect(modelLabel('codex', 'gpt-4o-2024-05-13')).toBe(
      'GPT-4o (2024-05-13)',
    );
    expect(modelLabel('codex', 'o1')).toBe('o1');
  });

  it('tells two providers of one model apart by the provider, not a number', () => {
    const taken = new Set<string>();
    const names = [
      'my-lan-gateway/qwen3.8-flash',
      'opencode/qwen3.8-flash',
    ].map((model) => {
      const name = agentNameFor('opencode', model, (n) => taken.has(n));
      taken.add(name!);
      return name;
    });
    expect(names).toEqual([
      'OpenCode · Qwen3.8 Flash',
      'OpenCode · Qwen3.8 Flash (opencode)',
    ]);
    // OpenCode's own name for the model is not used: names are made the same way for every provider.
    expect(
      agentNameOf('opencode', 'my-lan-gateway/qwen3.8-flash', 'Qwen 3.8 Flash'),
    ).toBe('OpenCode · Qwen3.8 Flash');
    // Both taken, or a tool without providers: the caller numbers it.
    expect(
      agentNameFor('opencode', 'opencode/qwen3.8-flash', () => true),
    ).toBeNull();
    expect(
      agentNameFor(
        'codex',
        'gpt-6.2-astra',
        (n) => n === 'Codex · GPT-6.2 Astra',
      ),
    ).toBeNull();
  });

  it('suggests what a known model is good at, in English and Chinese', () => {
    expect(catalogEntry('codex', 'gpt-6-astra')?.goodAt).toEqual({
      en: 'Code review and reading CI failures.',
      zh: '代码评审、读 CI 失败。',
    });
    expect(catalogEntry('pi', 'anthropic/claude-sonnet-5')?.id).toBe(
      'claude-sonnet-5',
    );
    expect(catalogEntry('claude', 'claude-unknown')).toBeUndefined();
  });
});
it('names a provider-qualified Gemini model without its provider', () => {
  expect(modelLabel('pi', 'google/gemini-3.1-pro')).toBe('Gemini 3.1 Pro');
});

it('keeps ACP aliases, provider paths and dated ids as distinct opaque identities', () => {
  expect(normalizeModel('gemini', 'opus-latest')).toBe('opus-latest');
  // Only the label is made readable; the id is kept as reported.
  expect(modelLabel('gemini', 'vendor/Model (20261001)')).toBe(
    'Model (20261001)',
  );
});

describe('agentModelOf', () => {
  it('gives an OpenCode agent its whole id, its name without the tool and the hover text', () => {
    expect(
      agentModelOf({
        name: 'OpenCode · Qwen3.8 Flash (my-lan-gateway)',
        tool: 'opencode',
        model: 'my-lan-gateway/qwen3.8-flash',
      }),
    ).toEqual({
      model: 'my-lan-gateway/qwen3.8-flash',
      shortName: 'Qwen3.8 Flash (my-lan-gateway)',
      modelTitle: 'OpenCode · my-lan-gateway/qwen3.8-flash',
    });
  });

  it('keeps a renamed agent’s name whole', () => {
    expect(
      agentModelOf({
        name: 'Gateway fast',
        tool: 'pi',
        model: 'my-lan-gateway/qwen3.8-flash',
      }),
    ).toEqual({
      model: 'my-lan-gateway/qwen3.8-flash',
      modelTitle: 'Pi · my-lan-gateway/qwen3.8-flash',
    });
  });

  it('gives every tool its whole id, short name and hover text, catalog models and ACP tools included', () => {
    expect(
      agentModelOf({
        name: 'Codex · GPT-6.2 Astra',
        tool: 'codex',
        model: 'gpt-6.2-astra',
      }),
    ).toEqual({
      model: 'gpt-6.2-astra',
      shortName: 'GPT-6.2 Astra',
      modelTitle: 'Codex · gpt-6.2-astra',
    });
    expect(
      agentModelOf({
        name: agentNameOf('claude', 'claude-opus-5-5'),
        tool: 'claude',
        model: 'claude-opus-5-5',
      }),
    ).toEqual({
      model: 'claude-opus-5-5',
      shortName: 'Opus 5.5',
      modelTitle: 'Claude · claude-opus-5-5',
    });
    const gemini = agentNameOf('gemini', 'gemini-3.1-pro-preview');
    expect(gemini).toBe('Gemini CLI · Gemini 3.1 Pro Preview');
    expect(
      agentModelOf({
        name: gemini,
        tool: 'gemini',
        model: 'gemini-3.1-pro-preview',
      }),
    ).toEqual({
      model: 'gemini-3.1-pro-preview',
      shortName: 'Gemini 3.1 Pro Preview',
      modelTitle: 'Gemini CLI · gemini-3.1-pro-preview',
    });
  });
});

describe('shownAgentNames', () => {
  const agent = (id: string, name: string, model: string) => ({
    id,
    name,
    tool: 'opencode' as const,
    model,
  });

  it('shows both providers of one default-named model with their provider', () => {
    expect(
      shownAgentNames([
        agent('a', 'OpenCode · Qwen3.8 Flash', 'my-lan-gateway/qwen3.8-flash'),
        agent(
          'b',
          'OpenCode · Qwen3.8 Flash (opencode)',
          'opencode/qwen3.8-flash',
        ),
        agent('c', 'OpenCode · Kimi K2', 'moonshotai/kimi-k2'),
      ]),
    ).toEqual(
      // b's saved name already says its provider; c has no namesake.
      new Map([['a', 'OpenCode · Qwen3.8 Flash (my-lan-gateway)']]),
    );
    expect(
      shownAgentNames([
        agent('a', 'OpenCode · Qwen3.8 Flash', 'my-lan-gateway/qwen3.8-flash'),
        agent('b', 'OpenCode · Qwen3.8 Flash', 'opencode/qwen3.8-flash'),
      ]),
    ).toEqual(
      new Map([
        ['a', 'OpenCode · Qwen3.8 Flash (my-lan-gateway)'],
        ['b', 'OpenCode · Qwen3.8 Flash (opencode)'],
      ]),
    );
  });

  it('keeps a renamed agent and a model without a namesake as they are', () => {
    expect(
      shownAgentNames([
        agent('a', 'Gateway fast', 'my-lan-gateway/qwen3.8-flash'),
        agent('b', 'OpenCode · Qwen3.8 Flash', 'opencode/qwen3.8-flash'),
        {
          id: 'c',
          name: 'Claude · Opus 5.5',
          tool: 'claude',
          model: 'claude-opus-5-5',
        },
      ]),
    ).toEqual(new Map([['b', 'OpenCode · Qwen3.8 Flash (opencode)']]));
    expect(
      shownAgentNames([
        agent('a', 'OpenCode · Qwen3.8 Flash', 'my-lan-gateway/qwen3.8-flash'),
      ]),
    ).toEqual(new Map());
  });
});

import { describe, expect, it } from 'vitest';

import {
  agentNameOf,
  catalogEntry,
  modelLabel,
  normalizeModel,
  sameModel,
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
    expect(agentNameOf('opencode', 'openai/gpt-6-astra')).toBe(
      'OpenCode · openai/gpt-6-astra',
    );
    expect(agentNameOf('pi', 'qwen/qwen3-coder')).toBe('Pi · qwen/qwen3-coder');
    expect(modelLabel('opencode', 'moonshotai/kimi-k2')).toBe(
      'moonshotai/kimi-k2',
    );
  });

  it('keeps the provider apart for one model reached through two providers', () => {
    const models = ['opencode/qwen3.8-flash', 'my-lan-gateway/qwen3.8-flash'];
    expect(models.map((model) => modelLabel('opencode', model))).toEqual(
      models,
    );
    expect(models.map((model) => agentNameOf('opencode', model))).toEqual([
      'OpenCode · opencode/qwen3.8-flash',
      'OpenCode · my-lan-gateway/qwen3.8-flash',
    ]);
    // OpenCode's own name for the model drops the provider, so it does not name the agent.
    expect(
      agentNameOf('opencode', 'my-lan-gateway/qwen3.8-flash', 'Qwen3.8 Flash'),
    ).toBe('OpenCode · my-lan-gateway/qwen3.8-flash');
    expect(modelLabel('pi', 'anthropic/claude-opus-5-5-20261001')).toBe(
      'anthropic/claude-opus-5-5',
    );
  });

  it('keeps single-provider tools named by the catalog or the tool', () => {
    expect(modelLabel('claude', 'claude-opus-5-5')).toBe('Opus 5.5');
    expect(modelLabel('codex', 'gpt-6-astra')).toBe('GPT-6 Astra');
    expect(modelLabel('codex', 'gpt-unknown')).toBe('gpt-unknown');
    expect(agentNameOf('codex', 'gpt-x', 'GPT X')).toBe('Codex · GPT X');
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
it('shows a provider-qualified Gemini model by its whole id', () => {
  expect(modelLabel('pi', 'google/gemini-3.1-pro')).toBe(
    'google/gemini-3.1-pro',
  );
});

it('keeps ACP aliases, provider paths and dated ids as distinct opaque identities', () => {
  expect(normalizeModel('gemini', 'opus-latest')).toBe('opus-latest');
  expect(modelLabel('gemini', 'vendor/Model (20261001)')).toBe(
    'vendor/Model (20261001)',
  );
});

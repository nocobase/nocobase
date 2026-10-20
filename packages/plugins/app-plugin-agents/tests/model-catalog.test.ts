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
      'OpenCode · GPT-6 Astra',
    );
    expect(agentNameOf('pi', 'qwen/qwen3-coder')).toBe('Pi · qwen3-coder');
    expect(modelLabel('opencode', 'moonshotai/kimi-k2')).toBe('kimi-k2');
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
it('uses readable Gemini display names without changing model identity', () => {
  expect(modelLabel('pi', 'google/gemini-3.1-pro')).toBe('Gemini 3.1 Pro');
});

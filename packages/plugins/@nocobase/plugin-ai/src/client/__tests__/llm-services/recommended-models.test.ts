/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recommendedModels, isRecommendedModel, getRecommendedModels } from '../../../common/recommended-models';

const testRecommendedModels: Record<string, { label: string; value: string }[]> = {
  'google-genai': [
    { label: 'Gemini 3 Pro Preview', value: 'models/gemini-3-pro-preview' },
    { label: 'Gemini 3 Flash Preview', value: 'models/gemini-3-flash-preview' },
  ],
  openai: [
    { label: 'GPT-5.3-Codex', value: 'gpt-5.3-codex' },
    { label: 'GPT-5.2', value: 'gpt-5.2' },
  ],
  anthropic: [
    { label: 'Claude Opus 4.6', value: 'claude-opus-4-6' },
    { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5' },
  ],
  dashscope: [{ label: 'Qwen3 Max', value: 'qwen3-max-2026-01-23' }],
  deepseek: [
    { label: 'DeepSeek Chat', value: 'deepseek-chat' },
    { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner' },
  ],
  kimi: [
    { label: 'Kimi K2.5', value: 'kimi-k2.5' },
    { label: 'Kimi K2', value: 'kimi-k2-0905-Preview' },
    { label: 'Kimi K2 Turbo', value: 'kimi-k2-turbo-preview' },
  ],
  ollama: [],
};

const originalRecommendedModels = Object.fromEntries(
  Object.entries(recommendedModels).map(([provider, models]) => [provider, [...models]]),
);

describe('recommended-models', () => {
  beforeAll(() => {
    Object.keys(recommendedModels).forEach((provider) => delete recommendedModels[provider]);
    Object.assign(recommendedModels, testRecommendedModels);
  });

  afterAll(() => {
    Object.keys(recommendedModels).forEach((provider) => delete recommendedModels[provider]);
    Object.assign(recommendedModels, originalRecommendedModels);
  });

  describe('data shape', () => {
    it('keeps { label, value } structure for model entries', () => {
      const first = recommendedModels.openai[0];
      expect(first).toHaveProperty('label');
      expect(first).toHaveProperty('value');
      expect(typeof first.label).toBe('string');
      expect(typeof first.value).toBe('string');
    });
  });

  describe('isRecommendedModel', () => {
    it('returns true for known recommended model', () => {
      const first = recommendedModels.openai[0];
      expect(isRecommendedModel('openai', first.value)).toBe(true);
    });

    it('returns false for unknown provider or non-recommended model', () => {
      expect(isRecommendedModel('openai', 'non-existent-model-xyz')).toBe(false);
      expect(isRecommendedModel('unknown-provider', 'some-model')).toBe(false);
    });

    it('is case-insensitive for model id', () => {
      const first = recommendedModels.openai[0];
      expect(isRecommendedModel('openai', first.value.toUpperCase())).toBe(true);
    });
  });

  describe('getRecommendedModels', () => {
    it('returns model list for known provider', () => {
      const models = getRecommendedModels('openai');
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('label');
      expect(models[0]).toHaveProperty('value');
    });

    it('returns empty array for unknown provider', () => {
      const models = getRecommendedModels('unknown-provider');
      expect(models).toEqual([]);
    });
  });
});

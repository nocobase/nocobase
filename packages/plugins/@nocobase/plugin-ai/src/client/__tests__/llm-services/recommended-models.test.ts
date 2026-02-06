/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { recommendedModels, isRecommendedModel, getRecommendedModels } from '../../../common/recommended-models';

describe('recommended-models', () => {
  describe('recommendedModels', () => {
    it('should have recommended models for main providers', () => {
      expect(recommendedModels.anthropic).toBeDefined();
      expect(recommendedModels.openai).toBeDefined();
      expect(recommendedModels['google-genai']).toBeDefined();
      expect(recommendedModels.deepseek).toBeDefined();
      expect(recommendedModels.dashscope).toBeDefined();
    });

    it('should have { label, value } structure', () => {
      const first = recommendedModels.openai[0];
      expect(first).toHaveProperty('label');
      expect(first).toHaveProperty('value');
      expect(typeof first.label).toBe('string');
      expect(typeof first.value).toBe('string');
    });

    it('should have anthropic recommended models', () => {
      expect(recommendedModels.anthropic.length).toBeGreaterThan(0);
      expect(recommendedModels.anthropic.some((m) => m.value === 'claude-sonnet-4-5')).toBe(true);
    });

    it('should have openai recommended models', () => {
      expect(recommendedModels.openai.length).toBeGreaterThan(0);
      expect(recommendedModels.openai.some((m) => m.value === 'gpt-5.2-codex')).toBe(true);
    });

    it('ollama should have empty recommended models', () => {
      expect(recommendedModels.ollama).toEqual([]);
    });
  });

  describe('isRecommendedModel', () => {
    it('should return true for exact match', () => {
      expect(isRecommendedModel('openai', 'gpt-5.2-codex')).toBe(true);
    });

    it('should return true for partial match (model starts with recommended id)', () => {
      expect(isRecommendedModel('anthropic', 'claude-sonnet-4-5-latest')).toBe(true);
    });

    it('should return false for non-recommended model', () => {
      expect(isRecommendedModel('openai', 'gpt-3.5-turbo')).toBe(false);
    });

    it('should return false for unknown provider', () => {
      expect(isRecommendedModel('unknown-provider', 'some-model')).toBe(false);
    });

    it('should be case insensitive for model id', () => {
      expect(isRecommendedModel('openai', 'GPT-5.2-CODEX')).toBe(true);
    });
  });

  describe('getRecommendedModels', () => {
    it('should return { label, value } array for known provider', () => {
      const models = getRecommendedModels('openai');
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toEqual({ label: 'GPT-5.2 Codex', value: 'gpt-5.2-codex' });
    });

    it('should return empty array for unknown provider', () => {
      const models = getRecommendedModels('unknown-provider');
      expect(models).toEqual([]);
    });

    it('should return empty array for ollama', () => {
      const models = getRecommendedModels('ollama');
      expect(models).toEqual([]);
    });
  });
});

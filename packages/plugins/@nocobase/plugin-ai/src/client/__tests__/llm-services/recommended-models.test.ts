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

    it('should have anthropic recommended models', () => {
      expect(recommendedModels.anthropic.length).toBeGreaterThan(0);
      expect(recommendedModels.anthropic).toContain('claude-sonnet-4-20250514');
    });

    it('should have openai recommended models', () => {
      expect(recommendedModels.openai.length).toBeGreaterThan(0);
      expect(recommendedModels.openai).toContain('gpt-4o');
    });

    it('ollama should have empty recommended models', () => {
      expect(recommendedModels.ollama).toEqual([]);
    });
  });

  describe('isRecommendedModel', () => {
    it('should return true for exact match', () => {
      expect(isRecommendedModel('openai', 'gpt-4o')).toBe(true);
    });

    it('should return true for partial match (model contains recommended)', () => {
      expect(isRecommendedModel('anthropic', 'claude-sonnet-4-20250514-latest')).toBe(true);
    });

    it('should return true for partial match (recommended contains model)', () => {
      expect(isRecommendedModel('anthropic', 'claude-sonnet-4')).toBe(true);
    });

    it('should return false for non-recommended model', () => {
      expect(isRecommendedModel('openai', 'gpt-3.5-turbo')).toBe(false);
    });

    it('should return false for unknown provider', () => {
      expect(isRecommendedModel('unknown-provider', 'some-model')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isRecommendedModel('openai', 'GPT-4O')).toBe(true);
      expect(isRecommendedModel('OPENAI', 'gpt-4o')).toBe(false); // provider is case sensitive
    });
  });

  describe('getRecommendedModels', () => {
    it('should return recommended models for known provider', () => {
      const models = getRecommendedModels('openai');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-4o-mini');
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

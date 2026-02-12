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

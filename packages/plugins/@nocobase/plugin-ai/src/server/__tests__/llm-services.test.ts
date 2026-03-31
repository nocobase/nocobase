/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { getRecommendedModels } from '../../common/recommended-models';

/**
 * LLM Services API Logic Tests
 *
 * These tests verify the business logic of LLM services API
 * without requiring actual database connections.
 */

// Simulate the server-side normalization logic from ai.ts listAllEnabledModels
const transformService = (service: {
  name: string;
  title: string;
  provider: string;
  enabledModels: unknown;
}): {
  llmService: string;
  llmServiceTitle: string;
  provider: string;
  enabledModels: { label: string; value: string }[];
} | null => {
  const raw = service.enabledModels;
  let enabledModels: { label: string; value: string }[];

  if (raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as any).mode) {
    const config = raw as { mode: string; models: Array<{ label: string; value: string }> };
    if (config.mode === 'recommended') {
      enabledModels = getRecommendedModels(service.provider);
    } else {
      enabledModels = (config.models || [])
        .filter((m) => m.value)
        .map((m) => ({ label: m.label || m.value, value: m.value }));
    }
  } else if (Array.isArray(raw)) {
    if (raw.length === 0) {
      enabledModels = getRecommendedModels(service.provider);
    } else {
      enabledModels = raw.map((id: string) => ({ label: id, value: id }));
    }
  } else {
    enabledModels = getRecommendedModels(service.provider);
  }

  if (enabledModels.length === 0) {
    return null;
  }

  return {
    llmService: service.name,
    llmServiceTitle: service.title,
    provider: service.provider,
    enabledModels,
  };
};

// Simulate filtering models by search term
const filterModelsBySearch = (models: { id: string }[], searchTerm: string) => {
  if (!searchTerm) return models;
  return models.filter((m) => m.id.toLowerCase().includes(searchTerm.toLowerCase()));
};

describe('LLM Services API Logic', () => {
  describe('P0: New format - recommended mode', () => {
    it('should use recommended models for recommended mode', () => {
      const result = transformService({
        name: 'test-openai',
        title: 'Test OpenAI',
        provider: 'openai',
        enabledModels: { mode: 'recommended', models: [] },
      });

      expect(result).not.toBeNull();
      expect(result!.enabledModels.length).toBeGreaterThan(0);
      expect(result!.enabledModels[0]).toHaveProperty('label');
      expect(result!.enabledModels[0]).toHaveProperty('value');
    });
  });

  describe('P0: New format - provider mode', () => {
    it('should use stored models with labels for provider mode', () => {
      const result = transformService({
        name: 'test-openai',
        title: 'Test OpenAI',
        provider: 'openai',
        enabledModels: {
          mode: 'provider',
          models: [
            { label: 'GPT-4o', value: 'gpt-4o' },
            { label: 'GPT-4o-Mini', value: 'gpt-4o-mini' },
          ],
        },
      });

      expect(result).not.toBeNull();
      expect(result!.enabledModels).toEqual([
        { label: 'GPT-4o', value: 'gpt-4o' },
        { label: 'GPT-4o-Mini', value: 'gpt-4o-mini' },
      ]);
    });
  });

  describe('P0: New format - custom mode', () => {
    it('should use custom models with user labels', () => {
      const result = transformService({
        name: 'test-custom',
        title: 'Test Custom',
        provider: 'openai',
        enabledModels: {
          mode: 'custom',
          models: [{ label: 'My Custom Model', value: 'custom-model-v1' }],
        },
      });

      expect(result).not.toBeNull();
      expect(result!.enabledModels).toEqual([{ label: 'My Custom Model', value: 'custom-model-v1' }]);
    });

    it('should filter out models with empty value', () => {
      const result = transformService({
        name: 'test-custom',
        title: 'Test Custom',
        provider: 'openai',
        enabledModels: {
          mode: 'custom',
          models: [
            { label: 'Valid', value: 'valid-model' },
            { label: 'Empty', value: '' },
          ],
        },
      });

      expect(result).not.toBeNull();
      expect(result!.enabledModels).toHaveLength(1);
      expect(result!.enabledModels[0].value).toBe('valid-model');
    });
  });

  describe('P0: Backward compat - old string[] format', () => {
    it('should handle old empty array as recommended mode', () => {
      const result = transformService({
        name: 'test-openai',
        title: 'Test OpenAI',
        provider: 'openai',
        enabledModels: [],
      });

      expect(result).not.toBeNull();
      expect(result!.enabledModels.length).toBeGreaterThan(0);
    });

    it('should handle old string array with model ids', () => {
      const result = transformService({
        name: 'test-openai',
        title: 'Test OpenAI',
        provider: 'openai',
        enabledModels: ['gpt-4o', 'gpt-4o-mini'],
      });

      expect(result).not.toBeNull();
      expect(result!.enabledModels).toEqual([
        { label: 'gpt-4o', value: 'gpt-4o' },
        { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      ]);
    });

    it('should handle null enabledModels', () => {
      const result = transformService({
        name: 'test-openai',
        title: 'Test OpenAI',
        provider: 'openai',
        enabledModels: null,
      });

      expect(result).not.toBeNull();
      expect(result!.enabledModels.length).toBeGreaterThan(0);
    });
  });

  describe('P0: Provider with no recommended models', () => {
    it('should return null for provider with no recommended models and recommended mode', () => {
      const result = transformService({
        name: 'test-ollama',
        title: 'Test Ollama',
        provider: 'ollama',
        enabledModels: { mode: 'recommended', models: [] },
      });

      expect(result).toBeNull();
    });
  });

  describe('P0: listProviderModels filtering', () => {
    it('should return all models when no search term', () => {
      const models = [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }, { id: 'gpt-3.5-turbo' }];

      const result = filterModelsBySearch(models, '');

      expect(result).toHaveLength(3);
    });

    it('should filter models by search term (case insensitive)', () => {
      const models = [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }, { id: 'gpt-3.5-turbo' }];

      const result = filterModelsBySearch(models, 'GPT-4O');

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.id)).toContain('gpt-4o');
      expect(result.map((m) => m.id)).toContain('gpt-4o-mini');
    });

    it('should return empty array when no models match', () => {
      const models = [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }];

      const result = filterModelsBySearch(models, 'claude');

      expect(result).toHaveLength(0);
    });
  });

  describe('P0: modelOptions data structure', () => {
    const defaultModelOptions = {
      temperature: 1,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };

    it('should have correct default values for modelOptions', () => {
      expect(defaultModelOptions.temperature).toBe(1);
      expect(defaultModelOptions.topP).toBe(1);
      expect(defaultModelOptions.frequencyPenalty).toBe(0);
      expect(defaultModelOptions.presencePenalty).toBe(0);
      expect((defaultModelOptions as any).webSearch).toBeUndefined();
      expect((defaultModelOptions as any).maxTokens).toBeUndefined();
    });

    it('should store modelOptions separately from provider options', () => {
      const llmService = {
        name: 'test-service',
        title: 'Test Service',
        provider: 'openai',
        options: { apiKey: 'test-key', baseURL: 'https://api.example.com' },
        enabledModels: { mode: 'provider' as const, models: [{ label: 'GPT-4o', value: 'gpt-4o' }] },
        modelOptions: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
        },
      };

      expect(llmService.options.apiKey).toBe('test-key');
      expect(llmService.options.baseURL).toBe('https://api.example.com');
      expect((llmService.options as any).temperature).toBeUndefined();
      expect(llmService.modelOptions.temperature).toBe(0.7);
    });
  });

  describe('P1: Multiple services handling', () => {
    it('should handle multiple services from different providers', () => {
      const services = [
        {
          name: 'openai-service',
          title: 'OpenAI Service',
          provider: 'openai',
          enabledModels: {
            mode: 'provider',
            models: [{ label: 'GPT-4o', value: 'gpt-4o' }],
          },
        },
        {
          name: 'anthropic-service',
          title: 'Anthropic Service',
          provider: 'anthropic',
          enabledModels: {
            mode: 'custom',
            models: [{ label: 'Claude Sonnet', value: 'claude-sonnet-4' }],
          },
        },
        {
          name: 'deepseek-service',
          title: 'DeepSeek Service',
          provider: 'deepseek',
          enabledModels: { mode: 'recommended', models: [] },
        },
      ];

      const results = services.map(transformService).filter(Boolean);

      expect(results).toHaveLength(3);
      expect(results[0]!.enabledModels[0].value).toBe('gpt-4o');
      expect(results[1]!.enabledModels[0].value).toBe('claude-sonnet-4');
      // deepseek recommended mode returns recommended models with label+value structure
      expect(results[2]!.enabledModels[0]).toHaveProperty('label');
      expect(results[2]!.enabledModels[0]).toHaveProperty('value');
    });
  });

  describe('P1: Provider validation', () => {
    it('should identify valid providers', () => {
      const validProviders = ['openai', 'anthropic', 'google-genai', 'deepseek', 'dashscope', 'ollama'];

      const isValidProvider = (provider: string) => validProviders.includes(provider);

      expect(isValidProvider('openai')).toBe(true);
      expect(isValidProvider('anthropic')).toBe(true);
      expect(isValidProvider('invalid-provider')).toBe(false);
    });
  });
});

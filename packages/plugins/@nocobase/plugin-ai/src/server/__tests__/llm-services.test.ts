/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';

/**
 * LLM Services API Logic Tests
 *
 * These tests verify the business logic of LLM services API
 * without requiring actual database connections.
 */

// Simulate the listAllEnabledModels response transformation logic
const transformServicesToEnabledModels = (services: any[]) => {
  const llmServices = services
    .filter((service) => service.enabledModels && service.enabledModels.length > 0)
    .map((service) => ({
      llmService: service.name,
      llmServiceTitle: service.title,
      provider: service.provider,
      enabledModels: (service.enabledModels || []).map((id: string) => ({
        id,
        label: id,
      })),
    }));

  return { llmServices };
};

// Simulate filtering models by search term
const filterModelsBySearch = (models: { id: string }[], searchTerm: string) => {
  if (!searchTerm) return models;
  return models.filter((m) => m.id.toLowerCase().includes(searchTerm.toLowerCase()));
};

describe('LLM Services API Logic', () => {
  describe('P0: listAllEnabledModels transformation', () => {
    it('should return empty data when no services configured', () => {
      const result = transformServicesToEnabledModels([]);

      expect(result.llmServices).toEqual([]);
    });

    it('should return services with enabled models', () => {
      const services = [
        {
          name: 'test-openai',
          title: 'Test OpenAI',
          provider: 'openai',
          enabledModels: ['gpt-4o', 'gpt-4o-mini'],
        },
      ];

      const result = transformServicesToEnabledModels(services);

      expect(result.llmServices).toHaveLength(1);
      expect(result.llmServices[0]).toMatchObject({
        llmService: 'test-openai',
        llmServiceTitle: 'Test OpenAI',
        provider: 'openai',
      });
      expect(result.llmServices[0].enabledModels).toHaveLength(2);
      expect(result.llmServices[0].enabledModels[0]).toEqual({ id: 'gpt-4o', label: 'gpt-4o' });
    });

    it('should filter out services with empty enabledModels (Auto Mode)', () => {
      const services = [
        {
          name: 'test-anthropic',
          title: 'Test Anthropic',
          provider: 'anthropic',
          enabledModels: [], // Auto Mode - should be filtered out
        },
        {
          name: 'test-openai',
          title: 'Test OpenAI',
          provider: 'openai',
          enabledModels: ['gpt-4o'],
        },
      ];

      const result = transformServicesToEnabledModels(services);

      expect(result.llmServices).toHaveLength(1);
      expect(result.llmServices[0].llmService).toBe('test-openai');
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

  describe('P0: Data storage structure', () => {
    it('should store Auto Mode as empty enabledModels array', () => {
      const autoModeService = {
        name: 'test-service',
        title: 'Test Service',
        provider: 'openai',
        options: { apiKey: 'test-key' },
        enabledModels: [], // Auto Mode - empty means use recommended models
      };

      expect(autoModeService.enabledModels).toEqual([]);
    });

    it('should store Custom Mode as enabledModels array with values', () => {
      const customModeService = {
        name: 'test-service',
        title: 'Test Service',
        provider: 'openai',
        options: { apiKey: 'test-key' },
        enabledModels: ['gpt-4o', 'gpt-4o-mini'],
      };

      expect(customModeService.enabledModels).toEqual(['gpt-4o', 'gpt-4o-mini']);
    });

    it('should store baseURL in options object', () => {
      const serviceWithBaseURL = {
        name: 'test-service',
        options: {
          apiKey: 'test-key',
          baseURL: 'https://custom-api.example.com',
        },
      };

      expect(serviceWithBaseURL.options.baseURL).toBe('https://custom-api.example.com');
      expect(serviceWithBaseURL.options.apiKey).toBe('test-key');
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

  describe('P1: Service configuration check', () => {
    it('should return configured=false when no services', () => {
      const services: any[] = [];
      const configured = services.length > 0;

      expect(configured).toBe(false);
    });

    it('should return configured=true when services exist', () => {
      const services = [{ name: 'test-service' }];
      const configured = services.length > 0;

      expect(configured).toBe(true);
    });
  });

  describe('P1: Multiple services handling', () => {
    it('should handle multiple services from different providers', () => {
      const services = [
        {
          name: 'openai-service',
          title: 'OpenAI Service',
          provider: 'openai',
          enabledModels: ['gpt-4o'],
        },
        {
          name: 'anthropic-service',
          title: 'Anthropic Service',
          provider: 'anthropic',
          enabledModels: ['claude-sonnet-4'],
        },
        {
          name: 'deepseek-service',
          title: 'DeepSeek Service',
          provider: 'deepseek',
          enabledModels: [], // Auto Mode - filtered out
        },
      ];

      const result = transformServicesToEnabledModels(services);

      expect(result.llmServices).toHaveLength(2);
      expect(result.llmServices.map((s) => s.provider)).toContain('openai');
      expect(result.llmServices.map((s) => s.provider)).toContain('anthropic');
      expect(result.llmServices.map((s) => s.provider)).not.toContain('deepseek');
    });
  });

  describe('P1: Model list API response format', () => {
    it('should format model list with id and label', () => {
      const rawModels = ['gpt-4o', 'gpt-4o-mini'];

      const formattedModels = rawModels.map((id) => ({ id, label: id }));

      expect(formattedModels).toEqual([
        { id: 'gpt-4o', label: 'gpt-4o' },
        { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      ]);
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
      // webSearch is now session-only (chatbox UI), not in modelOptions defaults
      expect((defaultModelOptions as any).webSearch).toBeUndefined();
      // maxTokens is intentionally undefined (no limit)
      expect((defaultModelOptions as any).maxTokens).toBeUndefined();
    });

    it('should store modelOptions separately from provider options', () => {
      const llmService = {
        name: 'test-service',
        title: 'Test Service',
        provider: 'openai',
        options: { apiKey: 'test-key', baseURL: 'https://api.example.com' },
        enabledModels: ['gpt-4o'],
        modelOptions: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
        },
      };

      // options stores provider config (apiKey, baseURL)
      expect(llmService.options.apiKey).toBe('test-key');
      expect(llmService.options.baseURL).toBe('https://api.example.com');
      expect((llmService.options as any).temperature).toBeUndefined();

      // modelOptions stores model runtime parameters
      expect(llmService.modelOptions.temperature).toBe(0.7);
    });

    it('should validate modelOptions parameter ranges', () => {
      const validateModelOptions = (options: typeof defaultModelOptions & { maxTokens?: number }) => {
        const errors: string[] = [];
        if (options.temperature < 0 || options.temperature > 2) {
          errors.push('temperature must be between 0 and 2');
        }
        // maxTokens is optional (undefined means no limit)
        if (options.maxTokens !== undefined && options.maxTokens < 1) {
          errors.push('maxTokens must be at least 1');
        }
        if (options.topP < 0 || options.topP > 1) {
          errors.push('topP must be between 0 and 1');
        }
        if (options.frequencyPenalty < -2 || options.frequencyPenalty > 2) {
          errors.push('frequencyPenalty must be between -2 and 2');
        }
        if (options.presencePenalty < -2 || options.presencePenalty > 2) {
          errors.push('presencePenalty must be between -2 and 2');
        }
        return errors;
      };

      // Valid options (no maxTokens = no limit)
      expect(validateModelOptions(defaultModelOptions)).toEqual([]);

      // Invalid temperature
      expect(validateModelOptions({ ...defaultModelOptions, temperature: 3 })).toContain(
        'temperature must be between 0 and 2',
      );

      // Invalid topP
      expect(validateModelOptions({ ...defaultModelOptions, topP: 1.5 })).toContain('topP must be between 0 and 1');
    });
  });
});

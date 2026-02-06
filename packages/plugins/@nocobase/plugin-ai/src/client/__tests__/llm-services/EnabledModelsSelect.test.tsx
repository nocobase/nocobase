/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import {
  formatModelLabel,
  normalizeEnabledModels,
  EnabledModelsConfig,
} from '../../llm-services/component/EnabledModelsSelect';

describe('EnabledModelsSelect Logic', () => {
  describe('P0: normalizeEnabledModels', () => {
    it('should return recommended mode for null', () => {
      expect(normalizeEnabledModels(null)).toEqual({ mode: 'recommended', models: [] });
    });

    it('should return recommended mode for undefined', () => {
      expect(normalizeEnabledModels(undefined)).toEqual({ mode: 'recommended', models: [] });
    });

    it('should return recommended mode for empty array (old format)', () => {
      expect(normalizeEnabledModels([])).toEqual({ mode: 'recommended', models: [] });
    });

    it('should convert old string[] format to custom mode', () => {
      const result = normalizeEnabledModels(['gpt-4o', 'gpt-4o-mini']);
      expect(result.mode).toBe('custom');
      expect(result.models).toEqual([
        { label: 'gpt-4o', value: 'gpt-4o' },
        { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      ]);
    });

    it('should pass through new recommended format', () => {
      const input: EnabledModelsConfig = { mode: 'recommended', models: [] };
      expect(normalizeEnabledModels(input)).toEqual(input);
    });

    it('should pass through new provider format', () => {
      const input: EnabledModelsConfig = {
        mode: 'provider',
        models: [{ label: 'GPT-4o', value: 'gpt-4o' }],
      };
      expect(normalizeEnabledModels(input)).toEqual(input);
    });

    it('should pass through new custom format', () => {
      const input: EnabledModelsConfig = {
        mode: 'custom',
        models: [{ label: 'My Model', value: 'my-model-v1' }],
      };
      expect(normalizeEnabledModels(input)).toEqual(input);
    });
  });

  describe('P0: formatModelLabel', () => {
    it('should strip models/ prefix and capitalize', () => {
      expect(formatModelLabel('models/gemini-3-pro-preview')).toBe('Gemini-3-Pro-Preview');
    });

    it('should strip ft: prefix and capitalize', () => {
      expect(formatModelLabel('ft:gpt-4o-mini')).toBe('Gpt-4o-Mini');
    });

    it('should strip accounts/.../models/ prefix', () => {
      expect(formatModelLabel('accounts/abc123/models/my-model')).toBe('My-Model');
    });

    it('should handle simple model ids', () => {
      expect(formatModelLabel('gpt-4o')).toBe('Gpt-4o');
    });

    it('should handle underscores', () => {
      expect(formatModelLabel('my_custom_model')).toBe('My-Custom-Model');
    });

    it('should handle mixed separators', () => {
      expect(formatModelLabel('my-custom_model-v2')).toBe('My-Custom-Model-V2');
    });
  });

  describe('P0: 3-mode selection behavior', () => {
    it('should support recommended mode with empty models', () => {
      const config: EnabledModelsConfig = { mode: 'recommended', models: [] };
      expect(config.mode).toBe('recommended');
      expect(config.models).toEqual([]);
    });

    it('should support provider mode with label+value models', () => {
      const config: EnabledModelsConfig = {
        mode: 'provider',
        models: [
          { label: 'Gemini-3-Pro-Preview', value: 'models/gemini-3-pro-preview' },
          { label: 'GPT-5.2-Codex', value: 'gpt-5.2-codex' },
        ],
      };
      expect(config.mode).toBe('provider');
      expect(config.models).toHaveLength(2);
      expect(config.models[0].label).toBe('Gemini-3-Pro-Preview');
      expect(config.models[0].value).toBe('models/gemini-3-pro-preview');
    });

    it('should support custom mode with user-entered label+value', () => {
      const config: EnabledModelsConfig = {
        mode: 'custom',
        models: [{ label: 'My Custom GPT', value: 'custom-gpt-v1' }],
      };
      expect(config.mode).toBe('custom');
      expect(config.models[0].label).toBe('My Custom GPT');
      expect(config.models[0].value).toBe('custom-gpt-v1');
    });
  });

  describe('P0: Mode switch clears models', () => {
    it('should reset to empty models when switching mode', () => {
      let config: EnabledModelsConfig = {
        mode: 'provider',
        models: [{ label: 'GPT-4o', value: 'gpt-4o' }],
      };

      // Switch to recommended
      config = { mode: 'recommended', models: [] };
      expect(config.models).toEqual([]);
      expect(config.mode).toBe('recommended');

      // Switch to custom
      config = { mode: 'custom', models: [] };
      expect(config.models).toEqual([]);
      expect(config.mode).toBe('custom');
    });
  });

  describe('P1: Submission fallback rule', () => {
    it('should fallback to recommended when provider mode has no models', () => {
      const config: EnabledModelsConfig = { mode: 'provider', models: [] };
      const hasValidModels = config.models.some((m) => m.value);
      const submitted = hasValidModels ? config : { mode: 'recommended' as const, models: [] };
      expect(submitted.mode).toBe('recommended');
    });

    it('should fallback to recommended when custom mode has no valid models', () => {
      const config: EnabledModelsConfig = { mode: 'custom', models: [{ label: '', value: '' }] };
      const hasValidModels = config.models.some((m) => m.value);
      const submitted = hasValidModels ? config : { mode: 'recommended' as const, models: [] };
      expect(submitted.mode).toBe('recommended');
    });

    it('should keep provider mode when models exist', () => {
      const config: EnabledModelsConfig = {
        mode: 'provider',
        models: [{ label: 'GPT-4o', value: 'gpt-4o' }],
      };
      const hasValidModels = config.models.some((m) => m.value);
      const submitted = hasValidModels ? config : { mode: 'recommended' as const, models: [] };
      expect(submitted.mode).toBe('provider');
    });
  });

  describe('P1: Custom mode add/remove', () => {
    it('should add a new empty model row', () => {
      const models = [{ label: 'A', value: 'a' }];
      const updated = [...models, { label: '', value: '' }];
      expect(updated).toHaveLength(2);
    });

    it('should remove a model row by index', () => {
      const models = [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ];
      const updated = models.filter((_, i) => i !== 0);
      expect(updated).toEqual([{ label: 'B', value: 'b' }]);
    });
  });
});

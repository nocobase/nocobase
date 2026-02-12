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
  mergeVersionSegments,
  normalizeEnabledModels,
  EnabledModelsConfig,
} from '../../llm-services/component/EnabledModelsSelect';
import { openaiResponsesProviderOptions } from '../../llm-providers/openai/responses';

describe('EnabledModelsSelect Logic', () => {
  describe('normalizeEnabledModels', () => {
    it('falls back to recommended mode for empty legacy values', () => {
      expect(normalizeEnabledModels(null)).toEqual({ mode: 'recommended', models: [] });
      expect(normalizeEnabledModels(undefined)).toEqual({ mode: 'recommended', models: [] });
      expect(normalizeEnabledModels([])).toEqual({ mode: 'recommended', models: [] });
    });

    it('converts old string[] format to custom mode', () => {
      const result = normalizeEnabledModels(['gpt-4o', 'gpt-4o-mini']);
      expect(result.mode).toBe('custom');
      expect(result.models).toEqual([
        { label: 'gpt-4o', value: 'gpt-4o' },
        { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      ]);
    });

    it('passes through new object format', () => {
      const input: EnabledModelsConfig = { mode: 'recommended', models: [] };
      expect(normalizeEnabledModels(input)).toEqual(input);
    });
  });

  describe('mergeVersionSegments', () => {
    it('merges consecutive short numeric segments with dot', () => {
      expect(mergeVersionSegments(['claude', 'opus', '4', '5'])).toEqual(['claude', 'opus', '4.5']);
      expect(mergeVersionSegments(['claude', 'opus', '4', '5', '20251101'])).toEqual([
        'claude',
        'opus',
        '4.5',
        '20251101',
      ]);
    });

    it('keeps long numeric segments unchanged', () => {
      expect(mergeVersionSegments(['model', '20251101'])).toEqual(['model', '20251101']);
    });
  });

  describe('formatModelLabel', () => {
    it('formats Anthropic model ids with merged versions', () => {
      expect(formatModelLabel('claude-sonnet-4-5')).toBe('Claude Sonnet 4.5');
      expect(formatModelLabel('claude-opus-4-6')).toBe('Claude Opus 4.6');
    });

    it('supports existing dot version numbers', () => {
      expect(formatModelLabel('claude-sonnet-4.5')).toBe('Claude Sonnet 4.5');
    });

    it('strips known prefixes and path parts', () => {
      expect(formatModelLabel('ft:some-model')).toBe('Some Model');
      expect(formatModelLabel('models/gemini-3-pro-preview')).toBe('Gemini 3 Pro Preview');
      expect(formatModelLabel('anthropic/claude-opus-4-6')).toBe('Claude Opus 4.6');
    });
  });

  describe('openai formatModelLabel', () => {
    const openaiFormat = openaiResponsesProviderOptions.formatModelLabel!;

    it('formats GPT models with uppercase GPT and hyphen style', () => {
      expect(openaiFormat('gpt-4o')).toBe('GPT-4o');
      expect(openaiFormat('gpt-5.2')).toBe('GPT-5.2');
      expect(openaiFormat('gpt-5.1-codex-mini')).toBe('GPT-5.1-Codex-Mini');
    });

    it('strips ft: prefix for GPT models', () => {
      expect(openaiFormat('ft:gpt-4o-mini')).toBe('GPT-4o-Mini');
    });
  });
});

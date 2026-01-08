/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { _testUtils } from '../llm-providers/bedrock';

const { isTextInferenceProfile, extractProviderFromId, CLAUDE_4X_PATTERNS } = _testUtils;

describe('Bedrock Provider Utils', () => {
  describe('isTextInferenceProfile', () => {
    it('should return true for Anthropic Claude models', () => {
      expect(isTextInferenceProfile('us.anthropic.claude-sonnet-4')).toBe(true);
      expect(isTextInferenceProfile('anthropic.claude-3-5-sonnet')).toBe(true);
      expect(isTextInferenceProfile('anthropic.claude-3-opus')).toBe(true);
    });

    it('should return true for Amazon Titan text models', () => {
      expect(isTextInferenceProfile('amazon.titan-text-express-v1')).toBe(true);
      expect(isTextInferenceProfile('amazon.titan-text-lite-v1')).toBe(true);
    });

    it('should return true for Amazon Nova models', () => {
      expect(isTextInferenceProfile('amazon.nova-pro-v1:0')).toBe(true);
      expect(isTextInferenceProfile('amazon.nova-lite-v1:0')).toBe(true);
      expect(isTextInferenceProfile('amazon.nova-micro-v1:0')).toBe(true);
    });

    it('should return true for Mistral models', () => {
      expect(isTextInferenceProfile('mistral.mistral-large-2402-v1:0')).toBe(true);
      expect(isTextInferenceProfile('mistral.mixtral-8x7b-instruct-v0:1')).toBe(true);
    });

    it('should return true for Meta Llama models', () => {
      expect(isTextInferenceProfile('meta.llama3-70b-instruct-v1:0')).toBe(true);
      expect(isTextInferenceProfile('meta.llama2-13b-chat-v1')).toBe(true);
    });

    it('should return true for Cohere models', () => {
      expect(isTextInferenceProfile('cohere.command-r-plus-v1:0')).toBe(true);
      expect(isTextInferenceProfile('cohere.command-text-v14')).toBe(true);
    });

    it('should return true for AI21 models', () => {
      expect(isTextInferenceProfile('ai21.jamba-instruct-v1:0')).toBe(true);
      expect(isTextInferenceProfile('ai21.j2-ultra-v1')).toBe(true);
    });

    it('should return false for image/embedding models', () => {
      expect(isTextInferenceProfile('stability.stable-diffusion-xl-v1')).toBe(false);
      expect(isTextInferenceProfile('amazon.titan-embed-text-v1')).toBe(false);
      expect(isTextInferenceProfile('amazon.titan-image-generator-v1')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isTextInferenceProfile('ANTHROPIC.CLAUDE-3-SONNET')).toBe(true);
      expect(isTextInferenceProfile('Amazon.Nova-Pro-V1')).toBe(true);
      expect(isTextInferenceProfile('META.LLAMA3-70B')).toBe(true);
    });
  });

  describe('extractProviderFromId', () => {
    it('should extract Anthropic from claude model IDs', () => {
      expect(extractProviderFromId('anthropic.claude-3-5-sonnet-20241022-v2:0')).toBe('Anthropic');
      expect(extractProviderFromId('us.anthropic.claude-sonnet-4-20250514-v1:0')).toBe('Anthropic');
    });

    it('should extract Amazon from titan/nova model IDs', () => {
      expect(extractProviderFromId('amazon.titan-text-express-v1')).toBe('Amazon');
      expect(extractProviderFromId('amazon.nova-pro-v1:0')).toBe('Amazon');
    });

    it('should extract Mistral AI from mistral model IDs', () => {
      expect(extractProviderFromId('mistral.mistral-large-2402-v1:0')).toBe('Mistral AI');
      expect(extractProviderFromId('mistral.mixtral-8x7b-instruct-v0:1')).toBe('Mistral AI');
    });

    it('should extract Meta from llama model IDs', () => {
      expect(extractProviderFromId('meta.llama3-70b-instruct-v1:0')).toBe('Meta');
      expect(extractProviderFromId('meta.llama2-13b-chat-v1')).toBe('Meta');
    });

    it('should extract Cohere from cohere model IDs', () => {
      expect(extractProviderFromId('cohere.command-r-plus-v1:0')).toBe('Cohere');
      expect(extractProviderFromId('cohere.command-text-v14')).toBe('Cohere');
    });

    it('should extract AI21 Labs from ai21 model IDs', () => {
      expect(extractProviderFromId('ai21.jamba-instruct-v1:0')).toBe('AI21 Labs');
      expect(extractProviderFromId('ai21.j2-ultra-v1')).toBe('AI21 Labs');
    });

    it('should return Unknown for unrecognized patterns', () => {
      expect(extractProviderFromId('unknown.some-model-v1')).toBe('Unknown');
      expect(extractProviderFromId('custom-model-123')).toBe('Unknown');
      expect(extractProviderFromId('')).toBe('Unknown');
    });

    it('should be case insensitive', () => {
      expect(extractProviderFromId('ANTHROPIC.CLAUDE-3')).toBe('Anthropic');
      expect(extractProviderFromId('Amazon.Nova-Pro')).toBe('Amazon');
    });
  });

  describe('CLAUDE_4X_PATTERNS', () => {
    it('should match Claude 4.x Sonnet model patterns', () => {
      const sonnetModels = [
        'claude-sonnet-4-20250514',
        'anthropic.claude-sonnet-4-20250514-v1:0',
        'us.anthropic.claude-sonnet-4-20250514-v1:0',
      ];
      sonnetModels.forEach((model) => {
        const matches = CLAUDE_4X_PATTERNS.some((p) => p.test(model));
        expect(matches).toBe(true);
      });
    });

    it('should match Claude 4.x Haiku model patterns', () => {
      const haikuModels = ['claude-haiku-4-20250514', 'anthropic.claude-haiku-4-20250514-v1:0'];
      haikuModels.forEach((model) => {
        const matches = CLAUDE_4X_PATTERNS.some((p) => p.test(model));
        expect(matches).toBe(true);
      });
    });

    it('should match Claude 4.x Opus model patterns', () => {
      const opusModels = ['claude-opus-4-20250514', 'anthropic.claude-opus-4-20250514-v1:0'];
      opusModels.forEach((model) => {
        const matches = CLAUDE_4X_PATTERNS.some((p) => p.test(model));
        expect(matches).toBe(true);
      });
    });

    it('should NOT match Claude 3.x model patterns', () => {
      const claude3xModels = [
        'claude-3-5-sonnet-20241022',
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'claude-3-opus-20240229',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      ];
      claude3xModels.forEach((model) => {
        const matches = CLAUDE_4X_PATTERNS.some((p) => p.test(model));
        expect(matches).toBe(false);
      });
    });

    it('should NOT match non-Claude models', () => {
      const nonClaudeModels = [
        'amazon.nova-pro-v1:0',
        'mistral.mistral-large-2402-v1:0',
        'meta.llama3-70b-instruct-v1:0',
      ];
      nonClaudeModels.forEach((model) => {
        const matches = CLAUDE_4X_PATTERNS.some((p) => p.test(model));
        expect(matches).toBe(false);
      });
    });
  });
});

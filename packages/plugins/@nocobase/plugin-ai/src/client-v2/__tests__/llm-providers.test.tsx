/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { createMockClient } from '@nocobase/client-v2';
import PluginAIClientV2 from '../plugin';
import {
  builtinLLMProviderOptions,
  deepseekProviderOptions,
  getBuiltinLLMProviderModelOptionFields,
  ollamaProviderOptions,
  orcarouterProviderOptions,
  openaiResponsesProviderOptions,
} from '../llm-providers';
import {
  EmptyProviderSettingsForm,
  OrcaRouterProviderSettingsForm,
  ProviderSettingsForm,
} from '../llm-providers/forms';

const V1_REGISTERED_PROVIDERS = [
  'google-genai',
  'openai',
  'anthropic',
  'openai-completions',
  'deepseek',
  'dashscope',
  'ollama',
  'kimi',
  'xai',
  'mimo',
  'mistral',
  'orcarouter',
];

describe('plugin-ai client-v2 LLM providers', () => {
  it('keeps builtin provider registration aligned with v1 load order', () => {
    expect(builtinLLMProviderOptions.map(([name]) => name)).toEqual(V1_REGISTERED_PROVIDERS);
  });

  it('registers builtin providers during plugin load', async () => {
    const app = createMockClient({ publicPath: '/v/' });

    await app.pm.add(PluginAIClientV2);
    await app.load();

    const plugin = app.pm.get(PluginAIClientV2) as PluginAIClientV2;

    expect(plugin.aiManager.llmProviders.get('openai')).toBe(openaiResponsesProviderOptions);
    expect(plugin.aiManager.llmProviders.get('ollama')).toBe(ollamaProviderOptions);
    expect(plugin.aiManager.llmProviders.get('orcarouter')).toBe(orcarouterProviderOptions);
  });

  it('uses v2 provider settings components without v1 schema forms', () => {
    expect(openaiResponsesProviderOptions.components.ProviderSettingsForm).toBe(ProviderSettingsForm);
    expect(ollamaProviderOptions.components.ProviderSettingsForm).toBe(EmptyProviderSettingsForm);
    expect(orcarouterProviderOptions.components.ProviderSettingsForm).toBe(OrcaRouterProviderSettingsForm);
    expect(openaiResponsesProviderOptions.components.ModelSettingsForm).toBeDefined();
  });

  it('keeps provider-specific model label formatting', () => {
    expect(openaiResponsesProviderOptions.formatModelLabel?.('gpt-4.1-mini')).toBe('GPT-4.1-Mini');
    expect(deepseekProviderOptions.formatModelLabel?.('deepseek-chat')).toBe('Deepseek Chat');
  });

  it('exposes builtin model option fields for workflow node reuse', () => {
    expect(getBuiltinLLMProviderModelOptionFields('openai').map((field) => field.name)).toEqual([
      'frequencyPenalty',
      'maxCompletionTokens',
      'presencePenalty',
      'temperature',
      'topP',
      'responseFormat',
      'timeout',
      'maxRetries',
    ]);
    expect(getBuiltinLLMProviderModelOptionFields('ollama').map((field) => field.name)).toEqual([
      'temperature',
      'topP',
      'topK',
      'numPredict',
    ]);
    expect(getBuiltinLLMProviderModelOptionFields('mistral').map((field) => field.name)).toEqual([
      'temperature',
      'topP',
      'maxTokens',
      'frequencyPenalty',
      'presencePenalty',
      'responseFormat',
      'timeout',
      'maxRetries',
    ]);
    expect(getBuiltinLLMProviderModelOptionFields('orcarouter').map((field) => field.name)).toEqual([
      'frequencyPenalty',
      'maxCompletionTokens',
      'presencePenalty',
      'temperature',
      'topP',
      'responseFormat',
      'timeout',
      'maxRetries',
    ]);
    expect(getBuiltinLLMProviderModelOptionFields('unknown')).toEqual([]);
  });
});

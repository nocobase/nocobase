/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LLMProviderOptions } from '../manager/ai-manager';
import {
  createModelSettingsForm,
  deepSeekCompletionFields,
  EmptyProviderSettingsForm,
  googleGenAICompletionFields,
  mistralCompletionFields,
  ollamaCompletionFields,
  openAICompletionFields,
  openAIResponsesFields,
  ProviderSettingsForm,
  qwenCompletionFields,
  xAICompletionFields,
  type OptionField,
} from './forms';
import { capitalize, formatModelLabel, mergeVersionSegments, stripModelIdPrefix } from '../llm-services/model-label';

const formatOpenAIModelLabel = (id: string): string => {
  const name = stripModelIdPrefix(id);
  const segments = mergeVersionSegments(name.split(/[-_]/));
  return segments.map((segment) => (segment.toLowerCase() === 'gpt' ? 'GPT' : capitalize(segment))).join('-');
};

const createProviderOptions = (
  ModelSettingsForm: LLMProviderOptions['components']['ModelSettingsForm'],
  options?: {
    ProviderSettingsForm?: LLMProviderOptions['components']['ProviderSettingsForm'];
    formatModelLabel?: (id: string) => string;
  },
): LLMProviderOptions => ({
  components: {
    ProviderSettingsForm: options?.ProviderSettingsForm ?? ProviderSettingsForm,
    ModelSettingsForm,
  },
  formatModelLabel: options?.formatModelLabel ?? formatModelLabel,
});

export const googleGenAIProviderOptions = createProviderOptions(createModelSettingsForm(googleGenAICompletionFields));

export const openaiResponsesProviderOptions = createProviderOptions(createModelSettingsForm(openAIResponsesFields), {
  formatModelLabel: formatOpenAIModelLabel,
});

export const anthropicProviderOptions = createProviderOptions(createModelSettingsForm(qwenCompletionFields));

export const openaiCompletionsProviderOptions = createProviderOptions(createModelSettingsForm(openAICompletionFields), {
  formatModelLabel: formatOpenAIModelLabel,
});

export const deepseekProviderOptions = createProviderOptions(createModelSettingsForm(deepSeekCompletionFields));

export const dashscopeProviderOptions = createProviderOptions(createModelSettingsForm(qwenCompletionFields));

export const kimiProviderOptions = createProviderOptions(createModelSettingsForm(qwenCompletionFields));

export const xaiProviderOptions = createProviderOptions(createModelSettingsForm(xAICompletionFields));

export const mimoProviderOptions = createProviderOptions(createModelSettingsForm(openAICompletionFields));

export const mistralProviderOptions = createProviderOptions(createModelSettingsForm(mistralCompletionFields));

export const ollamaProviderOptions = createProviderOptions(createModelSettingsForm(ollamaCompletionFields), {
  ProviderSettingsForm: EmptyProviderSettingsForm,
});

export const builtinLLMProviderOptions: Array<[string, LLMProviderOptions]> = [
  ['google-genai', googleGenAIProviderOptions],
  ['openai', openaiResponsesProviderOptions],
  ['anthropic', anthropicProviderOptions],
  ['openai-completions', openaiCompletionsProviderOptions],
  ['deepseek', deepseekProviderOptions],
  ['dashscope', dashscopeProviderOptions],
  ['ollama', ollamaProviderOptions],
  ['kimi', kimiProviderOptions],
  ['xai', xaiProviderOptions],
  ['mimo', mimoProviderOptions],
  ['mistral', mistralProviderOptions],
];

const builtinLLMProviderModelOptionFields = new Map<string, OptionField[]>([
  ['google-genai', googleGenAICompletionFields],
  ['openai', openAIResponsesFields],
  ['anthropic', qwenCompletionFields],
  ['openai-completions', openAICompletionFields],
  ['deepseek', deepSeekCompletionFields],
  ['dashscope', qwenCompletionFields],
  ['ollama', ollamaCompletionFields],
  ['kimi', qwenCompletionFields],
  ['xai', xAICompletionFields],
  ['mimo', openAICompletionFields],
  ['mistral', mistralCompletionFields],
]);

export const getBuiltinLLMProviderModelOptionFields = (provider?: string): OptionField[] =>
  provider ? builtinLLMProviderModelOptionFields.get(provider) ?? [] : [];

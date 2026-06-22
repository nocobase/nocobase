/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentType } from 'react';

import type { LLMProviderOptions } from '../../../manager/ai-manager';
import { anthropicProviderOptions } from '../../../llm-providers/anthropic';
import { dashscopeProviderOptions } from '../../../llm-providers/dashscope';
import { deepseekProviderOptions } from '../../../llm-providers/deepseek';
import { googleGenAIProviderOptions } from '../../../llm-providers/google-genai';
import { kimiProviderOptions } from '../../../llm-providers/kimi';
import { mimoProviderOptions } from '../../../llm-providers/mimo';
import { ollamaProviderOptions } from '../../../llm-providers/ollama';
import { openaiCompletionsProviderOptions } from '../../../llm-providers/openai/completions';
import { openaiResponsesProviderOptions } from '../../../llm-providers/openai/responses';
import { xaiProviderOptions } from '../../../llm-providers/xai';

const legacyWorkflowProviderOptions = new Map<string, LLMProviderOptions>([
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
]);

export const getLegacyWorkflowModelSettingsForm = (provider: string): ComponentType | undefined => {
  return legacyWorkflowProviderOptions.get(provider)?.components?.ModelSettingsForm;
};

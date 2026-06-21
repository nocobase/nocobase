/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProviderMeta, SupportedModel } from '../../manager/ai-manager';
import { OpenAICompletionsProvider } from './completions';
import { OpenAiEmbeddingProvider as embedding } from './embedding';
import { OpenAIResponsesProvider } from './responses';

const commonProperties: Pick<LLMProviderMeta, 'supportedModel' | 'models'> = {
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  models: {
    [SupportedModel.LLM]: [
      'gpt-5',
      'gpt-4.1',
      'gpt-4o',
      'chatgpt-4o',
      'o4-mini',
      'o3',
      'o3-pro',
      'o3-mini',
      'o1',
      'o1-pro',
      'o1-mini',
      'o3-deep-research',
      'o4-mini-deep-research',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-4o-search-preview',
      'gpt-4o-mini-search-preview',
    ],
    [SupportedModel.EMBEDDING]: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  },
};

export const openaiResponsesProviderOptions: LLMProviderMeta = {
  ...commonProperties,
  embedding,
  title: 'OpenAI',
  provider: OpenAIResponsesProvider,
  supportWebSearch: true,
};

export const openaiCompletionsProviderOptions: LLMProviderMeta = {
  ...commonProperties,
  embedding,
  title: 'OpenAI (completions)',
  provider: OpenAICompletionsProvider,
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatXAI } from '@langchain/xai';
import { LLMProvider } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';

export class XAIProvider extends LLMProvider {
  declare chatModel: ChatXAI;

  get baseURL() {
    return 'https://api.x.ai/v1';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput, ...restModelOptions } = this.modelOptions || {};
    const { schema } = structuredOutput || {};

    // xAI Grok models don't support these OpenAI-specific parameters
    // Filter them out to avoid 400 errors
    const unsupportedParams = [
      'presencePenalty',
      'frequencyPenalty',
      'presence_penalty',
      'frequency_penalty',
      'logitBias',
      'logit_bias',
      'topLogprobs',
      'top_logprobs',
    ];
    const filteredModelOptions = Object.fromEntries(
      Object.entries(restModelOptions).filter(([key]) => !unsupportedParams.includes(key)),
    );

    const responseFormatOptions = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = schema;
    }

    return new ChatXAI({
      apiKey,
      ...filteredModelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
      },
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
    });
  }
}

export const xaiProviderOptions: LLMProviderMeta = {
  title: 'xAI',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: [
      'grok-4',
      'grok-4-1',
      'grok-4-1-fast',
      'grok-4-1-fast-non-reasoning',
      'grok-3',
      'grok-3-fast',
      'grok-3-fast-beta',
      'grok-3-beta',
      'grok-3-mini',
      'grok-3-mini-fast',
      'grok-3-mini-beta',
      'grok-3-mini-fast-beta',
      'grok-2',
      'grok-2-vision',
      'grok-vision-beta',
    ],
  },
  provider: XAIProvider,
};

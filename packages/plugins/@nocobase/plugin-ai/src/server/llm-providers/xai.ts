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

    // ChatXAI strips xAI-incompatible OpenAI penalty/logit parameters internally.

    const responseFormatOptions = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = schema;
    }

    return new ChatXAI({
      apiKey,
      ...restModelOptions,
      baseURL: baseURL || this.baseURL,
      modelKwargs: {
        response_format: responseFormatOptions,
      },
    } as any);
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

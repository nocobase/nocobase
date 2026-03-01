/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatOpenAI } from '@langchain/openai';
import { LLMProvider } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';

export class KimiProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;

  get baseURL() {
    return 'https://api.moonshot.cn/v1';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { schema } = structuredOutput || {};
    const responseFormatOptions = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = schema;
    }
    return new ChatOpenAI({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
        thinking: { type: 'disabled' },
      },
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
    });
  }
}

export const kimiProviderOptions: LLMProviderMeta = {
  title: 'Kimi',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: ['kimi-k2.5', 'kimi-k2-0905-Preview', 'kimi-k2-turbo-preview'],
  },
  provider: KimiProvider,
};

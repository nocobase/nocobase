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

export class OpenAIProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;

  get baseURL() {
    return 'https://api.openai.com/v1';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { schema } = structuredOutput || {};
    const responseFormatOptions = {
      type: responseFormat,
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = schema;
    }
    return new ChatOpenAI({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
      },
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
      verbose: true,
    });
  }
}

export const openaiProviderOptions = {
  title: 'OpenAI',
  provider: OpenAIProvider,
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { LLMProvider, EmbeddingProvider } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { EmbeddingsInterface } from '@langchain/core/embeddings';

const OPENAI_URL = 'https://api.openai.com/v1';

export class OpenAIProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;

  get baseURL() {
    return OPENAI_URL;
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

export class OpenAiEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return OPENAI_URL;
  }

  createEmbedding(): EmbeddingsInterface {
    return new OpenAIEmbeddings({
      configuration: {
        baseURL: this.baseUrl ?? '',
        apiKey: this.apiKey,
      },
      model: this.model,
    });
  }
}

export const openaiProviderOptions: LLMProviderMeta = {
  title: 'OpenAI',
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  models: {
    [SupportedModel.LLM]: [
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
  provider: OpenAIProvider,
  embedding: OpenAiEmbeddingProvider,
};

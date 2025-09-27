/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingProvider, LLMProvider } from './provider';
import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { SupportedModel } from '../manager/ai-manager';

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

export class DashscopeProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;

  get baseURL() {
    return DASHSCOPE_URL;
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
      verbose: false,
    });
  }
}

export class DashscopeEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return DASHSCOPE_URL;
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

export const dashscopeProviderOptions = {
  title: '{{t("Dashscope", {ns: "ai"})}}',
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  models: {
    [SupportedModel.LLM]: [
      'qwen-long',
      'qwq-plus',
      'qwen-max',
      'qwen-plus',
      'qwen-turbo',
      'qwen-math-plus',
      'qwen-math-turbo',
      'qwen-coder-plus',
      'qwen-coder-turbo',
    ],
    [SupportedModel.EMBEDDING]: [
      'text-embedding-v4',
      'text-embedding-v3',
      'text-embedding-v2',
      'text-embedding-v1',
      'text-embedding-async-v2',
      'text-embedding-async-v1',
    ],
  },
  provider: DashscopeProvider,
  embedding: DashscopeEmbeddingProvider,
};

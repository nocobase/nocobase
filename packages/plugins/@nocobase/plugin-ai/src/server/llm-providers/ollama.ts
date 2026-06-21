/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { LLMProvider, EmbeddingProvider } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { serverRequest } from '@nocobase/utils';

const OLLAMA_DEFAULT_URL = 'http://localhost:11434';

export class OllamaProvider extends LLMProvider {
  declare chatModel: ChatOllama;

  get baseURL() {
    return OLLAMA_DEFAULT_URL;
  }

  createModel() {
    const { model, temperature, topP, topK, numPredict, ...rest } = this.modelOptions || {};

    return new ChatOllama({
      baseUrl: this.getResolvedBaseURL(),
      model: model || 'mistral-nemo:12b',
      temperature,
      topP,
      topK,
      numPredict,
      ...rest,
      verbose: false,
      format: undefined,
      keepAlive: '5m',
    });
  }

  async listModels(): Promise<{
    models?: { id: string }[];
    code?: number;
    errMsg?: string;
  }> {
    let url: string;
    try {
      url = this.buildRequestURL('api/tags');
    } catch (e) {
      return { code: 400, errMsg: e instanceof Error ? e.message : String(e) };
    }
    if (!url) {
      return { code: 400, errMsg: 'baseURL is required' };
    }

    try {
      const res = await serverRequest({
        method: 'GET',
        url,
      });
      const models = res?.data?.models || [];

      return {
        models: models.map((model) => ({
          id: model.name,
        })),
      };
    } catch (e) {
      return {
        code: 500,
        errMsg: `Failed to fetch Ollama models: ${
          e.message
        }. Make sure Ollama is running at ${this.getResolvedBaseURL()}`,
      };
    }
  }
}

export class OllamaEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return OLLAMA_DEFAULT_URL;
  }

  createEmbedding(): EmbeddingsInterface {
    return new OllamaEmbeddings({
      baseUrl: this.baseURL,
      model: this.model,
    });
  }
}

export const ollamaProviderOptions: LLMProviderMeta = {
  title: 'Ollama',
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  models: {
    [SupportedModel.LLM]: [],
    [SupportedModel.EMBEDDING]: [],
  },
  provider: OllamaProvider,
  embedding: OllamaEmbeddingProvider,
};

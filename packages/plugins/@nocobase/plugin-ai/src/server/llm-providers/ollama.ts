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
import axios from 'axios';

const OLLAMA_DEFAULT_URL = 'http://localhost:11434';

export class OllamaProvider extends LLMProvider {
  declare chatModel: ChatOllama;

  get baseURL() {
    return OLLAMA_DEFAULT_URL;
  }

  createModel() {
    const { baseURL } = this.serviceOptions || {};
    const { model, temperature, topP, topK, numPredict, ...rest } = this.modelOptions || {};

    return new ChatOllama({
      baseUrl: baseURL || this.baseURL,
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
    const options = this.serviceOptions || {};
    let baseURL = options.baseURL || this.baseURL;

    if (!baseURL) {
      return { code: 400, errMsg: 'baseURL is required' };
    }

    if (baseURL && baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }

    try {
      const res = await axios.get(`${baseURL}/api/tags`);
      const models = res?.data?.models || [];

      return {
        models: models.map((model) => ({
          id: model.name,
        })),
      };
    } catch (e) {
      return {
        code: 500,
        errMsg: `Failed to fetch Ollama models: ${e.message}. Make sure Ollama is running at ${baseURL}`,
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
      baseUrl: this.baseUrl,
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

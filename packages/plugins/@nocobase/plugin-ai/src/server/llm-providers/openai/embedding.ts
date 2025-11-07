/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingProvider } from '../provider';
import { EmbeddingsInterface } from '@langchain/core/embeddings';

export class OpenAiEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return 'https://api.openai.com/v1';
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

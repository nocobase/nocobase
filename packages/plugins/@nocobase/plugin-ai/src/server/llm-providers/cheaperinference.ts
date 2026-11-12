/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatOpenAI } from '@langchain/openai';
import { serverRequest } from '@nocobase/utils';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { LLMProvider } from './provider';

export type CheaperInferenceModel = {
  id: string;
  type?: string;
};

export function isTextModel(model: CheaperInferenceModel): boolean {
  return !model.type || model.type === 'text';
}

export class CheaperInferenceProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;

  get baseURL() {
    return 'https://api.cheaperinference.com/v1';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { name, schema } = structuredOutput || {};
    const responseFormatOptions: Record<string, unknown> = {
      type: responseFormat ?? 'text',
    };

    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions.json_schema = {
        schema,
        name: name ?? 'schema',
      };
    }

    return new ChatOpenAI({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
      },
      configuration: {
        baseURL: this.getResolvedBaseURL(),
      },
    });
  }

  async listModels(): Promise<{
    models?: { id: string }[];
    code?: number;
    errMsg?: string;
  }> {
    const { apiKey } = this.serviceOptions || {};
    let url: string;

    try {
      url = this.buildRequestURL('models');
    } catch (error) {
      return { code: 400, errMsg: error instanceof Error ? error.message : String(error) };
    }

    if (!apiKey) {
      return { code: 400, errMsg: 'API Key required' };
    }

    try {
      const response = await serverRequest({
        method: 'GET',
        url,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const models = Array.isArray(response?.data?.data) ? (response.data.data as CheaperInferenceModel[]) : [];

      return {
        models: models.filter(isTextModel).map(({ id }) => ({ id })),
      };
    } catch (error) {
      return {
        code: 500,
        errMsg: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const cheaperinferenceProviderOptions: LLMProviderMeta = {
  title: 'Cheaper Inference',
  supportedModel: [SupportedModel.LLM],
  provider: CheaperInferenceProvider,
};

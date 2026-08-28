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

const CHAT_COMPLETIONS_API = '/v1/chat/completions';

export type ShengSuanYunModel = {
  id: string;
  support_apis?: string[];
};

export function supportsChatCompletions(model: ShengSuanYunModel): boolean {
  return !Array.isArray(model.support_apis) || model.support_apis.includes(CHAT_COMPLETIONS_API);
}

export class ShengSuanYunProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;

  get baseURL() {
    return 'https://router.shengsuanyun.com/api/v1';
  }

  createModel() {
    const { apiKey, xTitle } = this.serviceOptions || {};
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
        ...(xTitle ? { defaultHeaders: { 'X-Title': xTitle } } : {}),
      },
    });
  }

  async listModels(): Promise<{
    models?: { id: string }[];
    code?: number;
    errMsg?: string;
  }> {
    const { apiKey, xTitle } = this.serviceOptions || {};
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
          ...(xTitle ? { 'X-Title': xTitle } : {}),
        },
      });
      const models = Array.isArray(response?.data?.data) ? (response.data.data as ShengSuanYunModel[]) : [];

      return {
        models: models.filter(supportsChatCompletions).map(({ id }) => ({ id })),
      };
    } catch (error) {
      return {
        code: 500,
        errMsg: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const shengsuanyunProviderOptions: LLMProviderMeta = {
  title: 'SSYCloud',
  supportedModel: [SupportedModel.LLM],
  provider: ShengSuanYunProvider,
};

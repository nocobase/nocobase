/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProvider } from './provider';
import { ChatAnthropic } from '@langchain/anthropic';
import axios from 'axios';

export class AnthropicProvider extends LLMProvider {
  declare chatModel: ChatAnthropic;

  get baseURL() {
    return 'https://api.anthropic.com/v1/';
  }

  createModel() {
    const { apiKey, baseURL } = this.serviceOptions || {};
    const { model } = this.modelOptions || {};

    return new ChatAnthropic({
      apiKey,
      ...this.modelOptions,
      model,
      anthropicApiUrl: baseURL || this.baseURL,
      verbose: true,
    });
  }

  async listModels(): Promise<{
    models?: { id: string }[];
    code?: number;
    errMsg?: string;
  }> {
    const options = this.serviceOptions || {};
    const apiKey = options.apiKey;
    let baseURL = options.baseURL || this.baseURL;
    if (!baseURL) {
      return { code: 400, errMsg: 'baseURL is required' };
    }
    if (!apiKey) {
      return { code: 400, errMsg: 'API Key required' };
    }
    if (baseURL && baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }
    try {
      if (baseURL && baseURL.endsWith('/')) {
        baseURL = baseURL.slice(0, -1);
      }
      const res = await axios.get(`${baseURL}/models`, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      return {
        models: res?.data?.data,
      };
    } catch (e) {
      return { code: 500, errMsg: e.message };
    }
  }
}

export const anthropicProviderOptions = {
  title: 'Anthropic',
  provider: AnthropicProvider,
};

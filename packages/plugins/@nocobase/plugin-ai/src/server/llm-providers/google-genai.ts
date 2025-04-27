/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { LLMProvider } from './provider';
import axios from 'axios';

export class GoogleGenAIProvider extends LLMProvider {
  declare chatModel: ChatGoogleGenerativeAI;

  get baseURL() {
    return 'https://generativelanguage.googleapis.com/v1beta/';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { model, responseFormat } = this.modelOptions || {};

    return new ChatGoogleGenerativeAI({
      apiKey,
      ...this.modelOptions,
      model,
      json: responseFormat === 'json',
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
      const res = await axios.get(`${baseURL}/models?key=${apiKey}`);
      return {
        models: res?.data?.models.map((model) => ({
          id: model.name,
        })),
      };
    } catch (e) {
      return { code: 500, errMsg: e.message };
    }
  }
}

export const googleGenAIProviderOptions = {
  title: 'Google generative AI',
  provider: GoogleGenAIProvider,
};

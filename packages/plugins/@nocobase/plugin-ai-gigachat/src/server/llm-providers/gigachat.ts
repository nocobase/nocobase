/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Agent } from 'node:https';
import GigaChat from 'gigachat';
import { GigaChat as GigaChatModel } from 'langchain-gigachat';
import { LLMProvider, LLMProviderMeta } from '@nocobase/plugin-ai';

type GigaChatOptions = {
  credentials: string;
  baseURL?: string;
  authURL?: string;
  scope?: 'GIGACHAT_API_PERS' | 'GIGACHAT_API_B2B' | 'GIGACHAT_API_CORP';
  enableSSL?: boolean;
};

export class GigaChatProvider extends LLMProvider {
  createModel() {
    const { credentials, baseURL, authURL, scope, enableSSL } = (this.serviceOptions as GigaChatOptions) || {};
    const { responseFormat } = this.modelOptions || {};
    const baseUrl = this.isUrlEmpty(baseURL) ? this.baseURL : baseURL;
    const authUrl = this.isUrlEmpty(authURL) ? this.authURL : authURL;
    const httpsAgent = new Agent({
      rejectUnauthorized: enableSSL ?? false,
    });

    return new GigaChatModel({
      credentials,
      baseUrl,
      authUrl,
      scope,
      ...this.modelOptions,
      invocationKwargs: {
        response_format: {
          type: responseFormat,
        },
      },
      httpsAgent,
    });
  }

  async listModels(): Promise<{
    models?: { id: string }[];
    code?: number;
    errMsg?: string;
  }> {
    try {
      const { credentials, baseURL, authURL, scope, enableSSL } = (this.serviceOptions as GigaChatOptions) || {};
      const baseUrl = this.isUrlEmpty(baseURL) ? this.baseURL : baseURL;
      const authUrl = this.isUrlEmpty(authURL) ? this.authURL : authURL;
      const httpsAgent = new Agent({
        rejectUnauthorized: enableSSL ?? false,
      });

      const giga = new GigaChat({
        credentials,
        baseUrl,
        authUrl,
        scope,
        httpsAgent,
      });
      const models = await giga.getModels();

      return { models: models.data };
    } catch (e) {
      return { code: 500, errMsg: e.message };
    }
  }

  get baseURL() {
    return 'https://gigachat.devices.sberbank.ru/api/v1';
  }

  get authURL() {
    return 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  }

  private isUrlEmpty(baseURL: string) {
    return !baseURL || baseURL === null || baseURL.trim().length === 0;
  }
}

export const gigaChatProviderOptions: LLMProviderMeta = {
  title: 'GigaChat',
  provider: GigaChatProvider,
};

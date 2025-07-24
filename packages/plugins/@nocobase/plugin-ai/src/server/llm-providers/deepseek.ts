/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatDeepSeek } from '@langchain/deepseek';
import { LLMProvider } from './provider';
import { LLMProviderMeta } from '../manager/ai-manager';

export class DeepSeekProvider extends LLMProvider {
  declare chatModel: ChatDeepSeek;

  get baseURL() {
    return 'https://api.deepseek.com';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat } = this.modelOptions || {};

    return new ChatDeepSeek({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: {
          type: responseFormat,
        },
      },
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
      verbose: true,
    });
  }
}

export const deepseekProviderOptions: LLMProviderMeta = {
  title: 'DeepSeek',
  provider: DeepSeekProvider,
};

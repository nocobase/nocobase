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
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { Context } from '@nocobase/actions';
import PluginAIServer from '../plugin';
import path from 'node:path';

export class DeepSeekProvider extends LLMProvider {
  declare chatModel: ChatDeepSeek;

  get baseURL() {
    return 'https://api.deepseek.com';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat } = this.modelOptions || {};

    const modelKwargs: Record<string, any> = {};

    // Only set response_format when responseFormat is explicitly provided
    if (responseFormat) {
      modelKwargs['response_format'] = {
        type: responseFormat,
      };
    }

    return new ChatDeepSeek({
      apiKey,
      ...this.modelOptions,
      modelKwargs,
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
      verbose: false,
    });
  }

  async parseAttachment(ctx: Context, attachment: any): Promise<any> {
    if (!attachment?.mimetype || attachment.mimetype.startsWith('image/')) {
      return super.parseAttachment(ctx, attachment);
    }
    const parsed = await this.aiPlugin.documentParserManager.load(attachment);
    const safeFilename = attachment.filename ? path.basename(attachment.filename) : 'document';
    if (!parsed.supported || !parsed.text) {
      return {
        placement: 'system',
        content: `File ${safeFilename} is not a supported document type for text parsing.`,
      };
    }
    return {
      placement: 'system',
      content: `<parsed_document filename="${safeFilename}">\n${parsed.text}\n</parsed_document>`,
    };
  }

  private get aiPlugin(): PluginAIServer {
    return this.app.pm.get('ai');
  }
}

export const deepseekProviderOptions: LLMProviderMeta = {
  title: 'DeepSeek',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: ['deepseek-chat', 'deepseek-reasoner'],
  },
  provider: DeepSeekProvider,
};

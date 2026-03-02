/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { ChatOpenAI } from '@langchain/openai';
import { Context } from '@nocobase/actions';
import PluginAIServer from '../../plugin';
import { LLMProvider, LLMProviderOptions } from '../provider';
import { LLMProviderMeta, SupportedModel } from '../../manager/ai-manager';
import { CachedDocumentLoader } from '../../document-loader';
import { KimiDocumentLoader } from './document-loader';

export class KimiProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;
  private _documentLoader: CachedDocumentLoader;

  get baseURL() {
    return 'https://api.moonshot.cn/v1';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { schema } = structuredOutput || {};
    const responseFormatOptions = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = schema;
    }
    return new ChatOpenAI({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
        thinking: { type: 'disabled' },
      },
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
    });
  }

  async parseAttachment(ctx: Context, attachment: any): Promise<any> {
    if (!attachment?.mimetype || attachment.mimetype.startsWith('image/')) {
      return super.parseAttachment(ctx, attachment);
    }
    const parsed = await this.documentLoader.load(attachment);
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

  private get documentLoader() {
    if (!this._documentLoader) {
      const loader = new KimiDocumentLoader(this.aiPlugin.fileManager, {
        apiKey: this.serviceOptions?.apiKey,
        baseURL: this.serviceOptions?.baseURL || this.baseURL,
      });
      this._documentLoader = new CachedDocumentLoader(this.aiPlugin, {
        loader,
        parserVersion: 'kimi-v1',
        parsedMimetype: 'application/json',
        parsedFileExtname: 'json',
        supports: () => true,
      });
    }

    return this._documentLoader;
  }
}

export const kimiProviderOptions: LLMProviderMeta = {
  title: 'Kimi',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: ['kimi-k2.5', 'kimi-k2-0905-Preview', 'kimi-k2-turbo-preview'],
  },
  provider: KimiProvider,
};

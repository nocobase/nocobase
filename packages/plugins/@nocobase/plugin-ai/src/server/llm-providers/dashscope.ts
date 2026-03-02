/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessageChunk } from '@langchain/core/messages';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingProvider, LLMProvider } from './provider';
import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { SupportedModel } from '../manager/ai-manager';
import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import _ from 'lodash';
import PluginAIServer from '../plugin';
import path from 'node:path';
import { ReasoningChatOpenAI } from './common/reasoning';

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

export class DashscopeProvider extends LLMProvider {
  declare chatModel: ReasoningChatOpenAI;

  get baseURL() {
    return DASHSCOPE_URL;
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { schema } = structuredOutput || {};

    const modelKwargs: Record<string, any> = {};

    // Only set response_format when responseFormat is explicitly provided
    // Dashscope API rejects { type: undefined }
    if (responseFormat) {
      const responseFormatOptions: Record<string, any> = {
        type: responseFormat,
      };
      if (responseFormat === 'json_schema' && schema) {
        responseFormatOptions['json_schema'] = schema;
      }
      modelKwargs['response_format'] = responseFormatOptions;
    } else {
      modelKwargs['response_format'] = { type: 'text' };
    }

    if (this.modelOptions?.builtIn?.webSearch === true) {
      // enable platform's web search ability
      // ref: https://bailian.console.aliyun.com/?tab=doc#/doc/?type=model&url=2867560
      modelKwargs['enable_search'] = true;
      modelKwargs['search_options'] = { forced_search: true };
    }

    return new ReasoningChatOpenAI({
      apiKey,
      ...this.modelOptions,
      modelKwargs,
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
      verbose: false,
    });
  }

  parseResponseMessage(message: Model) {
    const result = super.parseResponseMessage(message);
    if (['user', 'tool'].includes(result?.role)) {
      return result;
    }
    const { metadata } = message?.toJSON() ?? {};
    if (!_.isEmpty(metadata?.additional_kwargs?.reasoning_content)) {
      result.content = {
        ...(result.content ?? {}),
        reasoning: {
          status: 'stop',
          content: metadata?.additional_kwargs.reasoning_content,
        },
      };
    }
    return result;
  }

  parseReasoningContent(chunk: AIMessageChunk): { status: string; content: string } {
    if (!_.isEmpty(chunk?.additional_kwargs?.reasoning_content)) {
      return {
        status: 'streaming',
        content: chunk.additional_kwargs.reasoning_content as string,
      };
    }
    return null;
  }

  async parseAttachment(ctx: Context, attachment: any): Promise<any> {
    if (!attachment?.mimetype || attachment.mimetype.startsWith('image/')) {
      return super.parseAttachment(ctx, attachment);
    }
    const parsed = await this.aiPlugin.documentLoaders.cached.load(attachment);
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

export class DashscopeEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return DASHSCOPE_URL;
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

export const dashscopeProviderOptions = {
  title: '{{t("Dashscope", {ns: "ai"})}}',
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  supportWebSearch: true,
  models: {
    [SupportedModel.LLM]: [
      'qwen-long',
      'qwq-plus',
      'qwen-max',
      'qwen-plus',
      'qwen-turbo',
      'qwen-math-plus',
      'qwen-math-turbo',
      'qwen-coder-plus',
      'qwen-coder-turbo',
    ],
    [SupportedModel.EMBEDDING]: [
      'text-embedding-v4',
      'text-embedding-v3',
      'text-embedding-v2',
      'text-embedding-v1',
      'text-embedding-async-v2',
      'text-embedding-async-v1',
    ],
  },
  provider: DashscopeProvider,
  embedding: DashscopeEmbeddingProvider,
};

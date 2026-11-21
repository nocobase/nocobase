/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProvider } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import _ from 'lodash';
import { convertCompletionsDeltaToBaseMessageChunk } from '@langchain/openai';
import { AIMessageChunk, BaseMessageChunk } from '@langchain/core/messages';
import { ReasoningChatOpenAI } from './common/reasoning';
import { AttachmentModel } from '@nocobase/plugin-file-manager';
import { Model } from '@nocobase/database';

export class AtlasCloudProvider extends LLMProvider {
  declare chatModel: ReasoningChatOpenAI;

  get baseURL() {
    return 'https://api.atlascloud.ai/v1';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { name, schema } = structuredOutput || {};
    const responseFormatOptions: Record<string, any> = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = { schema, name: name ?? 'schema' };
    }

    return new ChatAtlasCloudCompletions({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
      },
      configuration: {
        baseURL: this.getResolvedBaseURL(),
        defaultHeaders: this.getDefaultHeaders(),
      },
    });
  }

  protected isApiSupportedAttachment(attachment: AttachmentModel): boolean {
    const media = ['image/'];
    return media.some((it) => attachment?.mimetype?.startsWith(it));
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
}

class ChatAtlasCloudCompletions extends ReasoningChatOpenAI {
  _convertCompletionsDeltaToBaseMessageChunk(delta, rawResponse, defaultRole): BaseMessageChunk {
    const chunk = convertCompletionsDeltaToBaseMessageChunk({
      delta,
      rawResponse,
      includeRawResponse: this.__includeRawResponse,
      defaultRole,
    });

    if (chunk instanceof AIMessageChunk) {
      if (delta.reasoning_content) {
        chunk.additional_kwargs.reasoning_content = delta.reasoning_content;
      }
    }

    return chunk;
  }
}

export const atlascloudProviderOptions: LLMProviderMeta = {
  title: 'Atlas Cloud',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: [
      'deepseek-ai/DeepSeek-V3.1-Terminus',
      'deepseek-ai/DeepSeek-V3.1',
      'Qwen/Qwen3-235B-A22B-Instruct-2507',
      'anthropic/claude-opus-5',
      'moonshotai/kimi-k2.6',
      'zai-org/GLM-4.6',
    ],
  },
  provider: AtlasCloudProvider,
};

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
import { AIMessageChunk } from '@langchain/core/messages';
import { ReasoningChatOpenAI } from './common/reasoning';
import { AttachmentModel } from '@nocobase/plugin-file-manager';
import { Model } from '@nocobase/database';

export class OpperProvider extends LLMProvider {
  declare chatModel: ReasoningChatOpenAI;

  get baseURL() {
    return 'https://api.opper.ai/v3/compat';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { name, schema } = structuredOutput || {};
    const responseFormatOptions: Record<string, unknown> = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions.json_schema = { schema, name: name ?? 'schema' };
    }

    return new ReasoningChatOpenAI({
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
    return attachment.mimetype?.startsWith('image/') ?? false;
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

  parseReasoningContent(chunk: AIMessageChunk): { status: string; content: string } | null {
    if (!_.isEmpty(chunk?.additional_kwargs?.reasoning_content)) {
      return {
        status: 'streaming',
        content: chunk.additional_kwargs.reasoning_content as string,
      };
    }
    return null;
  }
}

export const opperProviderOptions: LLMProviderMeta = {
  title: 'Opper',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: [
      'claude-sonnet-4-6',
      'claude-opus-5',
      'gpt-5.5',
      'gpt-5.4-mini',
      'gemini-3.8-flash',
      'deepseek-v4-pro',
      'kimi-k3',
      'mistral-large-2512',
    ],
  },
  provider: OpperProvider,
};
